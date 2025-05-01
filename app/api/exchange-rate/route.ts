import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentExchangeRate, updateExchangeRate } from '@/lib/transactions';

// Get current exchange rate
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');

    if (!fromCurrency || !toCurrency) {
      return new NextResponse('From and to currencies are required', { status: 400 });
    }

    const rate = await getCurrentExchangeRate(fromCurrency, toCurrency);
    return NextResponse.json({ rate });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Update exchange rate (admin only)
export async function POST(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // TODO: Check if user is admin

  try {
    const body = await req.json();
    const { fromCurrency, toCurrency, rate } = body;

    if (!fromCurrency || !toCurrency || !rate) {
      return new NextResponse('From currency, to currency, and rate are required', { status: 400 });
    }

    // Validate rate
    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      return new NextResponse('Invalid rate', { status: 400 });
    }

    const result = await updateExchangeRate(fromCurrency, toCurrency, rateNum);
    if (!result) {
      return new NextResponse('Failed to update exchange rate', { status: 400 });
    }

    return NextResponse.json({ message: 'Exchange rate updated' });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}