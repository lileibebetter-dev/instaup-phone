import { NextResponse } from "next/server";
import { getSyncQueue } from "@/lib/queue";
import { syncUpstreamOnce } from "@/worker/syncUpstream";

export async function POST() {
  const queue = getSyncQueue();
  if (!queue) {
    // Fallback: run inline (dev/demo)
    await syncUpstreamOnce();
    return NextResponse.json({ ok: true, mode: "inline" });
  }

  const job = await queue.add(
    "upstream:sync",
    {},
    {
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 24 * 3600, count: 1000 },
    },
  );

  return NextResponse.json({ ok: true, mode: "queue", jobId: job.id });
}



