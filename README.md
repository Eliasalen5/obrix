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

   Variables principales: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `IA_API_KEY` / `IA_DEMO`, `RATE_LIMIT_PER_MIN`, `LOGIN_RATE_LIMIT_PER_MIN`, `SEED_DEMO_PASSWORD`.

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

App móvil para cliente en `mobile/` (Expo SDK 58 + expo-router). Reutiliza validadores, clientes HTTP y lógica compartida desde la web vía el alias `@shared/*` → `src/lib/*`.

1. Instalar dependencias (desde `mobile/`):

   ```bash
   cd mobile
   npm install --legacy-peer-deps
   ```

2. Configurar `mobile/.env` con la URL de la API en tu red LAN (o la URL de Vercel):

   ```env
   EXPO_PUBLIC_API_URL=http://<IP_DE_TU_PC>:3000
   ```

3. Iniciar la app:

   ```bash
   npm start
   ```

Notas importantes:
- **Auth dual:** web usa sesión NextAuth (cookie httpOnly), mobile usa token JWT vía `Authorization: Bearer ...` obtenido con `POST /api/v1/auth/token` (`authApi.login`).
- **Almacenamiento seguro:** sesión/token guardado con `expo-secure-store`.
- **Geolocalización:** `expo-location` solicita permiso y pasa `ubicacion` al cotizador.
- **Arranque en vivo (iOS/Expo Go):** puede requerir iniciar sesión en Expo CLI. En Windows puede fallar el login por navegador → usar `EXPO_TOKEN`. La CLI y el dispositivo deben usar la misma cuenta.
- **Reutilización:** validadores (`src/lib/validators`), clientes API (`src/lib/api`) y contratos compartidos vía `@shared/*` (un solo source of truth).
- Ver [`AGENTS.md`](./AGENTS.md) para detalles de Metro, alias y configuración.

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
| `npm run db:deploy` | `prisma migrate deploy` (migraciones versionadas) |
| `npm run db:seed` | Sembrar datos demo |
| `npx prisma generate` | Regenerar cliente Prisma (`src/generated/prisma`) |

**Checklist antes de cerrar una fase:** `npm test` verde + `npx tsc --noEmit` sin errores + `npm run build` OK.

## Stack

- **Web:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Prisma 7 + PostgreSQL + NextAuth 4 (JWT) + Zod 4 + Vitest 5
- **IA:** Proveedor intercambiable en `src/lib/ai`. Sin `IA_API_KEY` cae a modo demo (`IA_DEMO`).
- **Mobile:** Expo SDK 58 + expo-router + React Native 0.88 + TypeScript + `expo-secure-store` + `expo-location` + Zod

## Arquitectura

- **Lógica de negocio:** solo en `src/lib/services`. Rutas API y componentes delgados.
- **Validación:** Zod en `src/lib/validators` (fuente única de verdad, usado en server y client).
- **Clientes HTTP:** `src/lib/api` con `httpClient.request`. `configureHttp` disponible para clientes externos (usado por mobile).
- **Autorización:** por rol en cada ruta API (`apiAuth`/`decideAccess`) y guards en layouts `src/app/(cliente)`, `(comercio)`, `(admin)`. `comercioId`/`clienteId` se derivan siempre de la sesión.
- **API versionada:** handlers canónicos bajo `/api/v1/*`. Alias legacy `/api/*` con headers `Deprecation`/`Link` vía `src/proxy.ts`.
- **Auth dual:** cookie httpOnly (web) o `Authorization: Bearer <jwt>` (mobile), reutilizando el mismo JWT de NextAuth con soporte a revocación (`token.invalid`).
- **Errores:** `jsonError`, `zodDetails`, `prismaErrorResponse` en `src/lib/api/http.ts` (mapeo P2002→409, P2003→400, P2014→409, P2025→404).
- **Rate limiting:** por email para login (`loginRateLimiter`) y por usuario/endpoint para IA. Actualmente en memoria por instancia (`MemoryRateLimitStore`).
- **Prisma:** esquema en `prisma/schema.prisma`, migraciones versionadas en `prisma/migrations`. Cliente generado en `src/generated/prisma` (gitignoreado).

## Estado

- **Web:** Fases 1–12 completadas y verificadas. Desplegada en **Vercel** sobre **Prisma Postgres** con migraciones versionadas.
- **Mobile (Fase 13 - MVP):** Proyecto `mobile/` funcional. Login por token, asistente IA, cotización/comparador, crear pedido, mis pedidos (cancelar). **Geolocalización** implementada con `expo-location`. Probado en vivo en iPhone (Expo Go, SDK 58).
- **En progreso/parcial:**
  - **Fase 14:** Cámara/código de barras (pendiente, requiere endpoint de búsqueda por `codigoBarras`) y push (diferido a development build; Expo Go iOS no soporta push).
  - **Fase 15:** Hardening y escalabilidad. Falta **rate limit con store compartido** (Redis/Upstash) detrás de `RateLimitStore` para entornos serverless/multi-instancia.
- **Verificación:** `npm test` 328/328 (37 archivos), `npx tsc --noEmit` 0 errores, `next build` OK.
- **Seguridad:** `npm audit` reporta 5 vulnerabilidades high en `eslint-config-next` (tooling de lint, no runtime). No se aplican fixes con `--force` (breaking) hasta resolución upstream.
