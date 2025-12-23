import { z } from "zod";

export const CategoryUpsertSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母/数字/短横线"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export const AppUpsertSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母/数字/短横线"),
  description: z.string().max(2000).default(""),
  developer: z.string().max(200).default(""),
  tags: z.array(z.string().max(40)).default([]),
  iconUrl: z.string().max(2000).default(""),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  categoryId: z.string().cuid().nullable().optional(),
});

export const ReleaseCreateSchema = z.object({
  appId: z.string().cuid(),
  versionName: z.string().min(1).max(80),
  versionCode: z.number().int().min(1),
  changelog: z.string().max(8000).default(""),
  downloadUrl: z.string().max(2000).default(""),
  upstreamUrl: z.string().max(2000).default(""),
  apkSha256: z.string().max(128).default(""),
  apkSize: z
    .union([z.number().int().nonnegative(), z.bigint().nonnegative()])
    .default(0),
  publishedAt: z.string().datetime().optional(),
});





