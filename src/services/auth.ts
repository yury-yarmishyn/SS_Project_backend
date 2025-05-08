import prisma from '../prisma/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET! as Secret;

type TTL = number | SignOptions['expiresIn'];
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as TTL;

if (!JWT_SECRET) {
  throw new Error('Missing environment variable: JWT_SECRET');
}

export class AuthService {
  /**
   * Registers a new user.
   * @returns JWT access token
   */
  async register(username: string, password: string): Promise<string> {
    const existing = await prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      throw new Error('A user with that username already exists');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username,
        password: hashed,
        score: 0,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return token;
  }

  /**
   * Logs in an existing user.
   * @returns JWT access token
   */
  async login(username: string, password: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return token;
  }

  async verify(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return payload as JwtPayload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }
}
