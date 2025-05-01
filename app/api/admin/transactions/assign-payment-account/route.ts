import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, paymentAccounts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { createNotification, NotificationType } from '@/lib/notifications';

async function isAdmin() {
  // In Next.js 15, cookies() returns a Promise
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function POST(req: Request) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { transactionId, paymentAccountId } = body;

    if (!transactionId || !paymentAccountId) {
      return NextResponse.json(
        { error: 'Transaction ID and payment account ID are required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId))
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if payment account exists
    const [paymentAccount] = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.id, paymentAccountId))
      .limit(1);

    if (!paymentAccount) {
      return NextResponse.json(
        { error: 'Payment account not found' },
        { status: 404 }
      );
    }

    // Check if payment account is active
    if (!paymentAccount.isActive) {
      return NextResponse.json(
        { error: 'Payment account is inactive' },
        { status: 400 }
      );
    }

    // Check if payment account currency matches transaction currency
    if (paymentAccount.currency !== transaction.fromCurrency) {
      return NextResponse.json(
        { error: `Payment account currency (${paymentAccount.currency}) does not match transaction currency (${transaction.fromCurrency})` },
        { status: 400 }
      );
    }

    // Assign payment account to transaction
    await db
      .update(transactions)
      .set({ paymentAccountId })
      .where(eq(transactions.transactionId, transactionId));

    // Notify user about payment account
    await createNotification(transaction.senderId, {
      title: 'Payment Account Assigned',
      message: `Please send ${transaction.amountSent} ${transaction.fromCurrency} to ${paymentAccount.accountName} (${paymentAccount.accountNumber}) at ${paymentAccount.bankName}.`,
      type: NotificationType.PAYMENT_ACCOUNT_ASSIGNED,
      relatedEntityId: transactionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment account assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning payment account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
