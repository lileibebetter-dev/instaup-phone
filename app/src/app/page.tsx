import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { AnimatedTitle } from "./components/AnimatedTitle";
import { HeroVideo } from "./components/HeroVideo";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  const categoryFilter = categorySlug?.trim() || "";

  let categories = [];
  let apps = [];
  try {
    [categories, apps] = await Promise.all([
      prisma.category.findMany({
        where: { apps: { some: { status: "ACTIVE" } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.app.findMany({
        where: {
          status: "ACTIVE",
          ...(categoryFilter ? { category: { slug: categoryFilter } } : {}),
        },
        orderBy: [{ category: { sortOrder: "asc" } }, { updatedAt: "desc" }],
        include: {
          category: true,
          releases: { orderBy: { versionCode: "desc" }, take: 1 },
        },
        take: 500,
      }),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
    // 如果数据库连接失败，继续显示页面，只是应用列表为空
  }

  return (
    <div className="home-animated-bg min-h-screen text-slate-950">
      <header className="sticky top-0 z-10 border-b border-sky-200/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/logo2.png"
              alt="云秒嗒 INSTAUP"
              width={150}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="https://aiagent.instaup.cn/pc/"
              target="_blank"
              rel="noreferrer"
              className="px-1 text-[13px] font-semibold text-slate-700 transition hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2"
            >
              AI数智平台
            </a>
            <Link
              href="/guide"
              className="rounded-xl border border-sky-200/60 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 shadow-sm shadow-sky-100/70 transition hover:border-sky-300/70 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2"
            >
              用户指引
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="relative py-6">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="text-center md:text-left">
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                <AnimatedTitle text="云秒嗒AI手机应用中心" />
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                选择应用进入详情页下载，或扫码在手机上直接下载安装包。
              </p>
            </div>

            <div className="mx-auto w-full max-w-xl">
              <HeroVideo />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">全部应用</h2>
              {categoryFilter ? (
                <p className="mt-1 text-sm text-slate-600">
                  已筛选分类：{categoryFilter}
                </p>
              ) : null}
            </div>
            <div className="text-xs text-slate-500">共 {apps.length} 个</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className={`rounded-full border px-3 py-1 text-sm transition ${
                !categoryFilter
                  ? "border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-200/60"
                  : "border-sky-200/60 bg-white/50 text-slate-700 hover:border-sky-300/70 hover:bg-white/70"
              }`}
            >
              全部
            </Link>
            {categories.map((c) => {
              const active = c.slug === categoryFilter;
              return (
                <Link
                  key={c.id}
                  href={`/?category=${encodeURIComponent(c.slug)}`}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    active
                      ? "border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-200/60"
                      : "border-sky-200/60 bg-white/50 text-slate-700 hover:border-sky-300/70 hover:bg-white/70"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((a) => {
              const latest = a.releases[0];
              return (
                <div
                  key={a.id}
                  className="group relative overflow-hidden rounded-3xl border border-sky-200/45 bg-white p-6 shadow-[0_18px_60px_-46px_rgba(2,132,199,0.35)] transition hover:border-sky-300/70 hover:shadow-[0_22px_75px_-52px_rgba(2,132,199,0.45)]"
                >
                  <div className="flex h-full gap-5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-sky-200/50 bg-white/65 shadow-sm shadow-sky-200/40">
                      {a.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.iconUrl}
                          alt={`${a.name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-sky-50">
                          <span className="text-xl font-semibold text-slate-900">
                            {(a.name || "应用").slice(0, 1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 text-xl font-semibold tracking-tight text-slate-950">
                          {a.name}
                        </div>
                        <span className="rounded-full border border-sky-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-slate-700">
                          {a.category?.name ?? "未分类"}
                        </span>
                        {latest ? (
                          <span className="rounded-full border border-sky-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-slate-700">
                            最新 {latest.versionName}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {a.description || "暂无简介"}
                      </div>

                      <div className="mt-auto pt-6">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-xs text-slate-500">
                            {a.developer ? `来源：${a.developer}` : ""}
                          </div>
                          <Link
                            href={`/apps/${a.slug}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-500 hover:shadow-sky-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2"
                          >
                            查看详情 <span className="transition group-hover:translate-x-0.5">→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {apps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200/70 bg-white/55 p-6 text-sm text-slate-600 shadow-[0_12px_40px_-28px_rgba(2,132,199,0.45)] backdrop-blur-xl">
                暂无应用数据。请联系管理员在后台执行“一键同步”。
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
