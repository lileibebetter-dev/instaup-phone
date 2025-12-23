import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppUpsertSchema } from "@/lib/schemas";

export async function GET() {
  const apps = await prisma.app.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      category: true,
      _count: { select: { releases: true } },
    },
  });
  return NextResponse.json({ apps });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = AppUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.app.create({
    data: {
      ...parsed.data,
      categoryId: parsed.data.categoryId ?? null,
    },
  });
  return NextResponse.json({ app: created }, { status: 201 });
}



