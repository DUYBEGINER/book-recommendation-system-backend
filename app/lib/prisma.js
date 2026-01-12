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

const prisma = new PrismaClient({ adapter })

export { prisma, PrismaClient };