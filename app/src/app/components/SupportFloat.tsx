"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export function SupportFloat() {
  const pathname = usePathname();
  const hidden = pathname?.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    return (
      process.env.NEXT_PUBLIC_SUPPORT_QR_SRC ||
      "/brand/kefu-wecom.png" // preferred: user-provided QR
    );
  });

  const qrSrc = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_SUPPORT_QR_SRC ||
      "/brand/kefu-wecom.png"
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div
          ref={panelRef}
          className="w-[280px] overflow-hidden rounded-2xl border border-sky-200/60 bg-white/85 shadow-[0_22px_70px_-40px_rgba(2,132,199,0.45)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-sky-100/70 px-4 py-3">
            <div className="text-sm font-semibold text-slate-950">客服</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-white text-slate-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="text-sm font-semibold text-slate-950">
              企业微信客服
            </div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              扫码添加客服，获取安装/使用帮助。
            </div>

            <div className="mt-4 flex items-center justify-center rounded-2xl border border-sky-100 bg-white p-3">
              {/* Use <img> so we can gracefully fallback if the png isn't present yet. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt="企业微信二维码"
                className="h-[180px] w-[180px] rounded-xl object-cover"
                loading="lazy"
                onError={() => {
                  // Fallback to placeholder (always present in repo)
                  if (imgSrc !== "/brand/kefu-wecom.svg") {
                    setImgSrc("/brand/kefu-wecom.svg");
                  }
                }}
              />
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              如需替换二维码：把图片放到
              <span className="font-mono"> public/brand/kefu-wecom.png </span>
              或设置
              <span className="font-mono"> NEXT_PUBLIC_SUPPORT_QR_SRC </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-sky-200/60 bg-white/80 text-slate-900 shadow-lg shadow-sky-200/40 backdrop-blur-xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="打开客服"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/kefu-cat.svg"
            alt=""
            className="h-7 w-7 opacity-90 transition group-hover:opacity-100"
          />
          <span className="sr-only">客服</span>
        </button>
      </div>
    </div>
  );
}


