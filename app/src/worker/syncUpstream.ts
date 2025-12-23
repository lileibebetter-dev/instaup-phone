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
  iconUrl?: string; // upstream icon url (absolute)
};

function absUrl(href: string, base: string) {
  return new URL(href, base).toString();
}

function isLikelyImageUrl(href: string) {
  const h = href.trim();
  if (!h) return false;
  if (h.startsWith("data:")) return false;
  const lower = h.toLowerCase();
  return (
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes(".svg") ||
    lower.includes("icon")
  );
}

async function fetchText(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} url=${url}`);
  return await res.text();
}

function extractAppsFromListHtml(html: string, baseUrl: string): UpstreamApp[] {
  const $ = cheerio.load(html);
  const apps: UpstreamApp[] = [];

  // Strategy 1: upstream list page uses .app-card with .app-icon/img and .app-name.
  // This avoids accidentally picking global images (e.g. QR codes) from outer containers.
  const appCards = $(".app-card");
  if (appCards.length > 0) {
    appCards.each((_, el) => {
      const card = $(el);
      const href = card.attr("href");
      const name = card.find(".app-name").first().text().trim();
      if (!name) return;

      const rawIcon =
        card.find(".app-icon img").first().attr("src") ||
        card.find(".app-icon img").first().attr("data-src") ||
        card.find(".app-icon img").first().attr("data-original") ||
        "";
      const iconUrl = rawIcon && isLikelyImageUrl(rawIcon) ? absUrl(rawIcon, baseUrl) : undefined;

      const labelText =
        card.find(".app-tag,.tag,.label").first().text().trim() ||
        card.text().replace(/\s+/g, " ").trim();
      const labelMatch = labelText.match(/(官方开发|第三方工具|root必备)/);
      const label = labelMatch?.[1];

      const description =
        card.find(".app-description").first().text().trim() ||
        card.find("p").first().text().trim() ||
        "";

      apps.push({
        name,
        label,
        description,
        detailUrl: href ? absUrl(href, baseUrl) : undefined,
        iconUrl,
      });
    });
  } else {
    // Strategy 1 (fallback): cards that contain a “查看详情” link
    $("a")
      .filter((_, el) => $(el).text().includes("查看详情"))
      .each((_, el) => {
        const href = $(el).attr("href");
        // Prefer the closest "card-like" container; avoid grabbing the entire page wrapper.
        const card =
          $(el).closest(".app-card,.card,.item")?.first() ||
          $(el).closest("a")?.first() ||
          $(el).parent();

        const rawIcon =
          card.find("img").first().attr("src") ||
          card.find("img").first().attr("data-src") ||
          card.find("img").first().attr("data-original") ||
          "";
        const iconUrl = rawIcon && isLikelyImageUrl(rawIcon) ? absUrl(rawIcon, baseUrl) : undefined;
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
          iconUrl,
        });
      });
  }

  // Strategy 2 (fallback): headings that look like app names
  if (apps.length === 0) {
    $("h1,h2,h3,h4,strong").each((_, el) => {
      const name = $(el).text().trim();
      if (!name) return;
      const card = $(el).closest("div");
      const text = card.text().replace(/\s+/g, " ").trim();
      const labelMatch = text.match(/(官方开发|第三方工具|root必备)/);
      const rawIcon =
        card.find("img").first().attr("src") ||
        card.find("img").first().attr("data-src") ||
        card.find("img").first().attr("data-original") ||
        "";
      const iconUrl = rawIcon && isLikelyImageUrl(rawIcon) ? absUrl(rawIcon, baseUrl) : undefined;
      apps.push({ name, label: labelMatch?.[1], description: text, iconUrl });
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

function contentTypeFromExt(ext: string) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function findIconLinkFromDetailPage(detailUrl: string, appName?: string) {
  const html = await fetchText(detailUrl);
  const $ = cheerio.load(html);
  const candidates = $("img")
    .map((_, el) => $(el).attr("src") ?? "")
    .get()
    .map((h) => h.trim())
    .filter((h) => !!h && isLikelyImageUrl(h));

  if (candidates.length === 0) return null;

  const lowerName = (appName ?? "").trim().toLowerCase();
  const pick = candidates
    .map((h) => {
      const l = h.toLowerCase();
      let score = 0;
      if (l.includes("icon")) score += 3;
      if (l.includes("logo")) score += 2;
      if (lowerName && l.includes(lowerName)) score += 2;
      if (l.includes(".svg")) score += 1;
      if (l.includes(".png")) score += 1;
      return { h, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.h;

  return pick ? absUrl(pick, detailUrl) : null;
}

async function downloadToTempFile(
  url: string,
  opts?: { fallbackExt?: string; fallbackBasename?: string },
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "yunmiaoda-sync-"));
  const filename = (() => {
    try {
      const u = new URL(url);
      const base = path.basename(u.pathname);
      if (base) return base;
      const ext = opts?.fallbackExt ?? "";
      const name = opts?.fallbackBasename ?? `download-${crypto.randomUUID()}`;
      return ext && !name.endsWith(ext) ? `${name}${ext}` : name;
    } catch {
      const ext = opts?.fallbackExt ?? "";
      const name = opts?.fallbackBasename ?? `download-${crypto.randomUUID()}`;
      return ext && !name.endsWith(ext) ? `${name}${ext}` : name;
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
    // Treat common placeholder values as "not configured"
    const bucket = (process.env.OSS_BUCKET ?? "").toLowerCase();
    const keyId = (process.env.OSS_ACCESS_KEY_ID ?? "").toLowerCase();
    const keySecret = (process.env.OSS_ACCESS_KEY_SECRET ?? "").toLowerCase();
    const region = (process.env.OSS_REGION ?? "").toLowerCase();
    const looksPlaceholder =
      !bucket ||
      bucket.includes("your-bucket") ||
      keyId.includes("your-access-key") ||
      keySecret.includes("your-access-key") ||
      region.includes("oss-cn-hangzhou"); // often left as example in templates
    if (looksPlaceholder) throw new Error("OSS placeholder config detected");
    getOssClient();
    ossAvailable = true;
  } catch (e) {
    // OSS not configured, will skip APK uploads
  }

  const stats = {
    upstreamUrl,
    appsSeen: 0,
    appsUpserted: 0,
    appsDeactivated: 0,
    iconsUpdated: 0,
    iconsUploaded: 0,
    releasesCreated: 0,
    releasesSkipped: 0,
    ossUploadDisabledReason: "",
    errors: 0,
    ossAvailable,
  };

  try {
    const html = await fetchText(upstreamUrl);
    const apps = extractAppsFromListHtml(html, upstreamUrl);
    stats.appsSeen = apps.length;
    const iconUrlCounts = new Map<string, number>();
    for (const a of apps) {
      if (!a.iconUrl) continue;
      iconUrlCounts.set(a.iconUrl, (iconUrlCounts.get(a.iconUrl) ?? 0) + 1);
    }
    const seenAppSlugs = new Set<string>();

    for (const a of apps) {
      const categoryName = a.label || "应用";
      const categorySlug = safeSlug(categoryName, "cat");
      const canonicalSlug = safeSlug(a.name, "app");

      // Prefer an existing app (by name) to keep its slug stable (e.g. manual test slug like "ai-ai-ai"),
      // otherwise fall back to canonical slug derived from name.
      const candidates = await prisma.app.findMany({
        where: {
          OR: [
            { slug: canonicalSlug },
            { name: a.name },
            // Some legacy rows may have polluted names (e.g. name contains description/arrow).
            // Use a conservative contains() match to recover and normalize them.
            { name: { contains: a.name } },
          ],
        },
        select: { slug: true },
        take: 5,
      });
      const preferredExistingSlug =
        candidates.find((c) => c.slug && !c.slug.startsWith("app-"))?.slug ??
        candidates.find((c) => c.slug === canonicalSlug)?.slug ??
        candidates[0]?.slug ??
        canonicalSlug;

      const appSlug = preferredExistingSlug;
      seenAppSlugs.add(appSlug);

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
          status: "ACTIVE",
        },
        create: {
          name: a.name,
          slug: appSlug,
          description: a.description ?? "",
          categoryId: category.id,
          status: "ACTIVE",
        },
      });
      stats.appsUpserted += 1;

      // Sync icon (prefer list icon, fallback to detail page). If OSS is configured, upload icon to OSS.
      try {
        let upstreamIconUrl: string | null = a.iconUrl ?? null;

        // If the list-page icon is shared by multiple apps, it's often a placeholder.
        // In that case, prefer a more specific icon from the detail page (if available).
        if (a.detailUrl) {
          const isSharedListIcon = upstreamIconUrl
            ? (iconUrlCounts.get(upstreamIconUrl) ?? 0) > 1
            : false;
          if (!upstreamIconUrl || isSharedListIcon) {
            const detailIconUrl = await findIconLinkFromDetailPage(a.detailUrl, a.name);
            if (detailIconUrl) {
              upstreamIconUrl = detailIconUrl;
            }
          }
        }

        if (upstreamIconUrl) {
          if (ossAvailable) {
            const u = new URL(upstreamIconUrl);
            const ext = path.extname(u.pathname) || ".png";
            const { dir, filePath } = await downloadToTempFile(upstreamIconUrl, {
              fallbackExt: ext,
              fallbackBasename: `icon-${appSlug}`,
            });
            try {
              const { sha256 } = await sha256File(filePath);
              const objectKey = `icons/${appSlug}/${sha256.slice(0, 16)}${ext}`;
              try {
                const uploaded = await ossUploadFile({
                  objectKey,
                  filePath,
                  contentType: contentTypeFromExt(ext),
                });
                if (app.iconUrl !== uploaded.url) {
                  await prisma.app.update({
                    where: { id: app.id },
                    data: { iconUrl: uploaded.url },
                  });
                  stats.iconsUpdated += 1;
                }
                stats.iconsUploaded += 1;
              } catch (e: any) {
                // OSS looks configured but not usable (e.g. bucket missing) → disable uploads, fall back to upstream URL
                ossAvailable = false;
                stats.ossAvailable = false;
                stats.ossUploadDisabledReason =
                  (typeof e?.code === "string" && e.code) ||
                  (typeof e?.name === "string" && e.name) ||
                  "oss upload failed";
                if (app.iconUrl !== upstreamIconUrl) {
                  await prisma.app.update({
                    where: { id: app.id },
                    data: { iconUrl: upstreamIconUrl },
                  });
                  stats.iconsUpdated += 1;
                }
              }
            } finally {
              await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
            }
          } else {
            // No OSS: store absolute upstream URL directly.
            if (app.iconUrl !== upstreamIconUrl) {
              await prisma.app.update({
                where: { id: app.id },
                data: { iconUrl: upstreamIconUrl },
              });
              stats.iconsUpdated += 1;
            }
          }
        }
      } catch {
        // icon sync is best-effort
      }

      if (!a.detailUrl) continue;
      
      // Skip APK download/upload if OSS is not configured
      if (!ossAvailable) {
        continue;
      }
      
      const apkUrl = await findApkLinkFromDetailPage(a.detailUrl);
      if (!apkUrl) continue;

      // Download → hash/size → check duplicates → upload → create Release
      const { dir, filePath, filename } = await downloadToTempFile(apkUrl, { fallbackExt: ".apk" });
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

        let uploaded: { url: string } | null = null;
        try {
          uploaded = await ossUploadFile({
            objectKey,
            filePath,
            contentType: "application/vnd.android.package-archive",
          });
        } catch (e: any) {
          // OSS looks configured but not usable → disable and skip remaining uploads
          ossAvailable = false;
          stats.ossAvailable = false;
          stats.ossUploadDisabledReason =
            (typeof e?.code === "string" && e.code) ||
            (typeof e?.name === "string" && e.name) ||
            "oss upload failed";
          stats.releasesSkipped += 1;
          continue;
        }

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

    // Strict align with upstream: deactivate apps not present in the latest upstream list.
    // Frontend only shows ACTIVE apps, so "extra" local apps will disappear after this.
    if (seenAppSlugs.size > 0) {
      const deactivated = await prisma.app.updateMany({
        where: {
          status: "ACTIVE",
          slug: { notIn: Array.from(seenAppSlugs) },
        },
        data: { status: "INACTIVE" },
      });
      stats.appsDeactivated = deactivated.count;
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




