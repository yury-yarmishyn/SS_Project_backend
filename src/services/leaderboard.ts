import prisma from '../prisma/prisma';
import { randomUUID } from 'crypto';

export async function getLeaderboard() {
  return await prisma.user.findMany({
    select: {
      username: true,
      score: true,
    },
    orderBy: {
      score: 'desc',
    },
    take: 10,
  });
}

export async function updateLeaderboard(username: string, score: number) {
  // Check existing score
  const existing = await prisma.user.findUnique({ where: { username } });

  // If user exists and the new score is not higher, return existing record as is
  if (existing && existing.score >= score) {
    return existing;
  }

  // Otherwise create or update with the higher score
  return await prisma.user.upsert({
    where: { username },
    update: { score },
    create: {
      id: existing?.id ?? randomUUID(),
      username,
      password: existing?.password ?? '',
      score,
    },
  });
}
