/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * Database Error Handler
 * Converts Prisma errors to AppErrors
 */
export class DatabaseError extends AppError {
  constructor(error) {
    let message = 'Database operation failed';
    let statusCode = 500;

    // Prisma-specific error codes
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      message = `${field} already exists`;
      statusCode = 409;
    } else if (error.code === 'P2025') {
      // Record not found
      message = 'Record not found';
      statusCode = 404;
    } else if (error.code === 'P2003') {
      // Foreign key constraint failed
      message = 'Related record not found';
      statusCode = 400;
    } else if (error.code === 'P2014') {
      // Required relation violation
      message = 'Invalid relationship';
      statusCode = 400;
    }

    super(message, statusCode);
    this.originalError = error;
  }
}

/**
 * Handle Prisma Errors
 */
export function handlePrismaError(error) {
  if (error.code && error.code.startsWith('P')) {
    return new DatabaseError(error);
  }
  return error;
}
