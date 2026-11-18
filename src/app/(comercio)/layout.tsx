import { requireComercioSession } from "@/lib/auth/requireComercio";
import CommerceShell from "@/components/layout/comercio/CommerceShell";

export default async function ComercioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { comercio } = await requireComercioSession();
  return (
    <CommerceShell
      comercioNombre={comercio.nombre}
      planId={comercio.plan}
    >
      {children}
    </CommerceShell>
  );
}
