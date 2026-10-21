# Obrix

Web app + app mobile (roadmap) donde el usuario describe lo que quiere hacer
("quiero hacer una parrilla de 1,5 m"), Obrix arma la lista de materiales con IA,
la cotiza contra los comercios registrados, la ordena por precio/distancia y
permite comprar.

La visión del producto, las reglas de negocio y las reglas de seguridad/
escalabilidad viven en [`PROMPT.md`](./PROMPT.md). Las convenciones para agentes
y colaboradores están en [`AGENTS.md`](./AGENTS.md).

## Requisitos

- Node.js 20+
- PostgreSQL (Prisma Postgres u otro) con su connection string.

## Puesta en marcha

1. Instalar dependencias (el `postinstall` regenera el cliente Prisma):

   ```bash
   npm install
   ```

2. Crear `.env` a partir de `.env.example` y completar los valores:

   ```bash
   cp .env.example .env
   ```

   Variables principales: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
   `IA_API_KEY` / `IA_DEMO`, `RATE_LIMIT_PER_MIN`, `SEED_DEMO_PASSWORD`.

3. Aplicar migraciones y sembrar datos demo:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000.

## Credenciales demo (seed)

- Admin: `admin@obrix.local`
- Comercio: `comercio@obrix.local`, `comercio2@obrix.local`, `comercio3@obrix.local`
- Cliente: `cliente@obrix.local`

Contraseña: valor de `SEED_DEMO_PASSWORD` (por defecto `obrix1234`).

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servir el build |
| `npm test` | Tests (Vitest) |
| `npx tsc --noEmit` | Chequeo de tipos |
| `npm run lint` | ESLint |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Sembrar datos demo |
| `npx prisma generate` | Regenerar cliente Prisma |

Checklist antes de cerrar una fase: `npm test` verde + `npx tsc --noEmit` sin
errores + `npm run build` OK.

## Stack

Next.js (App Router) + TypeScript + Tailwind + Prisma sobre PostgreSQL +
NextAuth (JWT) + Zod + Vitest. El proveedor de IA es intercambiable; sin
`IA_API_KEY` cae a modo demo.

## Arquitectura

- Lógica de negocio en `src/lib/services`.
- Validación Zod en `src/lib/validators`.
- Clientes HTTP del front en `src/lib/api`.
- Rutas por rol: `src/app/(cliente)`, `(comercio)`, `(admin)`.
- API REST en `src/app/api/**/route.ts`.

## Estado

Fases 1–10 completadas (catálogo maestro, auth y roles, paneles por rol,
asistente IA, cotizador/comparador, cercanía, pedidos y solicitudes de producto
con revisión admin). Verificación actual: `npm test` 301/301, `tsc --noEmit` 0,
`next build` OK. Deploy y app mobile pendientes (ver `PROMPT.md`).
