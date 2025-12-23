import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories = [];
  let dbError = false;

  try {
    categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 500,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  async function createCategory(formData: FormData) {
    "use server";
    try {
      const name = String(formData.get("name") ?? "").trim();
      const slugInput = String(formData.get("slug") ?? "").trim();
      const sortOrder = Number(formData.get("sortOrder") ?? 0);
      if (!name) return;
      const slug = safeSlug(slugInput || name, "cat");
      await prisma.category.create({ data: { name, slug, sortOrder } });
      revalidatePath("/admin/categories");
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    try {
      const id = String(formData.get("id") ?? "").trim();
      if (!id) return;
      await prisma.category.delete({ where: { id } });
      revalidatePath("/admin/categories");
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">分类管理</h1>
        <p className="mt-1 text-sm text-zinc-600">
          分类用于前台筛选与展示，同步也会自动创建常见分类（如官方开发/第三方工具）。
        </p>
        {dbError ? (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            ⚠️ 数据库连接失败，无法加载数据。请确保 PostgreSQL 数据库正在运行。
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">新建分类</div>
          <form action={createCategory} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-zinc-600">名称</div>
              <input
                name="name"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：官方开发"
                required
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">Slug（可留空自动生成）</div>
              <input
                name="slug"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：official"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">排序（越小越靠前）</div>
              <input
                name="sortOrder"
                type="number"
                defaultValue={0}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              创建
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">分类列表</div>
            <div className="text-xs text-zinc-500">共 {categories.length} 个</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">名称</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">排序</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-black/5">
                    <td className="py-2 pr-3 font-medium">{c.name}</td>
                    <td className="py-2 pr-3 text-zinc-600">{c.slug}</td>
                    <td className="py-2 pr-3 text-zinc-600">{c.sortOrder}</td>
                    <td className="py-2 pr-3">
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="text-xs text-red-700 hover:underline">
                          删除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-500" colSpan={4}>
                      暂无分类。
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




