import type { Request, Response } from 'express';
import { Router } from 'express';
import { getLeaderboard } from '../services/leaderboard';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  debugger
  const result = await getLeaderboard();
  res.json(result);
});

export default router;
