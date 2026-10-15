import { requireComercioSession } from "@/lib/auth/requireComercio";

export default async function ComercioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireComercioSession();
  return <>{children}</>;
}
