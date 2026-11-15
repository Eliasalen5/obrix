import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import SolicitudComercioForm from "@/components/forms/SolicitudComercioForm";

const CALLBACK = "/comercio/solicitud/editar";

export default async function EditarSolicitudComercioPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!session || !user?.id) {
    redirect(`/ingresar?callbackUrl=${encodeURIComponent(CALLBACK)}`);
  }

  if (user.role === ROLES.ADMIN) {
    redirect("/dashboard");
  }

  if (user.role !== ROLES.CLIENTE) {
    redirect("/comercio/solicitud");
  }

  const solicitud = await prisma.solicitudAltaComercio.findUnique({
    where: { solicitanteId: user.id },
    include: {
      solicitante: { select: { email: true, nombre: true } },
    },
  });

  if (!solicitud || solicitud.estado !== "RECHAZADA") {
    redirect("/comercio/solicitud");
  }

  return (
    <SolicitudComercioForm
      reintento
      datosIniciales={{
        nombreTitular: solicitud.solicitante.nombre,
        email: solicitud.solicitante.email,
        telefonoTitular: solicitud.telefonoTitular,
        nombreFantasia: solicitud.nombreFantasia,
        razonSocial: solicitud.razonSocial,
        cuit: solicitud.cuit,
        direccion: solicitud.direccion,
        provincia: solicitud.provincia,
        localidad: solicitud.localidad,
        lat: solicitud.lat,
        lng: solicitud.lng,
        telefonoComercial: solicitud.telefonoComercial,
        rubro: solicitud.rubro,
        categorias: Array.isArray(solicitud.categorias)
          ? solicitud.categorias.filter(
              (categoria): categoria is string => typeof categoria === "string",
            )
          : [],
      }}
    />
  );
}
