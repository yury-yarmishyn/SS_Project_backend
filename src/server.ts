import type { Application } from 'express';
import express from 'express';
import cors from 'cors';
import leaderboardRouter from './routers/leaderboard';
import authRouter from './routers/auth';
import { authMiddleware } from './middlewares/auth';

const app: Application = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.use(authMiddleware);

app.use('/leaderboard', leaderboardRouter);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log('Server is running');
});
