import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppUpsertSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = await prisma.app.findUnique({
    where: { id },
    include: { category: true, releases: { orderBy: { versionCode: "desc" } } },
  });
  if (!app) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ app });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = AppUpsertSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await prisma.app.update({
    where: { id },
    data: {
      ...parsed.data,
      categoryId:
        parsed.data.categoryId === undefined ? undefined : parsed.data.categoryId,
    },
  });
  return NextResponse.json({ app: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.app.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}



