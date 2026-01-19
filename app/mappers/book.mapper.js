

/**
 * Extract and map authors from book_authors relation
 */
const mapAuthors = (bookAuthors) => {
  if (!Array.isArray(bookAuthors)) return [];
  
  return bookAuthors
    .filter(ba => ba?.authors?.author_id && ba?.authors?.author_name)
    .map(ba => ({
      authorId: ba.authors.author_id,
      authorName: ba.authors.author_name,
    }));
};

// /**
//  * Extract and map genres from book_genres relation
//  */
const mapGenres = (bookGenres) => {
  if (!Array.isArray(bookGenres)) return [];
    return bookGenres
    .filter(bg => bg?.genres?.genre_id && bg?.genres?.genre_name)
    .map(bg => ({
      genreId: bg.genres.genre_id,
      genreName: bg.genres.genre_name,
    }));
};

/**
 * Map base book fields (used by both list and detail)
 */
const mapBaseBookFields = (book) => ({
  bookId: book.book_id,
  title: book.title,
  coverImageUrl: book.cover_image_url,
  publicationYear: book.publication_year,
  authors: mapAuthors(book.book_authors),
});

/**
 * Transform single book to list response format
 */
const toBookListItem = (book) => {
  if (!book) return null;
  return mapBaseBookFields(book);
};

/**
 * Transform single book to detail response format
 */
const toBookDetailItem = (book) => {
  if (!book) return null;
  
  return {
    ...mapBaseBookFields(book),
    description: book.description,
    publisher: book.publisher,
    genres: mapGenres(book.book_genres),
  };
};

/** Transform single book to preview response format
 */
const toBookPreviewItem = (book) => {
  if (!book) return null;
  
  return {
    bookId: book.book_id,
    description: book.description,
    publicationYear: book.publication_year,
    coverImageUrl: book.cover_image_url,
    genres: mapGenres(book.book_genres),
    authors: mapAuthors(book.book_authors),
  };
};

/** Transform array of books to preview response format
 */
export const toBookPreviewResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookPreviewItem(books);

  return books.map(toBookPreviewItem).filter(Boolean);
};


/**
 * Transform array of books to list response format
 */
export const toBookListResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookListItem(books);
  
  return books.map(toBookListItem).filter(Boolean);
};

/**
 * Transform array of books to detail response format
 */
export const toBookDetailResponse = (books) => {
  if (!books) return null;
  if (!Array.isArray(books)) return toBookDetailItem(books);

  return books.map(toBookDetailItem).filter(Boolean);
};

