import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export default async function SolicitudComercioPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!session || !user?.id) {
    redirect("/ingresar");
  }

  if (user.role === ROLES.ADMIN) {
    redirect("/dashboard");
  }

  if (user.role === ROLES.COMERCIO) {
    const comercio = await prisma.comercio.findUnique({
      where: { ownerId: user.id },
      select: { activo: true },
    });
    if (comercio?.activo) {
      redirect("/comercio");
    }
  }

  const solicitud = await prisma.solicitudAltaComercio.findUnique({
    where: { solicitanteId: user.id },
  });

  if (!solicitud) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Alta de comercio</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No tenés una solicitud de alta enviada. Registrate como comercio desde el formulario de registro.
        </p>
        <a className="text-sm text-blue-600 hover:underline" href="/registro/comercio">
          Ir a registro de comercio
        </a>
      </div>
    );
  }

  if (solicitud.estado === "PENDIENTE") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Solicitud en revisión</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tu solicitud para <strong>{solicitud.nombreFantasia}</strong> fue enviada y está pendiente de aprobación por un administrador.
        </p>
        <p className="text-sm text-zinc-500">Te notificaremos cuando sea revisada.</p>
      </div>
    );
  }

  if (solicitud.estado === "RECHAZADA") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Solicitud rechazada</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tu solicitud para <strong>{solicitud.nombreFantasia}</strong> fue rechazada.
        </p>
        {solicitud.motivoRechazo ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <strong>Motivo:</strong> {solicitud.motivoRechazo}
          </div>
        ) : null}
        <a className="text-sm text-blue-600 hover:underline" href="/registro/comercio">
          Enviar nueva solicitud
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Solicitud aprobada</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Tu solicitud fue aprobada. Ya podés acceder al panel de comercio.
      </p>
      <a className="text-sm text-blue-600 hover:underline" href="/comercio">
        Ir al panel de comercio
      </a>
    </div>
  );
}
