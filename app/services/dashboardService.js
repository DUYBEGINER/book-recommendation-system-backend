import { prisma } from '#lib/prisma.js';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (topRatedPage = 0, topRatedSize = 5, topFavoritedPage = 0, topFavoritedSize = 5) => {
  // Get counts
  const [
    totalUsers,
    totalBooks,
    totalGenres,
    totalAuthors,
    newUsersLast7Days,
    topRatedBooks,
    topFavoritedBooks,
  ] = await Promise.all([
    // Total users (excluding admins)
    prisma.users.count({
      where: {
        roles: { role_name: { not: 'admin' } },
      },
    }),
    
    // Total books
    prisma.books.count({
      where: { is_deleted: false },
    }),
    
    // Total genres
    prisma.genres.count(),
    
    // Total authors
    prisma.authors.count(),
    
    // New users in last 7 days
    getNewUsersLast7Days(),
    
    // Top rated books
    getTopRatedBooks(topRatedPage, topRatedSize),
    
    // Top favorited books
    getTopFavoritedBooks(topFavoritedPage, topFavoritedSize),
  ]);

  return {
    totalUsers,
    totalBooks,
    totalGenres,
    totalAuthors,
    newUsersLast7Days,
    topRatedBooks,
    topFavoritedBooks,
  };
};

/**
 * Get new users count per day for last 7 days
 */
async function getNewUsersLast7Days() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const users = await prisma.users.findMany({
    where: {
      created_at: { gte: sevenDaysAgo },
      roles: { role_name: { not: 'admin' } },
    },
    select: { created_at: true },
  });

  // Group by date
  const countByDate = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    countByDate[dateStr] = 0;
  }

  users.forEach(user => {
    const dateStr = user.created_at.toISOString().split('T')[0];
    if (countByDate[dateStr] !== undefined) {
      countByDate[dateStr]++;
    }
  });

  return Object.entries(countByDate).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get top rated books with pagination
 */
async function getTopRatedBooks(page = 0, size = 5) {
  const skip = page * size;

  // Get books with average rating
  const booksWithRatings = await prisma.ratings.groupBy({
    by: ['book_id'],
    _avg: { rating_value: true },
    _count: { rating_id: true },
    orderBy: { _avg: { rating_value: 'desc' } },
    skip,
    take: size,
  });

  const bookIds = booksWithRatings.map(r => r.book_id);

  const books = await prisma.books.findMany({
    where: {
      book_id: { in: bookIds },
      is_deleted: false,
    },
    select: {
      book_id: true,
      title: true,
      cover_image_url: true,
    },
  });

  // Get total count
  const totalDistinctBooks = await prisma.ratings.groupBy({
    by: ['book_id'],
  });

  const content = booksWithRatings.map(rating => {
    const book = books.find(b => b.book_id === rating.book_id);
    return {
      id: rating.book_id.toString(),
      title: book?.title || 'Unknown',
      coverImageUrl: book?.cover_image_url,
      averageRating: Math.round((rating._avg.rating_value || 0) * 10) / 10,
      ratingCount: rating._count.rating_id,
    };
  });

  return {
    content,
    number: page,
    size,
    totalElements: totalDistinctBooks.length,
    totalPages: Math.ceil(totalDistinctBooks.length / size),
  };
}

/**
 * Get top favorited books with pagination
 */
async function getTopFavoritedBooks(page = 0, size = 5) {
  const skip = page * size;

  // Get books with favorite count
  const booksWithFavorites = await prisma.favorites.groupBy({
    by: ['book_id'],
    _count: { favorite_id: true },
    orderBy: { _count: { favorite_id: 'desc' } },
    skip,
    take: size,
  });

  const bookIds = booksWithFavorites.map(f => f.book_id);

  const books = await prisma.books.findMany({
    where: {
      book_id: { in: bookIds },
      is_deleted: false,
    },
    select: {
      book_id: true,
      title: true,
      cover_image_url: true,
    },
  });

  // Get total count
  const totalDistinctBooks = await prisma.favorites.groupBy({
    by: ['book_id'],
  });

  const content = booksWithFavorites.map(fav => {
    const book = books.find(b => b.book_id === fav.book_id);
    return {
      id: fav.book_id.toString(),
      title: book?.title || 'Unknown',
      coverImageUrl: book?.cover_image_url,
      favoriteCount: fav._count.favorite_id,
    };
  });

  return {
    content,
    number: page,
    size,
    totalElements: totalDistinctBooks.length,
    totalPages: Math.ceil(totalDistinctBooks.length / size),
  };
}

export const dashboardService = {
  getDashboardStats,
};
