-- CreateTable
CREATE TABLE "SolicitudAltaComercio" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nombreFantasia" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL DEFAULT '',
    "cuit" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL DEFAULT '',
    "localidad" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "telefonoComercial" TEXT NOT NULL DEFAULT '',
    "telefonoTitular" TEXT NOT NULL DEFAULT '',
    "rubro" TEXT NOT NULL DEFAULT '',
    "categorias" JSONB NOT NULL DEFAULT '[]',
    "datosExtras" JSONB NOT NULL DEFAULT '{}',
    "motivoRechazo" TEXT NOT NULL DEFAULT '',
    "revisadoById" TEXT,
    "comercioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudAltaComercio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudAltaComercio_solicitanteId_key" ON "SolicitudAltaComercio"("solicitanteId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudAltaComercio_comercioId_key" ON "SolicitudAltaComercio"("comercioId");

-- CreateIndex
CREATE INDEX "SolicitudAltaComercio_estado_idx" ON "SolicitudAltaComercio"("estado");

-- CreateIndex
CREATE INDEX "SolicitudAltaComercio_createdAt_idx" ON "SolicitudAltaComercio"("createdAt");

-- AddForeignKey
ALTER TABLE "SolicitudAltaComercio" ADD CONSTRAINT "SolicitudAltaComercio_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAltaComercio" ADD CONSTRAINT "SolicitudAltaComercio_revisadoById_fkey" FOREIGN KEY ("revisadoById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAltaComercio" ADD CONSTRAINT "SolicitudAltaComercio_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
