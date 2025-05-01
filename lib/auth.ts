import { compare } from 'bcryptjs';
import { db } from './db';
import { admins } from './schema';
import { eq, or } from 'drizzle-orm';

/**
 * Verify admin credentials by username
 */
export async function signInAdmin(username: string, password: string): Promise<boolean> {
  try {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username))
      .execute();

    if (!admin) return false;

    const valid = await compare(password, admin.passwordHash);
    if (!valid) return false;

    return true;
  } catch (error) {
    console.error('Error signing in admin:', error);
    return false;
  }
}

/**
 * Verify admin credentials by email or username
 */
export async function verifyAdmin(emailOrUsername: string, password: string): Promise<boolean> {
  try {
    // Check if the admin exists by email or username
    const [admin] = await db
      .select()
      .from(admins)
      .where(
        or(
          eq(admins.email, emailOrUsername),
          eq(admins.username, emailOrUsername)
        )
      )
      .execute();

    if (!admin) return false;

    // Verify password
    const valid = await compare(password, admin.passwordHash);
    if (!valid) return false;

    return true;
  } catch (error) {
    console.error('Error verifying admin:', error);
    throw error; // Rethrow to allow fallback to environment variables
  }
}