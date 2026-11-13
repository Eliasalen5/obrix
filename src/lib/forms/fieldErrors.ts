import type { ZodError } from "zod";

export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function focusFirstError(errors: Record<string, string>) {
  if (typeof document === "undefined") return;
  const first = Object.keys(errors)[0];
  if (!first) return;
  document.getElementById(first)?.focus();
}
