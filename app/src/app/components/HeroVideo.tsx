"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

export function HeroVideo({
  src = "/hero/cat-phone.mp4",
  poster,
}: {
  src?: string;
  poster?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  // If user prefers reduced motion, start paused.
  useEffect(() => {
    if (!prefersReducedMotion) return;
    setPaused(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      // Some browsers may reject play() even if muted; ignore.
      v.play().catch(() => {});
    }
  }, [paused]);

  const ariaLabel = useMemo(() => (paused ? "播放视频" : "暂停视频"), [paused]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/50 bg-white/70 shadow-[0_18px_60px_-46px_rgba(2,132,199,0.35)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/40 via-white/20 to-indigo-50/30" />
      <video
        ref={ref}
        className="relative z-10 aspect-video w-full scale-[1.2] object-cover object-center"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        autoPlay={!prefersReducedMotion}
      />

      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 rounded-xl bg-slate-950/85 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2"
        aria-label={ariaLabel}
      >
        {paused ? "播放" : "暂停"}
      </button>
    </div>
  );
}


