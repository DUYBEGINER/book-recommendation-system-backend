// import { ApiResponse, logger } from "#utils/response.js";
// import {  } from "#services/bookService.js";


// const uploadBook = async (req, res) => {
//     // Extract book data from request body
    // const { title, author, genreId, description, contentUrl } = req.body;

    // // Basic validation
    // if (!title || !author || !genreId || !contentUrl) {
    //     return ApiResponse.error(res, 'Missing required book fields', 400);
    // }

//     try{
//         const newBook = await createBookService({ title, author, genreId, description, contentUrl });

//         const bookResponse = toBookDetailResponse(newBook);
//         return ApiResponse.success(res, bookResponse, 'Book uploaded successfully');
//     } catch (error) {
//         logger.error(`Error uploading book: ${error.message}`);
//         return ApiResponse.error(res, 'Failed to upload book', 500);
//     }

// }