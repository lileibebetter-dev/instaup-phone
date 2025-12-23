"use client";

import { useState } from "react";

export default function BuyForm() {
  const [contact, setContact] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, orderNo, note, amount: 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error ?? "提交失败");
        return;
      }
      setMsg("提交成功：管理员核对后会联系你发放卡密。");
      setContact("");
      setOrderNo("");
      setNote("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium">提交付款信息</div>
      <div className="mt-1 text-xs text-zinc-500">提交后将进入后台订单列表。</div>
      {msg ? (
        <div className="mt-3 rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {msg}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        <label className="block">
          <div className="text-xs text-zinc-600">联系方式（微信/手机号）</div>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            placeholder="例如：wxid_xxx / 138xxxx"
          />
        </label>
        <label className="block">
          <div className="text-xs text-zinc-600">订单号/转账备注</div>
          <input
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            placeholder="例如：微信支付订单号"
          />
        </label>
        <label className="block">
          <div className="text-xs text-zinc-600">备注</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            placeholder="购买数量/套餐等"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "提交中..." : "提交"}
        </button>
      </div>
    </div>
  );
}



