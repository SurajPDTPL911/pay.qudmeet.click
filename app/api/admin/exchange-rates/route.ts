import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeRates } from '@/lib/schema';
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
    
    const rates = await db
      .select()
      .from(exchangeRates)
      .orderBy(desc(exchangeRates.updatedAt));
      
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
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
    const { fromCurrency, toCurrency, rate } = body;
    
    if (!fromCurrency || !toCurrency || !rate) {
      return NextResponse.json(
        { error: 'From currency, to currency, and rate are required' },
        { status: 400 }
      );
    }
    
    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        { error: 'From currency and to currency cannot be the same' },
        { status: 400 }
      );
    }
    
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      return NextResponse.json(
        { error: 'Rate must be a positive number' },
        { status: 400 }
      );
    }
    
    // Insert new exchange rate
    await db.insert(exchangeRates).values({
      fromCurrency,
      toCurrency,
      rate: rateValue.toString(),
    });
    
    // Also insert the inverse rate for convenience
    const inverseRate = (1 / rateValue).toString();
    await db.insert(exchangeRates).values({
      fromCurrency: toCurrency,
      toCurrency: fromCurrency,
      rate: inverseRate,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Exchange rate updated successfully',
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
