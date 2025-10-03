import { NextResponse } from 'next/server';
import { prisma } from '@/core/clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Healthcheck failed', e);
    return new NextResponse('DB not reachable or schema missing', { status: 500 });
  }
}
