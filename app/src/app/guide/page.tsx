import Link from "next/link";

export const dynamic = "force-dynamic";

export default function GuidePage() {
  const external = process.env.USER_GUIDE_URL?.trim() || "";

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-10 border-b border-sky-200/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">用户指引</div>
          <Link href="/" className="text-sm font-semibold text-sky-700 hover:underline">
            返回首页
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="rounded-2xl border border-sky-200/40 bg-white p-8 shadow-[0_18px_60px_-46px_rgba(2,132,199,0.35)]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            云秒嗒AI手机应用中心 · 使用指南
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            这里用于放置用户使用说明。后续可改成飞书文档链接或完善成更完整的新页面。
          </p>

          {external ? (
            <div className="mt-6 rounded-xl border border-sky-200/60 bg-sky-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">飞书/外部指引链接</div>
              <a
                href={external}
                className="mt-2 block break-all text-sm font-semibold text-sky-700 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {external}
              </a>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-sky-200/60 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              还未配置飞书链接。运维可在环境变量中设置 <code className="font-mono">USER_GUIDE_URL</code>{" "}
             （例如飞书文档 URL），此页将自动展示链接入口。
            </div>
          )}

          <div className="mt-8 grid gap-3">
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="text-sm font-semibold">1）下载应用</div>
              <div className="mt-1 text-sm text-slate-600">
                在首页选择应用，进入详情页后点击“立即下载”，或使用二维码用手机扫码下载。
              </div>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="text-sm font-semibold">2）常见问题</div>
              <div className="mt-1 text-sm text-slate-600">
                若下载链接不可用，请联系管理员检查同步状态与版本发布情况。
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


