"use client";

import { useRouter } from "next/navigation";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";

export default function CotizarOfertaButton({
  productoNombre,
  marca,
}: {
  productoNombre: string;
  marca: string;
}) {
  const router = useRouter();

  function cotizar() {
    guardarProyectoPendiente(
      `Quiero cotizar ${productoNombre}${marca ? ` de ${marca}` : ""}.`,
      true,
    );
    router.push("/cliente/proyecto");
  }

  return (
    <button
      type="button"
      onClick={cotizar}
      className="inline-flex items-center justify-center rounded-full bg-obrix-orange px-6 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
    >
      Cotizar este material
    </button>
  );
}
