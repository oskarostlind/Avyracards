"use client";

import { useLayoutEffect, useState } from "react";

/**
 * Var den sticky navbaren slutar (px från viewportens topp). Behövs för
 * element som ska klistra sig direkt under den — höjden skiljer sig mellan
 * webben och appen (safe area) och mellan mobil- och desktopnavigeringen.
 */
export function useHeaderBottom(fallback = 64): number {
  const [bottom, setBottom] = useState(fallback);
  useLayoutEffect(() => {
    const header = document.querySelector("body header");
    if (!header) {
      setBottom(0);
      return;
    }
    const measure = () => setBottom(Math.max(0, Math.round(header.getBoundingClientRect().height)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  return bottom;
}
