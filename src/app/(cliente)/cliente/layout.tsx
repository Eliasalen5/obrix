import { requireClienteSession } from "@/lib/auth/requireCliente";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireClienteSession();
  return <>{children}</>;
}
