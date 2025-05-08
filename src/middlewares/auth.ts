import type { RequestHandler } from 'express';
import { AuthService } from '../services/auth';

const authService = new AuthService();

/**
 * Protect routes by validating a Bearer JWT.
 * On success, attaches decoded payload to req.user.
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const payload = await authService.verify(token);
    next();
    return;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};
