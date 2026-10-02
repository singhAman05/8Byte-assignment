import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "neutral" | "positive" | "negative";
  icon?: ReactNode;
}) {
  const toneText =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";

  return (
    <Card className="transition-shadow duration-200 hover:shadow-sm">
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p
          className={cn(
            "mt-3 text-2xl font-semibold tracking-tight tabular-nums transition-colors duration-300",
            toneText,
          )}
        >
          {value}
        </p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
}
