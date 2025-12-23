import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const syncLogs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ syncLogs });
}



