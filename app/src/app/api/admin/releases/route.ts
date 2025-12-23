import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReleaseCreateSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const appId = url.searchParams.get("appId");

  const releases = await prisma.release.findMany({
    where: appId ? { appId } : undefined,
    orderBy: { versionCode: "desc" },
    take: 200,
  });
  return NextResponse.json({ releases });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = ReleaseCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.release.create({
    data: {
      appId: parsed.data.appId,
      versionName: parsed.data.versionName,
      versionCode: parsed.data.versionCode,
      changelog: parsed.data.changelog,
      downloadUrl: parsed.data.downloadUrl,
      upstreamUrl: parsed.data.upstreamUrl,
      apkSha256: parsed.data.apkSha256,
      apkSize: typeof parsed.data.apkSize === "bigint"
        ? parsed.data.apkSize
        : BigInt(parsed.data.apkSize),
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null,
    },
  });

  return NextResponse.json({ release: created }, { status: 201 });
}



