-- AlterTable
ALTER TABLE "Comercio" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'INICIAL',
ADD COLUMN     "planVence" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "comisionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "comisionMonto" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SuscripcionComercio" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "precioMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "motivo" TEXT NOT NULL DEFAULT '',
    "asignadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuscripcionComercio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuscripcionComercio_comercioId_estado_idx" ON "SuscripcionComercio"("comercioId", "estado");

-- AddForeignKey
ALTER TABLE "SuscripcionComercio" ADD CONSTRAINT "SuscripcionComercio_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuscripcionComercio" ADD CONSTRAINT "SuscripcionComercio_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
