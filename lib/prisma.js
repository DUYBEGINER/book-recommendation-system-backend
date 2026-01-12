require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/client');

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

module.exports = { prisma }