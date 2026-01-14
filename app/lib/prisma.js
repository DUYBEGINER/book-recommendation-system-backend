import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = `${process.env.DATABASE_URL}`

//Get schema from connection string, default to 'public' if not provided
const schema = new URL(connectionString).searchParams.get('schema') || 'public';
const adapter = new PrismaPg({ 
        connectionString 
    }, 
    { 
        schema 
    }
);

const prisma = new PrismaClient({ 
    adapter,
    log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
 })

//  prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query)
//   console.log('Params: ' + e.params)
//   console.log('Duration: ' + e.duration + 'ms')
// })

export { prisma, PrismaClient };