-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "busqueda" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");
