import { Button } from "./Button";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  label?: string;
};

export function Pagination({
  page,
  pageCount,
  onPrevious,
  onNext,
  disabled = false,
  label,
}: PaginationProps) {
  const total = Math.max(1, pageCount);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        onClick={onPrevious}
        disabled={disabled || page <= 1}
      >
        Anterior
      </Button>
      <span className="text-xs text-neutral-500">
        {label ? `${label} · ` : ""}
        Página {page} de {total}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onNext}
        disabled={disabled || page >= total}
      >
        Siguiente
      </Button>
    </div>
  );
}
