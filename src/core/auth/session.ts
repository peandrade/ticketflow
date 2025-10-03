'use server';

import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '../clients';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';

const DAY = 60 * 60 * 24;
const SESSION_COOKIE = 'session';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('base64url');
}

export async function createSession(userId: string, days = 7) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + days * DAY * 1000);

  await prisma.session.create({ data: { tokenHash, userId, expiresAt } });

  const ck = await cookies();
  ck.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: days * DAY,
  });
}

export async function getSessionUser() {
  const ck = await cookies();
  const raw = ck.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { tokenHash: session.tokenHash } }).catch(() => {});
    ck.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
    return null;
  }

  return session.user;
}

export async function logout() {
  const ck = await cookies();
  const raw = ck.get(SESSION_COOKIE)?.value;
  if (raw) {
    await prisma.session.delete({ where: { tokenHash: hashToken(raw) } }).catch(() => {});
  }
  ck.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function registerUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash } });
  await createSession(user.id);
  return user;
}

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  await createSession(user.id);
  return user;
}
