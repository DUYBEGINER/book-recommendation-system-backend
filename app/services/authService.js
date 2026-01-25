import { prisma } from '#lib/prisma.js';

// Get user by id
export const getUserById = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { user_id: BigInt(userId) },
    select: {
      user_id: true,
      username: true,
      email: true,
      full_name: true,
      phone_number: true,
      avatar_url: true,
      is_ban: true,
      is_activate: true,
      created_at: true,
      updated_at: true,
      roles: {
        select: {
          role_id: true,
          role_name: true,
        },
      },
    },
  });

  if (user) {
    return {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      avatarUrl: user.avatar_url,
      isBan: user.is_ban,
      isActivate: user.is_activate,
      role: user.roles?.role_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  return null;
};

// Get user by email
export const getUserByEmail = async (email) => {
  const user = await prisma.users.findUnique({
    where: { email: email },
    select: {
      user_id: true,
      username: true,
      email: true,
      full_name: true,
      phone_number: true,
      avatar_url: true,
      is_ban: true,
      is_activate: true,
      created_at: true,
      updated_at: true,
      roles: {
        select: {
          role_id: true,
          role_name: true,
        },
      },
    },
  });

  if (user) {
    return {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      avatarUrl: user.avatar_url,
      isBan: user.is_ban,
      isActivate: user.is_activate,
      role: user.roles?.role_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  return null;
};

// Find user by email for authentication (includes password)
export const findUserByEmail = async (email) => {
  const user = await prisma.users.findUnique({
    where: { email: email },
    select: {
      user_id: true,
      username: true,
      email: true,
      password: true,
      full_name: true,
      is_ban: true,
      is_activate: true,
      created_at: true,
      updated_at: true,
      roles: {
        select: {
          role_id: true,
          role_name: true,
        },
      },
    },
  });

  if (user) {
    return {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      isBan: user.is_ban,
      isActivate: user.is_activate,
      role: user.roles?.role_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  return null;
};

// Create new user
export const createUser = async (userData) => {
  // Find role_id for the given role name (default: 'user')
  const roleName = userData.role || 'user';
  const role = await prisma.roles.findUnique({
    where: { role_name: roleName },
  });

  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  const user = await prisma.users.create({
    data: {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      full_name: userData.fullName,
      role_id: role.role_id,
      is_activate: userData.isActivate || false,
      is_ban: false,
    },
    select: {
      user_id: true,
      username: true,
      email: true,
      full_name: true,
      is_activate: true,
      created_at: true,
      roles: {
        select: {
          role_name: true,
        },
      },
    },
  });

  return {
    id: user.user_id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.roles?.role_name,
    isActivate: user.is_activate,
    createdAt: user.created_at,
  };
};

export const authService = {
  getUserById,
  getUserByEmail,
  findUserByEmail,
  createUser,
};

