import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Skeleton } from "./Skeleton";

export type KpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  delta?: { value: string; tone: "up" | "down" | "neutral" };
  loading?: boolean;
  className?: string;
};

const DELTA_TONES = {
  up: "bg-emerald-50 text-emerald-700",
  down: "bg-red-50 text-red-600",
  neutral: "bg-obrix-gray text-neutral-600",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon,
  delta,
  loading = false,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-obrix-gray text-neutral-500">
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <div className="mt-2 flex items-end gap-2">
          <p className="text-2xl font-semibold tracking-tight text-obrix-black">
            {value}
          </p>
          {delta ? (
            <span
              className={cn(
                "mb-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                DELTA_TONES[delta.tone],
              )}
            >
              {delta.value}
            </span>
          ) : null}
        </div>
      )}

      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}
