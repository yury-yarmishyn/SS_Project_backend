import type { Request, Response } from 'express';
import { Router } from 'express';
import { getLeaderboard, updateLeaderboard } from '../services/leaderboard';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = await getLeaderboard();
  res.json(result);
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { username, score } = req.body as { username?: string; score?: number };

    if (typeof username !== 'string' || typeof score !== 'number') {
      res.status(400).json({ error: 'Username and score are required.' });
      return;
    }

    const updated = await updateLeaderboard(username, score);
    res.json(updated);
  } catch (error) {
    console.error('[Leaderboard] Failed to update score:', error);
    res.status(500).json({ error: 'Failed to update leaderboard.' });
  }
});

export default router;
