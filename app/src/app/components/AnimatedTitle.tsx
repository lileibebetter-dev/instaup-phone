"use client";

import { useMemo } from "react";

function CatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 26l-6-8v16c0 12 9 22 20 22s20-10 20-22V18l-6 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 34c2 2 4 3 6 3s4-1 6-3"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="24" cy="30" r="2" fill="currentColor" />
      <circle cx="40" cy="30" r="2" fill="currentColor" />
      <path
        d="M32 31l-2 3h4l-2-3z"
        fill="currentColor"
      />
      <path
        d="M14 38c3-2 6-3 9-3M50 38c-3-2-6-3-9-3"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AnimatedTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Use a deterministic duration variance per title to avoid synchronized motion across pages.
  const duration = useMemo(() => {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    const base = 8.5;
    return base + (h % 20) / 10; // 8.5s ~ 10.4s
  }, [text]);

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <span className="relative z-10">{text}</span>

      {/* cat */}
      <span
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ width: "100%", height: "0" }}
        aria-hidden="true"
      >
        <span
          className="cat-walk absolute -top-7 left-0"
          style={{ animationDuration: `${duration}s` }}
        >
          <CatIcon className="h-6 w-6 text-slate-900 drop-shadow-[0_6px_12px_rgba(56,189,248,0.25)]" />
        </span>
      </span>
    </div>
  );
}


