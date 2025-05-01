import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, EmailType } from '@/lib/email';

// Get user profile
export async function GET(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Update user profile
export async function POST(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { country, currency, schoolName, phoneNumber } = body;

    // Validate required fields
    if (!country || !currency || !phoneNumber) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          country,
          currency,
          schoolName: schoolName || null,
          phoneNumber,
        })
        .where(eq(users.clerkId, userId))
        .returning();

      return NextResponse.json(updatedUser);
    } else {
      // Get user data from Clerk
      const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!clerkResponse.ok) {
        throw new Error('Failed to fetch user data from Clerk');
      }

      const clerkUser = await clerkResponse.json();
      const email = clerkUser.email_addresses[0]?.email_address;
      const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim();

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          name,
          email,
          country,
          currency,
          schoolName: schoolName || null,
          phoneNumber,
        })
        .returning();

      // Send welcome email
      await sendEmail(EmailType.WELCOME, { name }, email);

      return NextResponse.json(newUser);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}