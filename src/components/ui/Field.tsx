import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/ui/cn";

const CONTROL =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-obrix-black placeholder:text-neutral-400 transition-colors focus:border-obrix-orange focus:outline-none focus:ring-2 focus:ring-obrix-orange/30 disabled:cursor-not-allowed disabled:bg-obrix-gray disabled:text-neutral-400";

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium text-neutral-600"
        >
          {label}
          {required ? <span className="ml-0.5 text-obrix-orange">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(CONTROL, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(CONTROL, "resize-y", className)} {...props} />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(CONTROL, "cursor-pointer pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
});

/** Genera un id estable para asociar label y control cuando no se provee. */
export function useFieldId(provided?: string): string {
  const generated = useId();
  return provided ?? generated;
}
