# PROMPT MAESTRO — Proyecto Obrix

## Qué es Obrix
Web app: el usuario dice qué quiere hacer ("quiero hacer una parrilla de 1,5 m"),
Obrix arma la lista de materiales, la cotiza contra los comercios registrados,
los ordena por precio/distancia y permite comprar.

## Modelo de datos (columna vertebral)
- CATÁLOGO MAESTRO: productos cargados una sola vez por el ADMIN.
- COMERCIO: solo activa qué vende y pone precio/stock/marca. No crea productos.
- Flujo cliente: Proyecto → Materiales → Cotización → Comparación → Comercio cercano → Compra.

## Roles
ADMIN (catálogo maestro) | COMERCIO (sus precios) | CLIENTE (compra).

## Stack
Next.js + TypeScript + Tailwind + Prisma (SQLite dev → PostgreSQL prod).
IA por API con clave en variable de entorno (modo demo sin clave).

## REGLAS DE SEGURIDAD (obligatorias en cada fase)
1. Contraseñas hasheadas (bcrypt/argon2), jamás en texto plano.
2. Sesiones/JWT httpOnly + secure; CSRF protegido.
3. Autorización por rol EN CADA RUTA del servidor (nunca confiar solo en el front).
4. Validación de TODA la entrada con Zod (server y client).
5. Prisma/queries parametrizadas (no SQL crudo con input del usuario).
6. Claves (IA, DB) SOLO en .env server-side; nunca en el cliente ni en git.
   .env.example sin valores reales; .gitignore lo primero.
7. Rate limiting en endpoints públicos (especialmente el de IA).
8. Sanitizar texto del usuario (anti-XSS); no desactivar el escape de Next.js.
9. Auditoría de dependencias (npm audit) al cerrar cada fase.

## REGLAS DE ESCALABILIDAD
1. Esquema Prisma listo para PostgreSQL: nada específico de SQLite.
2. Lógica de negocio en src/lib/services (no en componentes ni rutas API).
3. Proveedor de IA intercambiable (interface única, config por .env).
4. Migraciones de DB con Prisma en cada fase (nunca db push suelto).
5. Variables de entorno para todo lo configurable; sin números mágicos.
6. Nuevos features = nuevas fases, sin romper lo anterior.
7. Estructura de carpetas por rol: (cliente) / (comercio) / (admin).

## TESTING (obligatorio)
- Runner: Vitest. `npm test` verde antes de cerrar CADA fase.
- 🔒 Seguridad: CLIENTE no accede a rutas de COMERCIO/ADMIN; COMERCIO solo
  modifica sus ofertas; entrada inválida rechazada por Zod; contraseñas nunca
  en texto plano; rate limit en endpoints de IA.
- 🔀 Flujo: proyecto → lista de materiales → cotización → orden por
  cercanía/precio → carrito → pedido recibido por el comercio.
- Tests unitarios de: cotizador, distancias (haversine), autorización por rol.

## Workflow de desarrollo
Cada fase se explica en criollo al usuario y NO avanza sin su confirmación.

## Fases
1. [x] Proyecto + PROMPT.md + DB + catálogo maestro seed + setup Vitest
2. [x] Auth + roles (tests 🔒 por rol)
3. [x] Panel admin: catálogo maestro (tests 🔒 admin)
4. [x] Panel comercio: activa productos y precios (tests 🔒 aislamiento)
5. [x] Asistente IA modo demo (tests 🔒 rate limit + validación)
6. [x] Cotizador + comparador (tests 💰)
7. [x] Cercanía: distancias y orden (tests 📍)
8. [x] Carrito + pedido (tests 🔀 flujo completo)
9. [x] UI final + E2E camino feliz (deploy ⏸️ pospuesto)

## Estado de avance
- **Fases 1–9 completadas y verificadas.**
- UI final: home (landing Obrix), login `/ingresar` con credenciales demo,
  shell con NavBar por rol, panel cliente (wizard asistente→cotizar→ranking→pedido
  + mis pedidos) y panel comercio (pedidos recibidos + avance de estado).
- E2E camino feliz a nivel API en Vitest (asistente → cotización → pedido →
  cancelar → comercio ve y avanza estado), con Prisma stub en memoria.
- Tests unitarios de clientes API: catálogo, oferta, asistente, cotización y pedidos.
- **Verificación:** `npm test` 233/233 (27 archivos), `tsc --noEmit` 0 errores, `next build` OK.
- **Deploy POSPUESTO:** demo corre sobre SQLite. Un deploy real requiere Postgres
  hosteado (Prisma Postgres / Neon / Vercel Postgres / Supabase) porque el filesystem
  de serverless es efímero. Pendiente cuando se retome.
- Pendiente menor: `npm run lint` roto por conflicto preexistente
  `eslint@9` vs `eslint-config-next@14` (no bloquea tests ni build).
