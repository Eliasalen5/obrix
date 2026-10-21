<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Obrix — Guía para agentes

La visión del producto, las reglas de negocio, seguridad y escalabilidad viven en
**`PROMPT.md`**. Este archivo es el "cómo trabajar en el repo". Ante conflicto,
manda `PROMPT.md`.

## Comandos
- Tests: `npm test` (Vitest; `vitest.config.mts`, `tests/**`).
- Tipos: `npx tsc --noEmit`.
- Build: `npm run build`.
- Lint: `npm run lint` (hoy con conflictos preexistentes de eslint; no bloquea).
- Dev: `npm run dev`.
- DB: `npm run db:deploy` (`prisma migrate deploy`) y `npm run db:seed`.
- Regenerar cliente Prisma: `npx prisma generate` (salida en `src/generated/prisma`).

Checklist antes de cerrar una fase: `npm test` verde + `npx tsc --noEmit` sin
errores + `npm run build` OK.

## Arquitectura y convenciones
- Stack: Next.js (App Router) + TypeScript + Tailwind + Prisma/PostgreSQL +
  NextAuth (JWT) + Zod + Vitest. Sin versiones fijas aquí: ver `package.json`.
- Lógica de negocio SOLO en `src/lib/services`. Rutas API y componentes delgados.
- Validación Zod en `src/lib/validators` (server y client). Los schemas son la
  única fuente de verdad de la forma de los datos.
- Clientes HTTP del front en `src/lib/api` (usan `httpClient.request`).
- Estados/roles como String + constantes en `src/lib` — SIN enums de Prisma.
- Errores: `jsonError` / `zodDetails` / `prismaErrorResponse` en `src/lib/api/http.ts`
  (mapea P2002→409, P2003→400, P2014→409, P2025→404). Los servicios lanzan errores
  de dominio (p. ej. `SolicitudError`) que la ruta traduce a HTTP.
- Rutas por rol: `(cliente)` / `(comercio)` / `(admin)`, cada una con `layout.tsx`
  que aplica su guard. Rutas API bajo `src/app/api/**/route.ts`.
- Proveedor de IA intercambiable en `src/lib/ai` (`AiProvider`); demo sin clave
  (`IA_DEMO` / falta `IA_API_KEY`).

## Seguridad (obligatoria — ver `PROMPT.md` para el detalle)
1. Autorización por rol EN CADA RUTA: `apiAuth`/`decideAccess` en API y guards de
   layout en UI. Nunca confiar solo en el front.
2. `comercioId`/`clienteId` SIEMPRE se derivan de la sesión
   (`getComercioIdByOwner`, `access.userId`), nunca del body/query.
3. Validar TODA entrada con Zod antes de tocar la DB. Prisma parametrizado,
   nunca SQL crudo.
4. Contraseñas con bcryptjs. Secretos solo en `.env`; nunca en el cliente ni en
   git. `.env.example` sin valores reales.
5. Rate limit en endpoints públicos (IA/auth) vía `src/lib/rate-limit.ts`
   (hoy en memoria/por instancia → migrar a store compartido para escalar).
6. Sanitizar texto del usuario; no desactivar el escape de Next.js.
7. No loguear secretos; los 500 no filtran stack. `npm audit` al cerrar fase.

## Prisma
- Esquema en `prisma/schema.prisma`; migraciones versionadas en `prisma/migrations`
  (usar `migrate`, no `db push`). El cliente generado (`src/generated`) está
  gitignoreado: si los tests fallan con imports del cliente, regenerar y borrar
  salida obsoleta antes de regenerar.
- `DATABASE_URL` apunta a PostgreSQL (Prisma Postgres) en todos los entornos.

## Tests
- Vitest con alias `@` → `src`. Patrón: `vi.mock("next-auth")` y
  `vi.mock("@/lib/prisma")`; `$transaction` se simula ejecutando el callback con
  un mock de `tx`. Ver `tests/*.integration.test.ts` y `tests/*-client.test.ts`.
- Cubrir siempre: autorización por rol (401/403), aislamiento multi-tenant,
  validación Zod (400), y flujos de negocio (transacción/rollback).

## Mobile (roadmap — ver `PROMPT.md`)
- Objetivo: React Native + Expo reutilizando validadores y clientes API.
- Autenticación por token `Authorization: Bearer ...` (sin cookies), token en
  almacenamiento seguro. La API debe poder extraerse/versionarse como contrato
  estable sin duplicar la lógica de `src/lib/services`.
- Al preparar la API para mobile, no romper a la web: cambios compatibles o
  versionados (`/api/v1`).
