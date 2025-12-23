import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let app = null;
  let categories = [];
  let dbError = false;

  try {
    [app, categories] = await Promise.all([
      prisma.app.findUnique({
        where: { id },
        include: { category: true, releases: { orderBy: { versionCode: "desc" }, take: 50 } },
      }),
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  if (!app && !dbError) return notFound();
  const appSlug = app?.slug || "";

  async function updateApp(formData: FormData) {
    "use server";
    try {
      const name = String(formData.get("name") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      const developer = String(formData.get("developer") ?? "").trim();
      const iconUrl = String(formData.get("iconUrl") ?? "").trim();
      const categoryId = String(formData.get("categoryId") ?? "").trim();
      const status = String(formData.get("status") ?? "ACTIVE").trim() as
        | "ACTIVE"
        | "INACTIVE";

      await prisma.app.update({
        where: { id },
        data: {
          name,
          description,
          developer,
          iconUrl,
          categoryId: categoryId ? categoryId : null,
          status,
        },
      });
      revalidatePath(`/admin/apps/${id}`);
      revalidatePath("/admin/apps");
    } catch (error) {
      console.error("Failed to update app:", error);
    }
  }

  async function addRelease(formData: FormData) {
    "use server";
    try {
      const versionName = String(formData.get("versionName") ?? "").trim();
      const versionCode = Number(formData.get("versionCode") ?? 0);
      const downloadUrl = String(formData.get("downloadUrl") ?? "").trim();
      const changelog = String(formData.get("changelog") ?? "").trim();
      if (!versionName || !versionCode || !downloadUrl) return;

      await prisma.release.create({
        data: {
          appId: id,
          versionName,
          versionCode,
          downloadUrl,
          changelog,
          publishedAt: new Date(),
        },
      });
      revalidatePath(`/admin/apps/${id}`);
      revalidatePath(`/apps/${appSlug}`);
    } catch (error) {
      console.error("Failed to add release:", error);
    }
  }

  async function deleteRelease(formData: FormData) {
    "use server";
    try {
      const releaseId = String(formData.get("releaseId") ?? "").trim();
      if (!releaseId) return;
      await prisma.release.delete({ where: { id: releaseId } });
      revalidatePath(`/admin/apps/${id}`);
      revalidatePath(`/apps/${appSlug}`);
    } catch (error) {
      console.error("Failed to delete release:", error);
    }
  }

  if (dbError || !app) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/admin/apps" className="hover:underline">
              应用
            </Link>{" "}
            / 详情
          </div>
          <h1 className="mt-1 text-xl font-semibold">应用详情</h1>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠️ {dbError ? "数据库连接失败，无法加载应用数据。请确保 PostgreSQL 数据库正在运行。" : "应用不存在或已被删除。"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/admin/apps" className="hover:underline">
              应用
            </Link>{" "}
            / {app.name}
          </div>
          <h1 className="mt-1 text-xl font-semibold">{app.name}</h1>
          <div className="mt-1 text-sm text-zinc-600">{app.slug}</div>
        </div>
        <Link
          href={`/apps/${app.slug}`}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          前台详情
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">应用信息</div>
          <form action={updateApp} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-zinc-600">名称</div>
              <input
                name="name"
                defaultValue={app.name}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">开发者/来源</div>
              <input
                name="developer"
                defaultValue={app.developer}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="例如：官方开发"
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">图标 URL</div>
              <input
                name="iconUrl"
                defaultValue={app.iconUrl}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">分类</div>
              <select
                name="categoryId"
                defaultValue={app.categoryId ?? ""}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
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
                defaultValue={app.status}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">简介</div>
              <textarea
                name="description"
                defaultValue={app.description}
                rows={4}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              保存
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">新增版本（手动）</div>
          <p className="mt-1 text-xs text-zinc-500">
            一般由“一键同步”自动新增版本；这里用于紧急补录。
          </p>
          <form action={addRelease} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs text-zinc-600">versionName</div>
                <input
                  name="versionName"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                  placeholder="例如：6.19.07"
                  required
                />
              </label>
              <label className="block">
                <div className="text-xs text-zinc-600">versionCode</div>
                <input
                  name="versionCode"
                  type="number"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                  placeholder="例如：61907"
                  required
                />
              </label>
            </div>
            <label className="block">
              <div className="text-xs text-zinc-600">下载链接（OSS/CDN）</div>
              <input
                name="downloadUrl"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="https://..."
                required
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">更新说明</div>
              <textarea
                name="changelog"
                rows={3}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            <button className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              添加版本
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">版本列表</div>
          <div className="text-xs text-zinc-500">最近 {app.releases.length} 条</div>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-3">版本</th>
                <th className="py-2 pr-3">下载</th>
                <th className="py-2 pr-3">发布时间</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {app.releases.map((r) => (
                <tr key={r.id} className="border-t border-black/5">
                  <td className="py-2 pr-3">
                    <div className="font-medium">
                      {r.versionName} ({r.versionCode})
                    </div>
                    {r.apkSha256 ? (
                      <div className="break-all text-xs text-zinc-500">
                        sha256: {r.apkSha256}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">
                    {r.downloadUrl ? (
                      <a
                        href={r.downloadUrl}
                        className="text-sm text-zinc-950 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        下载
                      </a>
                    ) : (
                      "-"
                    )}
                    {r.upstreamUrl ? (
                      <div className="mt-1">
                        <a
                          href={r.upstreamUrl}
                          className="text-xs text-zinc-500 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          上游链接
                        </a>
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-sm text-zinc-600">
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleString() : "-"}
                  </td>
                  <td className="py-2 pr-3">
                    <form action={deleteRelease}>
                      <input type="hidden" name="releaseId" value={r.id} />
                      <button className="text-xs text-red-700 hover:underline">
                        删除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {app.releases.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-500" colSpan={4}>
                    暂无版本。你可以点击“同步”拉取上游版本，或在上方手动添加。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




