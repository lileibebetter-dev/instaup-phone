import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  let guides = [];
  let dbError = false;

  try {
    guides = await prisma.guide.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  async function createGuide(formData: FormData) {
    "use server";
    try {
      const title = String(formData.get("title") ?? "").trim();
      const slugInput = String(formData.get("slug") ?? "").trim();
      const sortOrder = Number(formData.get("sortOrder") ?? 0);
      const externalUrl = String(formData.get("externalUrl") ?? "").trim();
      const summary = String(formData.get("summary") ?? "").trim();
      const status = String(formData.get("status") ?? "DRAFT").trim() as "DRAFT" | "PUBLISHED";

      if (!title) return;
      const slug = safeSlug(slugInput || title, "guide");

      await prisma.guide.create({
        data: {
          title,
          slug,
          summary,
          externalUrl,
          status,
          sortOrder,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
      revalidatePath("/admin/guides");
      revalidatePath("/guide");
    } catch (error) {
      console.error("Failed to create guide:", error);
    }
  }

  async function deleteGuide(formData: FormData) {
    "use server";
    try {
      const id = String(formData.get("id") ?? "").trim();
      if (!id) return;
      await prisma.guide.delete({ where: { id } });
      revalidatePath("/admin/guides");
      revalidatePath("/guide");
    } catch (error) {
      console.error("Failed to delete guide:", error);
    }
  }

  async function togglePublish(formData: FormData) {
    "use server";
    try {
      const id = String(formData.get("id") ?? "").trim();
      const nextStatus = String(formData.get("nextStatus") ?? "").trim() as
        | "DRAFT"
        | "PUBLISHED";
      if (!id || (nextStatus !== "DRAFT" && nextStatus !== "PUBLISHED")) return;
      await prisma.guide.update({
        where: { id },
        data: {
          status: nextStatus,
          publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
        },
      });
      revalidatePath("/admin/guides");
      revalidatePath("/guide");
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">用户指引管理</h1>
        <p className="mt-1 text-sm text-zinc-600">
          维护前台“用户指引”内容。支持飞书链接（外链）或在详情页展示文本内容。
        </p>
        {dbError ? (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            ⚠️ 数据库连接失败，无法加载数据。请确保 PostgreSQL 数据库正在运行。
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">新增指引</div>
          <form action={createGuide} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-zinc-600">标题</div>
              <input
                name="title"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：AI销售使用指南"
                required
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">Slug（可留空自动生成）</div>
              <input
                name="slug"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：ai-sales-guide"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">飞书/外链 URL（可选）</div>
              <input
                name="externalUrl"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="https://oxi2wwky3kh.feishu.cn/wiki/..."
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">摘要（可选）</div>
              <input
                name="summary"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="一句话说明这篇指引讲什么"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs text-zinc-600">排序（越小越靠前）</div>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={0}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                />
              </label>
              <label className="block">
                <div className="text-xs text-zinc-600">状态</div>
                <select
                  name="status"
                  defaultValue="DRAFT"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">上线</option>
                </select>
              </label>
            </div>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              创建
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">指引列表</div>
            <div className="text-xs text-zinc-500">共 {guides.length} 篇</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">标题</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">排序</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {guides.map((g: any) => {
                  const published = g.status === "PUBLISHED";
                  return (
                    <tr key={g.id} className="border-t border-black/5 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{g.title}</div>
                        <div className="text-xs text-zinc-500">{g.slug}</div>
                        {g.externalUrl ? (
                          <div className="mt-1 break-all text-xs text-zinc-500">
                            {g.externalUrl}
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <Link
                            href={`/admin/guides/${g.id}`}
                            className="font-medium text-zinc-900 hover:underline"
                          >
                            编辑
                          </Link>
                          <Link
                            href={`/guide/${g.slug}`}
                            className="text-zinc-600 hover:underline"
                            target="_blank"
                          >
                            前台查看
                          </Link>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                            published
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          {published ? "上线" : "草稿"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-600">{g.sortOrder}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center justify-end gap-3">
                          <form action={togglePublish}>
                            <input type="hidden" name="id" value={g.id} />
                            <input
                              type="hidden"
                              name="nextStatus"
                              value={published ? "DRAFT" : "PUBLISHED"}
                            />
                            <button className="text-xs text-sky-700 hover:underline">
                              {published ? "下线" : "上线"}
                            </button>
                          </form>
                          <form action={deleteGuide}>
                            <input type="hidden" name="id" value={g.id} />
                            <button className="text-xs text-red-700 hover:underline">
                              删除
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {guides.length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-500" colSpan={4}>
                      暂无指引。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


