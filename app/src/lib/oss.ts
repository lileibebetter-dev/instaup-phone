import OSS from "ali-oss";
import { z } from "zod";

const OssEnvSchema = z.object({
  OSS_REGION: z.string().min(1),
  OSS_BUCKET: z.string().min(1),
  OSS_ACCESS_KEY_ID: z.string().min(1),
  OSS_ACCESS_KEY_SECRET: z.string().min(1),
  OSS_PUBLIC_BASE_URL: z.string().url().optional(),
});

type OssEnv = z.infer<typeof OssEnvSchema>;

let cachedEnv: OssEnv | null = null;

function getEnv(): OssEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = OssEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `OSS env invalid: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getOssClient() {
  const env = getEnv();
  return new OSS({
    region: env.OSS_REGION,
    bucket: env.OSS_BUCKET,
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  });
}

export function ossPublicUrl(objectKey: string) {
  const env = getEnv();
  if (env.OSS_PUBLIC_BASE_URL) {
    return `${env.OSS_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey.replace(/^\//, "")}`;
  }
  // Fallback: not always publicly accessible, but still useful.
  return `https://${env.OSS_BUCKET}.${env.OSS_REGION}.aliyuncs.com/${objectKey.replace(/^\//, "")}`;
}

export async function ossUploadFile(params: {
  objectKey: string;
  filePath: string;
  contentType?: string;
}) {
  const client = getOssClient();
  const res = await client.put(params.objectKey, params.filePath, {
    headers: params.contentType ? { "Content-Type": params.contentType } : undefined,
  });
  return {
    objectKey: res.name,
    etag: res.etag,
    url: ossPublicUrl(res.name),
  };
}



