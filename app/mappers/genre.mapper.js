
const toGenreResponse = (genre) => {
    return {
        genreId: genre.genre_id,
        genreName: genre.genre_name,
        description: genre.description,
    };
}

export { toGenreResponse };