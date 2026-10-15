import { Suspense } from "react";
import IngresarForm from "./IngresarForm";

export default function IngresarPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Cargando…</div>}>
      <IngresarForm />
    </Suspense>
  );
}
