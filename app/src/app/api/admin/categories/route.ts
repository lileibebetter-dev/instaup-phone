import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategoryUpsertSchema } from "@/lib/schemas";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CategoryUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.category.create({ data: parsed.data });
  return NextResponse.json({ category: created }, { status: 201 });
}



