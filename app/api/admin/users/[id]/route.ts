import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
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

    // Get user ID from params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Update user status
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, Number(id)));

    return NextResponse.json({
      success: true,
      message: `User status updated to ${isActive ? 'active' : 'inactive'}`,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
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

    // Get user ID from params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
