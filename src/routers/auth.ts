import type { Request, Response } from 'express';
import { Router } from 'express';
import { AuthService } from '../services/auth';

const authService = new AuthService();
const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const token = await authService.register(username, password);
    res.status(201).json({ token });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const token = await authService.login(username, password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

export default router;
