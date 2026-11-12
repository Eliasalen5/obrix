import { Suspense } from "react";
import RegistroClienteForm from "./RegistroClienteForm";

export default function RegistroClientePage() {
  return (
    <Suspense
      fallback={<div className="p-12 text-center text-sm">Cargando...</div>}
    >
      <RegistroClienteForm />
    </Suspense>
  );
}
