"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={async () => {
          setLoading(true);
          setMsg(null);
          try {
            const res = await fetch("/api/admin/sync/run", { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setMsg(data?.error ?? "同步失败");
              return;
            }
            setMsg(data?.mode === "queue" ? `已入队：${data.jobId}` : "已开始同步（inline）");
            router.refresh();
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "同步中..." : "立即同步"}
      </button>
      {msg ? <div className="text-sm text-zinc-600">{msg}</div> : null}
    </div>
  );
}



