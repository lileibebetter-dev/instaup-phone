import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminGuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let guide: any = null;
  let dbError = false;

  try {
    guide = await prisma.guide.findUnique({ where: { id } });
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  if (!guide && !dbError) return notFound();

  async function updateGuide(formData: FormData) {
    "use server";
    try {
      const title = String(formData.get("title") ?? "").trim();
      const slugInput = String(formData.get("slug") ?? "").trim();
      const summary = String(formData.get("summary") ?? "").trim();
      const content = String(formData.get("content") ?? "").trim();
      const externalUrl = String(formData.get("externalUrl") ?? "").trim();
      const sortOrder = Number(formData.get("sortOrder") ?? 0);
      const status = String(formData.get("status") ?? "DRAFT").trim() as "DRAFT" | "PUBLISHED";

      if (!title) return;
      const slug = safeSlug(slugInput || title, "guide");

      const existing = await prisma.guide.findUnique({
        where: { id },
        select: { publishedAt: true },
      });

      await prisma.guide.update({
        where: { id },
        data: {
          title,
          slug,
          summary,
          content,
          externalUrl,
          sortOrder,
          status,
          publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : null,
        },
      });

      revalidatePath(`/admin/guides/${id}`);
      revalidatePath("/admin/guides");
      revalidatePath("/guide");
      revalidatePath(`/guide/${slug}`);
    } catch (error) {
      console.error("Failed to update guide:", error);
    }
  }

  if (dbError || !guide) {
    return (
      <div className="space-y-6">
        <div className="text-xs text-zinc-500">
          <Link href="/admin/guides" className="hover:underline">
            指引
          </Link>{" "}
          / 详情
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠️ {dbError ? "数据库连接失败，无法加载指引数据。" : "指引不存在或已被删除。"}
        </div>
      </div>
    );
  }

  const published = guide.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/admin/guides" className="hover:underline">
              指引
            </Link>{" "}
            / {guide.title}
          </div>
          <h1 className="mt-1 text-xl font-semibold">{guide.title}</h1>
          <div className="mt-1 text-sm text-zinc-600">{guide.slug}</div>
        </div>
        <Link
          href={`/guide/${guide.slug}`}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          target="_blank"
        >
          前台查看
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">编辑指引</div>
          <form action={updateGuide} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-zinc-600">标题</div>
              <input
                name="title"
                defaultValue={guide.title}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                required
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">Slug</div>
              <input
                name="slug"
                defaultValue={guide.slug}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">飞书/外链 URL（可选）</div>
              <input
                name="externalUrl"
                defaultValue={guide.externalUrl}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">摘要（可选）</div>
              <input
                name="summary"
                defaultValue={guide.summary}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs text-zinc-600">排序</div>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={guide.sortOrder}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                />
              </label>
              <label className="block">
                <div className="text-xs text-zinc-600">状态</div>
                <select
                  name="status"
                  defaultValue={guide.status}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">上线</option>
                </select>
              </label>
            </div>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              保存
            </button>
          </form>
          <div className="mt-3 text-xs text-zinc-500">
            当前状态：{published ? "上线" : "草稿"}
            {published && guide.publishedAt ? `（上线时间：${new Date(guide.publishedAt).toLocaleString()}）` : ""}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">内容（可选）</div>
          <p className="mt-1 text-xs text-zinc-500">
            如果填写外链 URL，前台会优先跳转外链；否则展示这里的文本内容。
          </p>
          <form action={updateGuide} className="mt-4 space-y-3">
            <input type="hidden" name="title" value={guide.title} />
            <input type="hidden" name="slug" value={guide.slug} />
            <input type="hidden" name="summary" value={guide.summary} />
            <input type="hidden" name="externalUrl" value={guide.externalUrl} />
            <input type="hidden" name="sortOrder" value={String(guide.sortOrder)} />
            <input type="hidden" name="status" value={guide.status} />

            <textarea
              name="content"
              defaultValue={guide.content}
              rows={14}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              placeholder="可粘贴指引正文（纯文本/Markdown 均可）。"
            />
            <button className="inline-flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
              保存内容
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


