"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!username.trim() || !password.trim()) {
      setError("用户名和密码不能为空");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "INVALID_CREDENTIALS") {
          setError("用户名或密码错误");
        } else if (data?.error === "INVALID_INPUT") {
          setError("输入格式错误，请检查用户名和密码");
        } else {
          setError(data?.error ?? "登录失败");
        }
        return;
      }
      const next = sp.get("next") || "/admin/apps";
      router.replace(next);
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="font-semibold tracking-tight">管理员登录</div>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-950">
            返回前台
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            请输入管理员账号密码（来自环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`）。
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            默认凭据：用户名 <code className="rounded bg-zinc-100 px-1">admin</code>，密码 <code className="rounded bg-zinc-100 px-1">change-me</code>
          </p>
          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3">
            <label className="block">
              <div className="text-xs text-zinc-600">用户名</div>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="block">
              <div className="text-xs text-zinc-600">密码</div>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !username.trim() || !password.trim()}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}




