import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES, type Role } from "./constants";

const DESTINO_POR_DEFECTO = "/cliente";

function destinoIngreso(pathname: string | null): string {
  if (!pathname) return DESTINO_POR_DEFECTO;
  if (pathname !== "/cliente" && !pathname.startsWith("/cliente/")) {
    return DESTINO_POR_DEFECTO;
  }
  return pathname;
}

export async function requireClienteSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session || role !== ROLES.CLIENTE) {
    const pathname = (await headers()).get("x-obrix-pathname");
    const destino = destinoIngreso(pathname);
    redirect(`/ingresar?callbackUrl=${encodeURIComponent(destino)}`);
  }
  return session;
}
