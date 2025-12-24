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
    <div
      className="relative overflow-hidden rounded-3xl border border-sky-200/50 bg-white/70 shadow-[0_18px_60px_-46px_rgba(2,132,199,0.35)] backdrop-blur-xl"
      onClick={() => setPaused((v) => !v)}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPaused((v) => !v);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/40 via-white/20 to-indigo-50/30" />
      <video
        ref={ref}
        className="relative z-10 aspect-video w-full scale-[1.2] cursor-pointer select-none object-cover object-center"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        autoPlay={!prefersReducedMotion}
      />
    </div>
  );
}


