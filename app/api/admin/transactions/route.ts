// GET and PATCH for admin

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

function isAdmin() {
  const adminAuth = cookies().get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allTx = await db.select().from(transactions);
  return NextResponse.json(allTx);
}

export async function PATCH(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { status } = await req.json();
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.id, Number(id)));

  return NextResponse.json({ success: true });
}
