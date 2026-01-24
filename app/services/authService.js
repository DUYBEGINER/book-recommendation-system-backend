import { prisma } from '#lib/prisma.js';

// Get user by id
export const getUserById = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { user_id: BigInt(userId) },
    select: {
      user_id: true,
      email: true,
    },
    });

    return user;
}

