import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { ne } from 'drizzle-orm';

// Get all users except the current user
export async function GET() {
  try {
    // In Next.js 15, auth() returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all users except the current user
    const allUsers = await db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        name: users.name,
        email: users.email,
        country: users.country,
        currency: users.currency,
        profilePicture: users.profilePicture,
      })
      .from(users)
      .where(ne(users.clerkId, userId));

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
