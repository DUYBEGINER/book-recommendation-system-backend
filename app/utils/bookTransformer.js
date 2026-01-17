/**
 * Transform book data from database format to API format
 */

/**
 * Transform a single book object
 * @param {Object} book - Raw book data from database
 * @returns {Object} Transformed book object
 */
export const transformBook = (book) => {
  if (!book) return null;

  return {
    id: book.book_id,
    title: book.title,
    description: book.description,
    coverImageUrl: book.cover_image_url,
    publicationYear: book.publication_year,
    publisher: book.publisher,
    isDeleted: book.is_deleted,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    // Transform relations
    authors: book.book_authors ? book.book_authors.map(ba => ({
      id: ba.authors?.author_id,
      name: ba.authors?.name,
      biography: ba.authors?.biography,
      birthYear: ba.authors?.birth_year,
      deathYear: ba.authors?.death_year,
      nationality: ba.authors?.nationality,
    })).filter(a => a.id) : undefined,
    genres: book.book_genres ? book.book_genres.map(bg => ({
      id: bg.genres?.genre_id || bg.genre_id,
      name: bg.genres?.name,
      description: bg.genres?.description,
    })).filter(g => g.id) : undefined,
    formats: book.book_formats ? book.book_formats.map(bf => ({
      id: bf.format_id,
      formatType: bf.format_type,
      fileUrl: bf.file_url,
      fileSize: bf.file_size,
      createdAt: bf.created_at,
    })) : undefined,
    // Include read_count if present (for most read books)
    ...(book.read_count !== undefined && { readCount: book.read_count }),
  };
};

/**
 * Transform an array of books
 * @param {Array} books - Array of raw book data from database
 * @returns {Array} Array of transformed book objects
 */
export const transformBooks = (books) => {
  if (!Array.isArray(books)) return [];
  return books.map(transformBook);
};

/**
 * Transform paginated books response
 * @param {Object} result - Result object with data and pagination
 * @returns {Object} Transformed result with data and pagination
 */
export const transformPaginatedBooks = (result) => {
  return {
    data: transformBooks(result.data),
    pagination: result.pagination,
  };
};
