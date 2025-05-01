import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createTransaction, getTransactionById, getUserTransactions, TransactionType, updateTransactionStatus } from '@/lib/transactions';

// Get all transactions for the current user
export async function GET(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('id');

    // If transaction ID is provided, return that specific transaction
    if (transactionId) {
      const transaction = await getTransactionById(transactionId);

      // Make sure the user has access to this transaction
      if (!transaction || (transaction.senderId !== userId && transaction.receiverId !== userId)) {
        return new NextResponse('Not found', { status: 404 });
      }

      return NextResponse.json(transaction);
    }

    // Otherwise return all transactions for the user
    const transactions = await getUserTransactions(userId);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Create a new transaction
export async function POST(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const amountSent = formData.get('amount');
    const type = formData.get('type'); // "naira-to-rupees" or "rupees-to-naira"
    const file = formData.get('file') as File | null;

    // Get receiver information
    const receiverName = formData.get('receiverName');
    const receiverAccountNumber = formData.get('receiverAccountNumber');
    const receiverBankName = formData.get('receiverBankName');
    const receiverPhoneNumber = formData.get('receiverPhoneNumber');

    if (!amountSent || !type || !receiverName || !receiverAccountNumber || !receiverBankName || !receiverPhoneNumber) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate transaction type
    if (type !== 'naira-to-rupees' && type !== 'rupees-to-naira') {
      return new NextResponse('Invalid transaction type', { status: 400 });
    }

    // Validate amount
    const amount = parseFloat(amountSent.toString());
    if (isNaN(amount) || amount <= 0) {
      return new NextResponse('Invalid amount', { status: 400 });
    }

    // Create transaction
    const transaction = await createTransaction({
      senderId: userId,
      amountSent: amount,
      type: type as TransactionType,
      screenshot: file || undefined,
      receiverInfo: {
        name: receiverName?.toString() || '',
        accountNumber: receiverAccountNumber?.toString() || '',
        bankName: receiverBankName?.toString() || '',
        phoneNumber: receiverPhoneNumber?.toString() || '',
      },
    });

    return NextResponse.json({
      message: 'Transaction created',
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Update transaction status (admin only)
export async function PATCH(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return new NextResponse('Transaction ID is required', { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse('Status is required', { status: 400 });
    }

    // Validate status
    const validStatuses = ['awaiting_payment', 'payment_received', 'transfer_in_progress', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    // Update transaction status
    const result = await updateTransactionStatus({
      transactionId,
      status: status as any,
      adminId: userId,
    });

    if (!result) {
      return new NextResponse('Failed to update status', { status: 400 });
    }

    return NextResponse.json({ message: 'Status updated' });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
