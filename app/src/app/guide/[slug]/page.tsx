import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let guide: any = null;
  try {
    guide = await prisma.guide.findUnique({ where: { slug } });
  } catch (e) {
    console.error("Failed to load guide:", e);
  }

  if (!guide || guide.status !== "PUBLISHED") return notFound();

  const external = String(guide.externalUrl ?? "").trim();
  if (external) {
    redirect(external);
  }

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-10 border-b border-sky-200/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">用户指引</div>
          <Link href="/guide" className="text-sm font-semibold text-sky-700 hover:underline">
            返回指引列表
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <article className="rounded-2xl border border-sky-200/40 bg-white p-8 shadow-[0_18px_60px_-46px_rgba(2,132,199,0.35)]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            {guide.title}
          </h1>
          {guide.summary ? (
            <p className="mt-2 text-sm text-slate-600">{guide.summary}</p>
          ) : null}

          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {guide.content || "暂无内容。"}
          </div>
        </article>
      </main>
    </div>
  );
}


