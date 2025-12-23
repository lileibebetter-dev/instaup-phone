import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.app.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: {
      category: true,
      releases: { orderBy: { versionCode: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    apps: apps.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      description: a.description,
      developer: a.developer,
      tags: a.tags,
      iconUrl: a.iconUrl,
      category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
      latestRelease: a.releases[0]
        ? {
            id: a.releases[0].id,
            versionName: a.releases[0].versionName,
            versionCode: a.releases[0].versionCode,
            downloadUrl: a.releases[0].downloadUrl,
            publishedAt: a.releases[0].publishedAt,
          }
        : null,
    })),
  });
}



