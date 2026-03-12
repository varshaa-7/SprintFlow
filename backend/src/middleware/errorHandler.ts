import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    console.error('[Error]', err);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  res.status(statusCode).json({ error: message });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
