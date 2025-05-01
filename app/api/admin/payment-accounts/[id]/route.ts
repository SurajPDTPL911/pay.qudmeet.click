import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentAccounts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function isAdmin() {
  // In Next.js 15, cookies() returns a Promise
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID from params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get status from request body
    const body = await req.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json(
        { error: 'isActive status is required' },
        { status: 400 }
      );
    }

    // Update account status
    const [updatedAccount] = await db
      .update(paymentAccounts)
      .set({ isActive })
      .where(eq(paymentAccounts.id, Number(id)))
      .returning();

    if (!updatedAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account status updated to ${isActive ? 'active' : 'inactive'}`,
      account: updatedAccount,
    });
  } catch (error) {
    console.error('Error updating account status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account ID from params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account details
    const [account] = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.id, Number(id)))
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
