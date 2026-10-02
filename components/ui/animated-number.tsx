"use client";

import { useEffect, useRef, useState } from "react";

/** Smoothly ease a numeric value toward its target so 15s refreshes update without snapping. */
export function useAnimatedNumber(target: number | null, duration = 650): number | null {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    if (reduceMotion || from === target) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return target === null ? null : display;
}

export function AnimatedNumber({
  value,
  format,
}: {
  value: number | null;
  format: (value: number | null) => string;
}) {
  const animated = useAnimatedNumber(value);
  return <span className="tabular-nums">{format(animated)}</span>;
}
