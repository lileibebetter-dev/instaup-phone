import Link from "next/link";
import { LogoutButton } from "./logout-button";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="font-semibold tracking-tight">云秒嗒后台</div>
            <nav className="hidden items-center gap-3 text-sm text-zinc-600 sm:flex">
              <Link href="/admin/apps" className="hover:text-zinc-950">
                应用
              </Link>
              <Link href="/admin/categories" className="hover:text-zinc-950">
                分类
              </Link>
              <Link href="/admin/sync" className="hover:text-zinc-950">
                同步
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-950">
              前台
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}




