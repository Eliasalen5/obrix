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
1. Proyecto + PROMPT.md + DB + catálogo maestro seed + setup Vitest
2. Auth + roles (tests 🔒 por rol)
3. Panel admin: catálogo maestro (tests 🔒 admin)
4. Panel comercio: activa productos y precios (tests 🔒 aislamiento)
5. Asistente IA modo demo (tests 🔒 rate limit + validación)
6. Cotizador + comparador (tests 💰)
7. Cercanía: distancias y orden (tests 📍)
8. Carrito + pedido (tests 🔀 flujo completo)
9. UI final + deploy (E2E camino feliz)
