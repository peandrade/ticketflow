import { NextResponse } from 'next/server';
import { listEvents } from '../../../core/events';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10) || 0;
  const take = Math.min(parseInt(searchParams.get('take') ?? '12', 10) || 12, 48);
  const q = searchParams.get('q');

  const data = await listEvents({ page, take, q });
  return NextResponse.json(data);
}
