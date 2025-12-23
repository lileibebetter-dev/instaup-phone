import * as cheerio from "cheerio";
import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { ReadableStream as WebReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";

import { prisma } from "@/lib/prisma";
import { ossUploadFile, getOssClient } from "@/lib/oss";
import { sha256File } from "@/lib/hash";
import { safeSlug } from "@/lib/slug";

type UpstreamApp = {
  name: string;
  label?: string; // 官方开发 / 第三方工具 / root必备 ...
  description?: string;
  detailUrl?: string;
};

function absUrl(href: string, base: string) {
  return new URL(href, base).toString();
}

async function fetchText(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} url=${url}`);
  return await res.text();
}

function extractAppsFromListHtml(html: string, baseUrl: string): UpstreamApp[] {
  const $ = cheerio.load(html);
  const apps: UpstreamApp[] = [];

  // Strategy 1: cards that contain a “查看详情” link
  $("a")
    .filter((_, el) => $(el).text().includes("查看详情"))
    .each((_, el) => {
      const href = $(el).attr("href");
      const card = $(el).closest("div");
      const name =
        card.find("h1,h2,h3,h4,strong").first().text().trim() ||
        $(el).closest("a").text().replace("查看详情", "").trim();
      if (!name) return;

      const text = card.text().replace(/\s+/g, " ").trim();
      // Try to detect a short label (e.g. 官方开发/第三方工具/root必备)
      const labelMatch = text.match(/(官方开发|第三方工具|root必备)/);
      const label = labelMatch?.[1];

      // Try to detect description (first sentence after label)
      let description = card.find("p").first().text().trim();
      if (!description) {
        description = text;
      }

      apps.push({
        name,
        label,
        description,
        detailUrl: href ? absUrl(href, baseUrl) : undefined,
      });
    });

  // Strategy 2 (fallback): headings that look like app names
  if (apps.length === 0) {
    $("h1,h2,h3,h4,strong").each((_, el) => {
      const name = $(el).text().trim();
      if (!name) return;
      const card = $(el).closest("div");
      const text = card.text().replace(/\s+/g, " ").trim();
      const labelMatch = text.match(/(官方开发|第三方工具|root必备)/);
      apps.push({ name, label: labelMatch?.[1], description: text });
    });
  }

  // de-dup by name
  const seen = new Set<string>();
  return apps.filter((a) => {
    const k = a.name;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseVersionFromFilename(filename: string) {
  // Examples:
  // SCRM_V6.19.07.W-beta_61907-yijianshi-release.apk -> versionCode 61907, versionName 6.19.07
  const mCode = filename.match(/_(\d{3,})[-_.]/);
  const mName = filename.match(/V(\d+(?:\.\d+)+)/i);
  const versionCode = mCode ? Number(mCode[1]) : null;
  const versionName = mName ? mName[1] : null;
  return { versionCode, versionName };
}

async function findApkLinkFromDetailPage(detailUrl: string) {
  const html = await fetchText(detailUrl);
  const $ = cheerio.load(html);
  const link =
    $("a[href$='.apk']").attr("href") ||
    $("a")
      .map((_, el) => $(el).attr("href") ?? "")
      .get()
      .find((h) => h && h.toLowerCase().includes(".apk"));
  if (!link) return null;
  return absUrl(link, detailUrl);
}

async function downloadToTempFile(url: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "yunmiaoda-sync-"));
  const filename = (() => {
    try {
      const u = new URL(url);
      const base = path.basename(u.pathname);
      return base || `download-${crypto.randomUUID()}.apk`;
    } catch {
      return `download-${crypto.randomUUID()}.apk`;
    }
  })();
  const filePath = path.join(dir, filename);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const file = createWriteStream(filePath);
  const nodeStream = Readable.fromWeb(res.body as unknown as WebReadableStream);
  await pipeline(nodeStream, file);

  return { dir, filePath, filename };
}

export async function syncUpstreamOnce() {
  const upstreamUrl = process.env.UPSTREAM_URL ?? "https://down.imai.work/app/app.php";
  const syncLog = await prisma.syncLog.create({
    data: { status: "RUNNING", message: `sync start: ${upstreamUrl}` },
  });

  // Check if OSS is configured
  let ossAvailable = false;
  try {
    getOssClient();
    ossAvailable = true;
  } catch (e) {
    // OSS not configured, will skip APK uploads
  }

  const stats = {
    upstreamUrl,
    appsSeen: 0,
    appsUpserted: 0,
    releasesCreated: 0,
    releasesSkipped: 0,
    errors: 0,
    ossAvailable,
  };

  try {
    const html = await fetchText(upstreamUrl);
    const apps = extractAppsFromListHtml(html, upstreamUrl);
    stats.appsSeen = apps.length;

    for (const a of apps) {
      const categoryName = a.label || "应用";
      const categorySlug = safeSlug(categoryName, "cat");
      const appSlug = safeSlug(a.name, "app");

      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: { name: categoryName },
        create: { name: categoryName, slug: categorySlug },
      });

      const app = await prisma.app.upsert({
        where: { slug: appSlug },
        update: {
          name: a.name,
          description: a.description ?? "",
          categoryId: category.id,
        },
        create: {
          name: a.name,
          slug: appSlug,
          description: a.description ?? "",
          categoryId: category.id,
        },
      });
      stats.appsUpserted += 1;

      if (!a.detailUrl) continue;
      
      // Skip APK download/upload if OSS is not configured
      if (!ossAvailable) {
        continue;
      }
      
      const apkUrl = await findApkLinkFromDetailPage(a.detailUrl);
      if (!apkUrl) continue;

      // Download → hash/size → check duplicates → upload → create Release
      const { dir, filePath, filename } = await downloadToTempFile(apkUrl);
      try {
        const { sha256, size } = await sha256File(filePath);

        const existed = await prisma.release.findFirst({
          where: { appId: app.id, apkSha256: sha256 },
          select: { id: true },
        });
        if (existed) {
          stats.releasesSkipped += 1;
          continue;
        }

        const { versionCode, versionName } = parseVersionFromFilename(filename);
        const nextVersionCode =
          versionCode ??
          ((await prisma.release.findFirst({
            where: { appId: app.id },
            orderBy: { versionCode: "desc" },
            select: { versionCode: true },
          }))?.versionCode ?? 0) + 1;

        const resolvedVersionName = versionName ?? `v${nextVersionCode}`;
        const objectKey = `apks/${appSlug}/${resolvedVersionName}-${nextVersionCode}-${sha256.slice(0, 8)}.apk`;

        const uploaded = await ossUploadFile({
          objectKey,
          filePath,
          contentType: "application/vnd.android.package-archive",
        });

        await prisma.release.create({
          data: {
            appId: app.id,
            versionName: resolvedVersionName,
            versionCode: nextVersionCode,
            changelog: "",
            apkSize: BigInt(size),
            apkSha256: sha256,
            downloadUrl: uploaded.url,
            upstreamUrl: apkUrl,
            publishedAt: new Date(),
          },
        });
        stats.releasesCreated += 1;
      } finally {
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        message: ossAvailable ? "sync success" : "sync success (应用列表已同步，但跳过了APK上传，因为OSS未配置)",
        stats,
      },
    });
  } catch (e: unknown) {
    stats.errors += 1;
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message: e instanceof Error ? e.message : "sync failed",
        stats,
      },
    });
    throw e;
  }
}




