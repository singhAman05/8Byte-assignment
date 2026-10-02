"use client";

import { RefreshCw, Wallet } from "lucide-react";

import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

export function AppHeader({
  refreshing,
  isStale,
  onRefresh,
}: {
  refreshing: boolean;
  isStale: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet size={18} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Portfolio Intelligence
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant={isStale ? "muted" : "success"}>
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isStale ? "bg-muted-foreground" : "bg-success",
              )}
            />
            {isStale ? "Cached" : "Live"}
          </Badge>
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh portfolio data"
            title="Refresh portfolio"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader size={16} label="Refreshing" />
            ) : (
              <RefreshCw size={16} aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
