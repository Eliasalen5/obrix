import {PrismaClient} from './src/generated/prisma/client'
import {PrismaPg} from '@prisma/adapter-pg'
import 'dotenv/config'
const adapter=new PrismaPg({connectionString:process.env.DATABASE_URL})
const prisma=new PrismaClient({adapter})
prisma.usuario.findMany({select:{id:true,email:true,rol:true,nombre:true},orderBy:{createdAt:'desc'},take:20})
  .then(r=>{console.log(JSON.stringify(r)); return prisma.$disconnect();})
  .catch(e=>{console.error('ERR');process.exit(1);})
