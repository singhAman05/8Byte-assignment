"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PortfolioResponse } from "@/types/type";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const mounted = useRef(true);

  const loadPortfolio = useCallback(async (refresh = false) => {
    if (refresh && refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      if (!response.ok) throw new Error("Market data could not be loaded.");
      const nextPortfolio = (await response.json()) as PortfolioResponse;
      if (mounted.current) setPortfolio(nextPortfolio);
    } catch (cause) {
      if (mounted.current && !refresh)
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      refreshInFlight.current = false;
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialLoad = window.setTimeout(() => void loadPortfolio(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadPortfolio(true);
    }, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadPortfolio(true);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted.current = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadPortfolio]);

  return {
    portfolio,
    error,
    refreshing,
    loadingData: !portfolio,
    refresh: () => void loadPortfolio(true),
    retry: () => void loadPortfolio(),
  };
}
