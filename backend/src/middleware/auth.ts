import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}


export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}


export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
