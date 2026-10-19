import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  categorias,
  comerciosDemo,
  productosBase,
  type ComercioSeed,
} from "./catalogo.seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "obrix1234";

async function seedUsuarios() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.usuario.upsert({
    where: { email: "admin@obrix.local" },
    create: {
      email: "admin@obrix.local",
      nombre: "Admin Obrix",
      rol: "ADMIN",
      passwordHash,
    },
    update: { rol: "ADMIN", passwordHash },
  });

  await prisma.usuario.upsert({
    where: { email: "cliente@obrix.local" },
    create: {
      email: "cliente@obrix.local",
      nombre: "Cliente Demo",
      rol: "CLIENTE",
      passwordHash,
    },
    update: { rol: "CLIENTE", passwordHash },
  });

  for (const c of comerciosDemo) {
    const user = await prisma.usuario.upsert({
      where: { email: c.email },
      create: {
        email: c.email,
        nombre: c.nombre,
        rol: "COMERCIO",
        passwordHash,
      },
      update: { nombre: c.nombre, rol: "COMERCIO", passwordHash },
    });

    await prisma.comercio.upsert({
      where: { ownerId: user.id },
      create: {
        nombre: c.nombre,
        direccion: c.direccion,
        lat: c.lat,
        lng: c.lng,
        telefono: c.telefono,
        ownerId: user.id,
      },
      update: {
        nombre: c.nombre,
        direccion: c.direccion,
        lat: c.lat,
        lng: c.lng,
        telefono: c.telefono,
      },
    });
  }
}

async function seedOfertas(c: ComercioSeed) {
  const user = await prisma.usuario.findUnique({
    where: { email: c.email },
    select: { id: true },
  });
  if (!user) return 0;

  const comercio = await prisma.comercio.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!comercio) return 0;

  let count = 0;
  for (const o of c.ofertas) {
    const producto = await prisma.producto.findUnique({
      where: { sku: o.sku },
      select: { id: true },
    });
    if (!producto) continue;

    await prisma.oferta.upsert({
      where: {
        comercioId_productoId: {
          comercioId: comercio.id,
          productoId: producto.id,
        },
      },
      create: {
        comercioId: comercio.id,
        productoId: producto.id,
        precio: o.precio,
        stock: o.stock,
        marca: o.marca,
        presentacion: "",
        activo: true,
      },
      update: {
        precio: o.precio,
        stock: o.stock,
        marca: o.marca,
        activo: true,
      },
    });
    count++;
  }
  return count;
}

async function main() {
  await seedUsuarios();

  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      create: { nombre: c.nombre, orden: c.orden },
      update: { orden: c.orden },
    });
  }
  const catMap = new Map(
    (await prisma.categoria.findMany()).map((c) => [c.nombre, c.id]),
  );
  let created = 0;
  for (const p of productosBase) {
    const cid = catMap.get(p.categoria);
    if (!cid) continue;
    await prisma.producto.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        unidad: p.unidad,
        descripcion: p.descripcion,
        categoriaId: cid,
      },
      update: {
        nombre: p.nombre,
        unidad: p.unidad,
        descripcion: p.descripcion,
        categoriaId: cid,
      },
    });
    created++;
  }
  let ofertasCreadas = 0;
  for (const c of comerciosDemo) {
    ofertasCreadas += await seedOfertas(c);
  }
  const logins = [
    "admin@obrix.local",
    "cliente@obrix.local",
    ...comerciosDemo.map((c) => c.email),
  ];
  console.log(
    `Seed OK: ${2 + comerciosDemo.length} usuarios demo (admin + cliente + ${comerciosDemo.length} comercios), ${created} productos, ${categorias.length} categorías, ${ofertasCreadas} ofertas`,
  );
  console.log(
    `Login demo (password: ${DEMO_PASSWORD}): ${logins.join(" | ")}`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
