import prisma from '../prisma/prisma';

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
  return await prisma.user.update({
    where: {
      username: username,
    },
    data: {
      score: score,
    },
  });
}
