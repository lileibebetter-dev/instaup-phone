import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      category: true,
      releases: { orderBy: { versionCode: "desc" }, take: 20 },
    },
  });

  if (!app || app.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    app: {
      id: app.id,
      name: app.name,
      slug: app.slug,
      description: app.description,
      developer: app.developer,
      tags: app.tags,
      iconUrl: app.iconUrl,
      category: app.category
        ? { id: app.category.id, name: app.category.name, slug: app.category.slug }
        : null,
      releases: app.releases.map((r) => ({
        id: r.id,
        versionName: r.versionName,
        versionCode: r.versionCode,
        changelog: r.changelog,
        apkSize: r.apkSize.toString(),
        apkSha256: r.apkSha256,
        downloadUrl: r.downloadUrl,
        publishedAt: r.publishedAt,
      })),
    },
  });
}



