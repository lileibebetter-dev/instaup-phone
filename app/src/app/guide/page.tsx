import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  // Backwards compatibility: a single env link can be shown as a pinned item.
  const envExternal = process.env.USER_GUIDE_URL?.trim() || "";

  let guides: any[] = [];
  try {
    guides = await prisma.guide.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 200,
    });
  } catch (e) {
    console.error("Failed to load guides:", e);
  }

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
          <p className="mt-2 text-sm text-slate-600">请选择你需要的指引文章。</p>

          <GuidesList guides={guides} envExternal={envExternal} />
        </section>
      </main>
    </div>
  );
}

function GuidesList({
  guides,
  envExternal,
}: {
  guides: any[];
  envExternal: string;
}) {
  return (
    <div className="mt-6 space-y-4">
      {envExternal ? (
        <a
          href={envExternal}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-sky-200/60 bg-sky-50 px-5 py-4 transition hover:bg-sky-100/60"
        >
          <div className="text-sm font-semibold text-slate-950">飞书指引总入口</div>
          <div className="mt-1 break-all text-xs text-slate-600">{envExternal}</div>
        </a>
      ) : null}

      <div className="grid gap-3">
        {guides.map((g: any) => {
          const isExternal = !!(g.externalUrl && String(g.externalUrl).trim());
          const href = isExternal ? g.externalUrl : `/guide/${g.slug}`;
          const rel = isExternal ? "noreferrer" : undefined;
          const target = isExternal ? "_blank" : undefined;
          return (
            <a
              key={g.id}
              href={href}
              target={target}
              rel={rel}
              className="group block rounded-2xl border border-black/5 bg-white px-5 py-4 transition hover:border-sky-200/60 hover:bg-sky-50/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-950">
                    {g.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {g.summary || (isExternal ? "外链指引（飞书/网页）" : "站内指引")}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-sky-700 transition group-hover:translate-x-0.5">
                  查看 →
                </div>
              </div>
            </a>
          );
        })}
        {guides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200/70 bg-white px-5 py-6 text-sm text-slate-600">
            暂无已上线的指引。请联系管理员在后台发布。
          </div>
        ) : null}
      </div>
    </div>
  );
}


