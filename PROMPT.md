# PROMPT MAESTRO — Proyecto Obrix

## Qué es Obrix
Web app + app mobile donde el usuario dice qué quiere hacer ("quiero hacer una
parrilla de 1,5 m"), Obrix arma la lista de materiales con IA, la cotiza contra
los comercios registrados, la ordena por precio/distancia y permite comprar.
Público: ferreterías, corralones, pinturerías y usuarios finales.

## Modelo de datos (columna vertebral)
- CATÁLOGO MAESTRO: productos cargados una sola vez por el ADMIN.
- COMERCIO: activa qué vende (precio/stock/marca/presentación) sobre el catálogo.
  No crea productos maestros directamente: PROPONE productos nuevos vía
  `SolicitudProducto` (estado `PENDIENTE_REVISION`); el ADMIN aprueba, vincula a
  un producto existente o rechaza. Aprobación y vinculación son transaccionales.
- VARIANTE = `Producto` distinto por `unidad` (no existe modelo `Variante`).
- SIN DUPLICADOS: detección en 3 niveles — (1) exacta por `codigoBarras` o
  `fabricante`+`codigoFabricante`; (2) normalizada (nombre/marca/medidas
  equivalentes); (3) aproximada por similitud de tokens (solo sugiere, nunca
  fusiona sola). Las variantes con medidas o marcas distintas NO se fusionan.
- Flujo cliente: Proyecto → Materiales → Cotización → Comparación →
  Comercio cercano → Pedido.
- Estados como String + constantes/Zod en `src/lib` (SIN enums de Prisma).

## Roles
ADMIN (catálogo maestro + revisión de solicitudes) | COMERCIO (sus ofertas,
pedidos recibidos y propuestas) | CLIENTE (proyecto, cotización, pedidos).

## Plataformas: Web + Mobile (objetivo del producto)
Backend único compartido; clientes web y mobile consumen la MISMA API.
- Web: Next.js App Router (Server Components + Route Handlers).
- Mobile: React Native + Expo (TypeScript), reutiliza validadores y clientes API.
- Código compartido (futuro monorepo): `packages/shared` con esquemas Zod, tipos
  y clientes HTTP; `apps/web` (Next) y `apps/mobile` (Expo). Hoy la web vive en
  este repo y la extracción/versionado de la API es una fase pendiente.
- Autenticación dual sobre el mismo backend:
  - Web: sesión NextAuth (JWT en cookie httpOnly).
  - Mobile: token JWT vía header `Authorization: Bearer ...` (sin cookies).
- Capacidades nativas previstas: notificaciones push de estado de pedido,
  geolocalización para cercanía y cámara para escanear `codigoBarras`.

## Stack
Next.js (App Router) + TypeScript + Tailwind + Prisma sobre PostgreSQL
(Prisma Postgres en dev y prod) + NextAuth (estrategia JWT) + Zod + Vitest.
IA por API con proveedor intercambiable; sin clave, cae a modo demo.
Sin listar versiones fijas: el `package.json` es la fuente de verdad.

## REGLAS DE SEGURIDAD (obligatorias en cada fase)
1. Contraseñas hasheadas con bcryptjs, jamás en texto plano.
2. Sesión/JWT httpOnly + secure; secreto solo en `NEXTAUTH_SECRET`; CSRF de NextAuth.
3. Autorización por rol EN CADA RUTA del servidor: helpers `apiAuth`/`decideAccess`
   en las API y guards en los layouts (nunca confiar solo en el front).
4. Validación de TODA la entrada con Zod (server y client) en `src/lib/validators`.
5. Prisma con consultas parametrizadas; nunca SQL crudo con input del usuario.
6. Claves (IA, DB) SOLO en `.env` server-side; nunca en el cliente ni en git.
   `.env.example` sin valores reales; `.gitignore` cubre `.env*` y el cliente generado.
7. Rate limiting en endpoints públicos (especialmente IA y auth). EL login
   (credenciales NextAuth) limita por email (`loginRateLimiter`,
   `LOGIN_RATE_LIMIT_PER_MIN`); el asistente por usuario. ACTUAL: en
   memoria, por instancia de proceso (no global). PARA ESCALAR: store compartido
   (Redis/Upstash) detrás de la interfaz `RateLimitStore`.
8. Sanitizar texto del usuario (anti-XSS); no desactivar el escape de Next.js.
9. Aislamiento multi-tenant: `comercioId`/`clienteId` SIEMPRE derivados de la
   sesión, nunca del body/query.
10. Secrets nunca se loguean; errores internos devuelven 500 sin filtrar stack.
11. Auditoría de dependencias (`npm audit`) al cerrar cada fase.
12. Mobile (cuando aplique): token en almacenamiento seguro (SecureStore/Keychain),
    expiración y refresh; nunca persistir credenciales en texto plano.

## REGLAS DE ESCALABILIDAD
1. Esquema Prisma listo para PostgreSQL (nada específico de SQLite).
2. Lógica de negocio SOLO en `src/lib/services`; rutas API y componentes delgados.
3. Proveedor de IA intercambiable (interfaz `AiProvider`; demo sin clave).
4. Migraciones de DB con Prisma en cada fase (`migrate deploy`; nunca `db push` suelto).
5. Configuración por variables de entorno; sin números mágicos.
6. Nuevos features = nuevas fases, sin romper lo anterior.
7. Estructura de carpetas por rol: `(cliente)` / `(comercio)` / `(admin)`.
8. API pensada como contrato estable y versionable para servir a web y mobile.
9. Índices y unicidad en Prisma para las consultas críticas (estado, comercio).
10. Rate limit y estado compartido listos para reemplazar el store en memoria.

## TESTING (obligatorio)
- Runner: Vitest. `npm test` verde antes de cerrar CADA fase.
- 🔒 Seguridad: CLIENTE no accede a rutas de COMERCIO/ADMIN; COMERCIO solo
  modifica sus ofertas; entrada inválida rechazada por Zod; contraseñas nunca
  en texto plano; rate limit en endpoints de IA.
- 🔀 Flujo: proyecto → materiales → cotización → orden por cercanía/precio →
  carrito → pedido recibido por el comercio.
- 🔁 Duplicados: niveles 1/2/3, variantes que NO deben fusionarse, transacción de
  aprobación con rollback y anti doble envío.
- Tests unitarios de: cotizador, distancias (haversine), autorización por rol,
  validadores, clientes API y duplicados.
- Definición de terminado de una fase: `npm test` verde + `npx tsc --noEmit` sin
  errores + `npm run build` OK.

## Workflow de desarrollo
Cada fase se explica en criollo al usuario y NO avanza sin su confirmación.

## Fases
1.  [x] Proyecto + PROMPT.md + DB + catálogo maestro seed + setup Vitest
2.  [x] Auth + roles (tests 🔒 por rol)
3.  [x] Panel admin: catálogo maestro (tests 🔒 admin)
4.  [x] Panel comercio: activa productos y precios (tests 🔒 aislamiento)
5.  [x] Asistente IA modo demo (tests 🔒 rate limit + validación)
6.  [x] Cotizador + comparador (tests 💰)
7.  [x] Cercanía: distancias y orden (tests 📍)
8.  [x] Carrito + pedido (tests 🔀 flujo completo)
9.  [x] UI final + E2E camino feliz (web)
10. [x] Catálogo sin duplicados: propuestas del comercio + revisión admin
        (tests 🔁 duplicados / transacción / aislamiento)
11. [x] Migración a PostgreSQL + migraciones versionadas (dev y prod)
12. [x] API versionada y contrato estable + auth por token Bearer (base mobile)
        (`/api/v1` canónica; `/api/*` alias legacy con `Deprecation`; login
        `POST /api/v1/auth/token`; auth dual cookie/Bearer reutilizando NextAuth)
13. [x] App mobile (Expo) para CLIENTE — login, asistente, cotización y pedidos.
        Proyecto en `mobile/` (Expo SDK 58 + expo-router), reutiliza validadores y
        clientes de `src/lib` vía alias `@shared`; token en `expo-secure-store`.
        Probado en vivo en iPhone (Expo Go): login → asistente (demo) → cotización
        → crear pedido → mis pedidos (cancelar).
14. [~] Capacidades nativas mobile (geolocalización [x], cámara código de barras [ ],
        push [ ] diferido: requiere development build; Expo Go iOS no soporta push).
15. [~] Hardening y escalabilidad: README [x], limpieza de residuos [x],
        `npm audit` [x], rate limit con store compartido [ ] PENDIENTE

## Estado de avance
- **Fases 1–12 completadas y verificadas.** Fase 13 (mobile) en MVP; Fase 15 parcial.
- Web: home (landing Obrix), login `/ingresar` con credenciales demo, shell con
  NavBar por rol, panel cliente (wizard asistente→cotizar→ranking→pedido + mis
  pedidos), panel comercio (ofertas + solicitudes + pedidos) y panel admin
  (catálogo + `/solicitudes`).
- DB: **PostgreSQL (Prisma Postgres)** en dev y prod, con migraciones versionadas
  (`prisma migrate status`: schema up to date). Deploy web en Vercel.
- E2E camino feliz a nivel API en Vitest (asistente → cotización → pedido →
  cancelar → comercio ve y avanza estado), con Prisma stub en memoria.
- Tests unitarios de clientes API: catálogo, oferta, asistente, cotización,
  pedidos y solicitudes.
- **API versionada (Fase 12):** handlers bajo `/api/v1/*` (canónica). `/api/*`
  sigue funcionando como alias legacy vía `src/proxy.ts` (rewrite + headers
  `Deprecation`/`Link`). Auth dual: cookie (web) o `Authorization: Bearer <jwt>`
  (mobile) con el mismo JWT de NextAuth; se respeta la revocación (`token.invalid`).
  Login mobile: `POST /api/v1/auth/token` (email+password → `{ token, expiresIn, user }`).
- **App mobile (Fase 13, MVP):** proyecto `mobile/` (Expo SDK 58 + expo-router,
  TypeScript). Reutiliza validadores y clientes de `src/lib` vía alias `@shared`
  (un solo source of truth). Transporte HTTP configurable: la web usa rutas
  relativas (`configureHttp` sin usar); mobile configura URL absoluta + Bearer.
  Sesión en `expo-secure-store`. Pantallas: login, asistente (proyecto → materiales),
  cotización (materiales → ranking de ferreterías → crear pedido) y pedidos
  (listar/cancelar). **Geolocalización (Fase 14):** `expo-location`; el asistente
  pide permiso y pasa `ubicacion` a la cotización (mismo contrato que la web).
  **Probado en vivo en iPhone (Expo Go, SDK 58):** login CLIENTE → asistente
  (proveedor demo) → cotización → pedido → mis pedidos. En **iOS** Expo Go exige
  cuenta de Expo y que la **CLI use la misma cuenta** (`EXPO_TOKEN` evita el login
  por navegador, que falla en este Windows). Íconos/splash propios en
  `mobile/assets/` (logo Obrix).
- **Verificación:** `npm test` 328/328 (37 archivos), `tsc --noEmit` 0 errores,
  `next build` OK.
- **Deploy:** web en Vercel sobre Prisma Postgres.

## PENDIENTES (recordatorio)
- **[Fase 13] Mobile — completar paridad:** definir `EXPO_PUBLIC_API_URL` por
  entorno (dev LAN / prod Vercel). Notas de entorno: en iOS, Expo Go exige sesión
  y coincidir con la CLI; usar `EXPO_TOKEN` para autenticar la CLI sin navegador.
  Íconos en `mobile/assets/`.
- **[Fase 15] Rate limit con store compartido.** Hoy el conteo vive en memoria
  (`MemoryRateLimitStore`), por instancia de proceso. En Vercel (serverless, multi
  instancia) el límite real es "por instancia", no global. FALTA: implementar el
  store compartido (Redis/Upstash, plan gratis cubre de sobra) detrás de la
  interfaz `RateLimitStore` ya existente. Sin tráfico real hoy, no es urgente.
- **[Fase 14] Capacidades nativas mobile:** cámara/código de barras (requiere endpoint
  CLIENTE de búsqueda por `codigoBarras`) y push (requiere development build: Expo Go
  iOS no soporta push remoto; además modelo de tokens + endpoint). Geolocalización ya
  hecha con `expo-location`.
- `npm audit`: 5 vulnerabilidades high, todas de `eslint-config-next` (tooling de
  lint, NO runtime). Solo se arreglan con `--force` (breaking: baja a v14) → no
  aplicar. Sin acción hasta que el upstream lo resuelva.
