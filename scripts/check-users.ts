import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

prisma.usuario
  .findMany({
    select: { id: true, email: true, rol: true, nombre: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  .then((usuarios) => {
    console.log(JSON.stringify(usuarios, null, 2));
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error("Error al listar usuarios:", error);
    process.exit(1);
  });
