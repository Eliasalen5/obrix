import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type BadgeTone =
  | "neutral"
  | "orange"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-obrix-gray text-neutral-600",
  orange: "bg-obrix-orange/15 text-[#b34700]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-700",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-neutral-400",
  orange: "bg-obrix-orange",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  dot?: boolean;
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}
