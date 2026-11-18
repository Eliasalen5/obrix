import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type AlertTone = "info" | "success" | "warning" | "error";

const TONES: Record<AlertTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-700",
};

export type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function Alert({ tone = "info", children, className, action }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
        TONES[tone],
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
