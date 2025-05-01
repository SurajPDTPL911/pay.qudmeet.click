import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

// Upload avatar
export async function POST(req: Request) {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse('File must be an image', { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`avatars/${userId}-${Date.now()}.${file.type.split('/')[1]}`, file, {
      access: 'public',
    });

    // Update user profile with new avatar URL
    const [updatedUser] = await db
      .update(users)
      .set({
        profilePicture: blob.url,
      })
      .where(eq(users.clerkId, userId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
