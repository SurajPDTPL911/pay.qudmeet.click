import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { admins } from '@/lib/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not found in environment variables' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, adminEmail))
      .limit(1);

    let admin;

    if (existingAdmin.length > 0) {
      // Update existing admin
      console.log('Updating existing admin with email:', adminEmail);
      const [updatedAdmin] = await db
        .update(admins)
        .set({
          passwordHash,
        })
        .where(eq(admins.email, adminEmail))
        .returning();

      admin = updatedAdmin;
    } else {
      // Try to find admin by username
      const existingAdminByUsername = await db
        .select()
        .from(admins)
        .where(eq(admins.username, 'admin'))
        .limit(1);

      if (existingAdminByUsername.length > 0) {
        // Update existing admin by username
        console.log('Updating existing admin with username: admin');
        const [updatedAdmin] = await db
          .update(admins)
          .set({
            email: adminEmail,
            passwordHash,
          })
          .where(eq(admins.username, 'admin'))
          .returning();

        admin = updatedAdmin;
      } else {
        // Create new admin
        console.log('Creating new admin user');
        try {
          const [newAdmin] = await db
            .insert(admins)
            .values({
              username: 'admin',
              email: adminEmail,
              passwordHash,
            })
            .returning();

          admin = newAdmin;
        } catch (error) {
          console.error('Error inserting admin:', error);
          throw new Error(`Failed to insert admin: ${error.message}`);
        }
      }
    }

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create or update admin user',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created/updated successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
