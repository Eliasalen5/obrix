# Catálogo de datos

Esta carpeta guarda los archivos de trabajo del catálogo maestro.

## Archivos

- `catalogo-extraido-limpio.json`: entrada del importador `scripts/import-catalogo-limpio.ts`.
  Es el único JSON versionado porque es el que se usa para cargar productos en la base.
- `catalogo-extraido.json`: salida intermedia de `scripts/export-catalogo-json.ts`.
  No se versiona; se regenera desde el Excel.
- `catalogo-obrix-2026.xlsx`: Excel fuente. No se versiona; se puede ubicar acá o indicar
  otra ruta con `CATALOGO_XLSX_PATH`.

## Regenerar el JSON

1. Copiar el Excel a `data/catalogo/catalogo-obrix-2026.xlsx` o definir:

   ```powershell
   $env:CATALOGO_XLSX_PATH="C:\ruta\al\catalogo.xlsx"
   ```

2. Exportar:

   ```bash
   npx tsx scripts/export-catalogo-json.ts
   ```

3. Revisar/limpiar la salida y guardarla como `catalogo-extraido-limpio.json`.

4. Importar a la base:

   ```bash
   npx tsx scripts/import-catalogo-limpio.ts
   ```

También se puede cambiar la ruta del JSON de salida/entrada con `CATALOGO_JSON_PATH`.

Si ya había productos cargados antes de la migración de búsqueda, recalcular su
texto normalizado una vez:

```bash
npm run db:backfill-busqueda
```
