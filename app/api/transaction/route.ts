import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { uploadBlob } from '@/lib/blob';

// GET already implemented above...

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Parse multipart/form-data
  const formData = await req.formData();
  const amountSent = formData.get('amount');
  const type = formData.get('type'); // "naira-to-rupees" or "rupees-to-naira"
  const file = formData.get('file') as File | null;

  if (!amountSent || !type || !file) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  // Upload screenshot to Vercel Blob
  const screenshotUrl = await uploadBlob(file);

  // Compute currencies and amountReceived + fee
  const fee = 50;
  const rate =  await db
    .select()
    .from('exchange_rates')
    .where('from_currency', type === 'naira-to-rupees' ? 'NGN' : 'INR')
    .limit(1)
    .then(rows => parseFloat(rows[0].rate.toString()));

  const amountNum = parseFloat(amountSent.toString());
  const amountReceivedRaw = amountNum * rate;
  const amountReceived = type === 'naira-to-rupees'
    ? amountReceivedRaw - fee
    : amountReceivedRaw - fee;

  // Insert transaction
  const tx = await db.insert(transactions).values({
    senderId: userId,
    receiverId: 'PENDING', // placeholder until matched
    amountSent: amountNum,
    amountReceived,
    fromCurrency: type === 'naira-to-rupees' ? 'NGN' : 'INR',
    toCurrency: type === 'naira-to-rupees' ? 'INR' : 'NGN',
    status: 'pending',
    receiptUrl: screenshotUrl,
  }).returning();

  return NextResponse.json({ message: 'Transaction created', transaction: tx[0] });
}
