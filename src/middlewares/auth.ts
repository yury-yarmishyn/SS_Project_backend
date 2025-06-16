import type { RequestHandler } from 'express';
import { AuthService } from '../services/auth';

const authService = new AuthService();

/**
 * Protect routes by validating JWT from cookies.
 * On success, attaches decoded payload to req.user.
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const payload = await authService.verify(token);
    // Attach decoded payload to request object for downstream handlers
    (req as any).user = payload;
    next();
    return;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};
