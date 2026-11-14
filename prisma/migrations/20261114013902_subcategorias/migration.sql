-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "subcategoriaId" TEXT;

-- CreateTable
CREATE TABLE "Subcategoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "Subcategoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subcategoria_categoriaId_idx" ON "Subcategoria"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategoria_categoriaId_nombre_key" ON "Subcategoria"("categoriaId", "nombre");

-- CreateIndex
CREATE INDEX "Producto_subcategoriaId_idx" ON "Producto"("subcategoriaId");

-- AddForeignKey
ALTER TABLE "Subcategoria" ADD CONSTRAINT "Subcategoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "Subcategoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
