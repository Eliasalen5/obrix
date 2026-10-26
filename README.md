# Obrix

Web app + app mobile (Expo) donde el usuario describe lo que quiere hacer ("quiero hacer una parrilla de 1,5 m"), Obrix arma la lista de materiales con IA, la cotiza contra los comercios registrados, la ordena por precio/distancia y permite comprar.

- La visión del producto, reglas de negocio, seguridad y escalabilidad viven en [`PROMPT.md`](./PROMPT.md).
- Las convenciones para agentes y colaboradores están en [`AGENTS.md`](./AGENTS.md).

## Requisitos

- Node.js 20+
- PostgreSQL (Prisma Postgres u otro) con su `DATABASE_URL`
- Para la app mobile: Node.js + Expo CLI/Expo Go

## Puesta en marcha (Web)

1. Instalar dependencias (el `postinstall` regenera el cliente Prisma):

   ```bash
   npm install
   ```

2. Crear `.env` a partir de `.env.example` y completar los valores:

   ```bash
   cp .env.example .env
   ```

   Variables principales: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `IA_API_KEY` / `IA_DEMO`, `RATE_LIMIT_PER_MIN`, `SEED_DEMO_PASSWORD`.

3. Aplicar migraciones y sembrar datos demo:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## App Mobile (`mobile/`)

Obrix cuenta con una app móvil en `mobile/` (Expo SDK 58 + expo-router). Reutiliza validadores, clientes HTTP y lógica compartida desde la web vía el alias `@shared/*` → `src/lib/*`.

1. Instalar dependencias (desde `mobile/`):

   ```bash
   cd mobile
   npm install --legacy-peer-deps
   ```

2. Configurar `mobile/.env` con la URL de la API en tu red LAN:

   ```env
   EXPO_PUBLIC_API_URL=http://<IP_DE_TU_PC>:3000
   ```

3. Iniciar la app:

   ```bash
   npm start
   ```

Notas importantes:
- Usa autenticación por token vía `POST /api/v1/auth/token` (`authApi.login`) y `expo-secure-store`.
- Geolocalización con `expo-location` para pasar `ubicacion` al cotizador.
- En Expo Go, puede ser necesario usar `EXPO_TOKEN` si el login por navegador falla en Windows.
- Ver [`AGENTS.md`](./AGENTS.md) para detalles de configuración, Metro y arranque en vivo.

## Credenciales demo (seed)

- Admin: `admin@obrix.local`
- Comercio: `comercio@obrix.local`, `comercio2@obrix.local`, `comercio3@obrix.local`
- Cliente: `cliente@obrix.local`

Contraseña: valor de `SEED_DEMO_PASSWORD` (por defecto `obrix1234`).

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (web) |
| `npm run build` | Build de producción |
| `npm start` | Servir el build de producción |
| `npm test` | Tests con Vitest |
| `npx tsc --noEmit` | Chequeo de tipos |
| `npm run lint` | Lint con ESLint |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Sembrar datos demo |
| `npx prisma generate` | Regenerar cliente Prisma (`src/generated/prisma`) |

**Checklist antes de cerrar una fase:** `npm test` verde + `npx tsc --noEmit` sin errores + `npm run build` OK.

## Stack

- **Web:** Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL + NextAuth (JWT) + Zod + Vitest
- **IA:** Proveedor intercambiable en `src/lib/ai`. Sin `IA_API_KEY` cae a modo demo (`IA_DEMO`).
- **Mobile:** Expo SDK 58 + expo-router + TypeScript + `expo-secure-store` + `expo-location`

## Arquitectura

- **Lógica de negocio:** solo en `src/lib/services`. Rutas API y componentes delgados.
- **Validación:** Zod en `src/lib/validators` (fuente única de verdad, usado en server y client).
- **Clientes HTTP:** `src/lib/api` con `httpClient.request`. `configureHttp` disponible para clientes externos (usado por mobile).
- **Autorización:** por rol en cada ruta API (`apiAuth`/`decideAccess`) y guards en layouts `src/app/(cliente)`, `(comercio)`, `(admin)`. `comercioId`/`clienteId` se derivan siempre de la sesión.
- **API:** REST en `src/app/api/**/route.ts`.
- **Errores:** `jsonError`, `zodDetails`, `prismaErrorResponse` en `src/lib/api/http.ts` (mapeo P2002→409, P2003→400, P2014→409, P2025→404).
- **Prisma:** esquema en `prisma/schema.prisma`, migraciones en `prisma/migrations`. Cliente generado en `src/generated/prisma` (gitignoreado).

## Estado

- **Web:** Fases 1–10 completadas (catálogo maestro, auth/roles, paneles por rol, asistente IA, cotizador/comparador, cercanía, pedidos y solicitudes de producto con revisión admin).
- **Mobile:** Proyecto iniciado en `mobile/` (Expo). Implementadas pantallas de asistente, cotización, pedidos, auth por token y geolocalización.
- **Pendiente:** Deploy a producción y pulido final de la app mobile (ver [`PROMPT.md`](./PROMPT.md)).
