const prisma = require('./lib/prisma').prisma

async function main() {

    // Fetch all users with their posts
    const allUsers = await prisma.authors.findMany({ where: { author_id: 115 } })
    console.log('All users:', JSON.stringify(allUsers, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
        , 2));
    const r = await prisma.$queryRaw`SELECT current_schema() as s, current_setting('search_path') as sp`;
    console.log(r);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })