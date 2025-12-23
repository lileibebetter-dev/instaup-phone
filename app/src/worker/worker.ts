import { Worker } from "bullmq";
import { getRedisUrl } from "@/lib/queue";
import { syncUpstreamOnce } from "./syncUpstream";

const redisUrl = getRedisUrl();

if (!redisUrl) {
  console.error("REDIS_URL is not set; worker cannot start.");
  process.exit(1);
}

console.log("Worker starting. redis:", redisUrl);

const worker = new Worker(
  "sync",
  async (job) => {
    if (job.name === "upstream:sync") {
      await syncUpstreamOnce();
      return { ok: true };
    }
    throw new Error(`Unknown job: ${job.name}`);
  },
  { connection: { url: redisUrl }, concurrency: 1 },
);

worker.on("completed", (job) => {
  console.log(`job completed: ${job.id} ${job.name}`);
});

worker.on("failed", (job, err) => {
  console.error(`job failed: ${job?.id} ${job?.name}`, err);
});



