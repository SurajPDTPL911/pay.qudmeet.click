// GET and PATCH for admin

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function isAdmin() {
  // In Next.js 15, cookies() returns a Promise
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all transactions with most recent first
    const allTx = await db
      .select()
      .from(transactions)
      .orderBy(transactions.createdAt);

    return NextResponse.json(allTx);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to load transactions. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { status } = await req.json();
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.id, Number(id)));

  return NextResponse.json({ success: true });
}
