import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      category: true,
      releases: { orderBy: { versionCode: "desc" }, take: 30 },
    },
  });

  if (!app || app.status !== "ACTIVE") return notFound();

  const latest = app.releases[0] ?? null;
  
  // 获取当前主机名用于生成完整的下载URL
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  // 构建完整的下载URL（如果是相对路径，则转换为绝对路径）
  const downloadUrl = latest?.downloadUrl
    ? latest.downloadUrl.startsWith("http")
      ? latest.downloadUrl
      : `${baseUrl}${latest.downloadUrl}`
    : null;
  
  // 二维码API URL
  const qrCodeUrl = downloadUrl ? `/api/qrcode?url=${encodeURIComponent(downloadUrl)}` : null;

  return (
    <div className="min-h-screen text-slate-950">
      <header className="border-b border-sky-200/40 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200/60 bg-white/55 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm shadow-sky-200/40 transition hover:border-sky-300/70 hover:bg-white/75"
            >
              ← 返回
            </Link>
            <Link href="/" className="font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                云秒嗒AI手机下载中心
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            首页
          </Link>
          {app.category ? (
            <>
              {" "}
              /{" "}
              <Link
                href={`/?category=${encodeURIComponent(app.category.slug)}`}
                className="hover:underline"
              >
                {app.category.name}
              </Link>
            </>
          ) : null}{" "}
          / {app.name}
        </div>

        <div className="relative mt-3 overflow-hidden rounded-2xl border border-sky-200/40 bg-white/55 p-8 shadow-[0_12px_40px_-22px_rgba(2,132,199,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-sky-400/18 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-indigo-500/12 blur-3xl" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{app.name}</h1>
              <div className="mt-2 text-sm text-slate-600">
                {app.developer ? `来源：${app.developer}` : null}
                {app.developer && app.category ? " · " : null}
                {app.category ? `分类：${app.category.name}` : null}
              </div>
              <p className="mt-4 max-w-3xl text-slate-700">
                {app.description || "暂无简介"}
              </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-sky-200/40 bg-white/55 p-5 shadow-[0_10px_35px_-26px_rgba(2,132,199,0.45)] backdrop-blur-xl">
              <div className="text-sm font-medium">下载</div>
              {latest?.downloadUrl && downloadUrl ? (
                <>
                  <div className="mt-2 text-xs text-slate-600">
                    最新版本：{latest.versionName}（{latest.versionCode}）
                  </div>
                  <a
                    href={latest.downloadUrl}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-300/40 transition hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500"
                    target="_blank"
                    rel="noreferrer"
                  >
                    立即下载
                  </a>
                  {qrCodeUrl ? (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="mb-2 text-xs text-slate-600">
                        或使用手机扫描二维码下载
                      </div>
                      <div className="rounded-xl border border-sky-200/50 bg-white/70 p-3 shadow-sm shadow-sky-100/60">
                        <img
                          src={qrCodeUrl}
                          alt="下载二维码"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  ) : null}
                  {latest.apkSha256 ? (
                    <div className="mt-3 break-all rounded-xl border border-sky-200/40 bg-white/70 p-3 text-xs text-slate-700">
                      sha256: {latest.apkSha256}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-2 text-sm text-slate-600">
                  暂无可下载版本（请联系管理员或稍后再试）。
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-sky-200/40 bg-white/55 p-6 shadow-[0_12px_40px_-26px_rgba(2,132,199,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">版本历史</div>
            <div className="text-xs text-slate-500">最近 {app.releases.length} 条</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">版本</th>
                  <th className="py-2 pr-3">更新说明</th>
                  <th className="py-2 pr-3">下载</th>
                </tr>
              </thead>
              <tbody>
                {app.releases.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-sky-200/35 align-top transition hover:bg-sky-600/5"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium">
                        {r.versionName}（{r.versionCode}）
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.publishedAt ? new Date(r.publishedAt).toLocaleString() : "-"}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {r.changelog ? (
                        <pre className="whitespace-pre-wrap text-sm">{r.changelog}</pre>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {r.downloadUrl ? (
                        <a
                          href={r.downloadUrl}
                          className="text-sm font-medium text-slate-950 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          下载
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {app.releases.length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-slate-500" colSpan={3}>
                      暂无版本记录。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}




