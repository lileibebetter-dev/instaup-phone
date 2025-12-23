import { Queue } from "bullmq";
import { z } from "zod";

const EnvSchema = z.object({
  REDIS_URL: z.string().url().optional(),
});

export function getRedisUrl() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) return undefined;
  return parsed.data.REDIS_URL;
}

export function getSyncQueue() {
  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;
  return new Queue("sync", { connection: { url: redisUrl } });
}



