import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminAppsPage() {
  let apps = [];
  let categories = [];
  let dbError = false;

  try {
    [apps, categories] = await Promise.all([
      prisma.app.findMany({
        orderBy: { updatedAt: "desc" },
        include: { category: true, _count: { select: { releases: true } } },
        take: 500,
      }),
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  async function createApp(formData: FormData) {
    "use server";
    try {
      const name = String(formData.get("name") ?? "").trim();
      const slugInput = String(formData.get("slug") ?? "").trim();
      const categoryId = String(formData.get("categoryId") ?? "").trim();
      const status = String(formData.get("status") ?? "ACTIVE").trim() as
        | "ACTIVE"
        | "INACTIVE";
      const description = String(formData.get("description") ?? "").trim();

      if (!name) return;
      const slug = safeSlug(slugInput || name, "app");

      await prisma.app.create({
        data: {
          name,
          slug,
          description,
          status,
          categoryId: categoryId ? categoryId : null,
        },
      });
      revalidatePath("/admin/apps");
    } catch (error) {
      console.error("Failed to create app:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">应用管理</h1>
        <p className="mt-1 text-sm text-zinc-600">
          维护应用基础信息、查看版本数量；同步任务会自动新增/更新应用与版本。
        </p>
        {dbError ? (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            ⚠️ 数据库连接失败，无法加载数据。请确保 PostgreSQL 数据库正在运行。
            <div className="mt-2 text-xs">
              可以运行 <code className="rounded bg-yellow-100 px-1">docker-compose up -d postgres</code> 启动数据库。
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">新建应用</div>
          <form action={createApp} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-zinc-600">名称</div>
              <input
                name="name"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：AI销售"
                required
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">Slug（可留空自动生成）</div>
              <input
                name="slug"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：ai-sales"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">分类</div>
              <select
                name="categoryId"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                defaultValue=""
              >
                <option value="">（无）</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">状态</div>
              <select
                name="status"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                defaultValue="ACTIVE"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">简介</div>
              <textarea
                name="description"
                rows={3}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="一句话描述"
              />
            </label>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              创建
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">应用列表</div>
            <div className="text-xs text-zinc-500">共 {apps.length} 个</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">名称</th>
                  <th className="py-2 pr-3">分类</th>
                  <th className="py-2 pr-3">版本</th>
                  <th className="py-2 pr-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t border-black/5">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/admin/apps/${a.id}`}
                        className="font-medium text-zinc-950 hover:underline"
                      >
                        {a.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{a.slug}</div>
                    </td>
                    <td className="py-2 pr-3">{a.category?.name ?? "-"}</td>
                    <td className="py-2 pr-3">{a._count.releases}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-500" colSpan={4}>
                      还没有应用。你可以先手动创建，或去“同步”里点击“一键同步”。
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




