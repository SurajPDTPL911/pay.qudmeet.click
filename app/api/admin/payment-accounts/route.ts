import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentAccounts } from '@/lib/schema';
import { cookies } from 'next/headers';
import { desc } from 'drizzle-orm';

async function isAdmin() {
  // In Next.js 15, cookies() returns a Promise
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accounts = await db
      .select()
      .from(paymentAccounts)
      .orderBy(desc(paymentAccounts.createdAt));
      
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { accountType, currency, accountName, accountNumber, bankName } = body;
    
    if (!accountType || !currency || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'Account type, currency, account name, and account number are required' },
        { status: 400 }
      );
    }
    
    // Insert new payment account
    const [account] = await db
      .insert(paymentAccounts)
      .values({
        accountType,
        currency,
        accountName,
        accountNumber,
        bankName: bankName || null,
        isActive: true,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Payment account added successfully',
      account,
    });
  } catch (error) {
    console.error('Error adding payment account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
