-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "atributos" JSONB,
ADD COLUMN     "codigoBarras" TEXT,
ADD COLUMN     "codigoFabricante" TEXT,
ADD COLUMN     "fabricante" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "marca" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "SolicitudProducto" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "datos" JSONB NOT NULL,
    "clavePendiente" TEXT,
    "productoId" TEXT,
    "motivoRechazo" TEXT NOT NULL DEFAULT '',
    "revisadoById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudProducto_estado_idx" ON "SolicitudProducto"("estado");

-- CreateIndex
CREATE INDEX "SolicitudProducto_comercioId_estado_idx" ON "SolicitudProducto"("comercioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudProducto_comercioId_clavePendiente_key" ON "SolicitudProducto"("comercioId", "clavePendiente");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarras_key" ON "Producto"("codigoBarras");

-- AddForeignKey
ALTER TABLE "SolicitudProducto" ADD CONSTRAINT "SolicitudProducto_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudProducto" ADD CONSTRAINT "SolicitudProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudProducto" ADD CONSTRAINT "SolicitudProducto_revisadoById_fkey" FOREIGN KEY ("revisadoById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
