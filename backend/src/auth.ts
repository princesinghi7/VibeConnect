import type { Request, Response, NextFunction } from 'express';
import { users } from './data';

// Demo-grade auth: token is just `demo-token:<userId>`. Good enough for a portfolio
// project's local dev loop — swap for real JWTs before shipping to production.
export function makeToken(userId: string) {
  return `demo-token:${userId}`;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token?.split(':')[1];
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  (req as Request & { userId: string }).userId = user.id;
  next();
}
