import { compare } from 'bcryptjs';
import { db } from './db';
import { admins } from './schema';

export async function signInAdmin(username: string, password: string) {
  const [admin] = await db
    .select()
    .from(admins)
    .where(admins.username.eq(username))
    .execute();
  if (!admin) return false;
  const valid = await compare(password, admin.passwordHash);
  if (!valid) return false;

  // Set cookie/session here (simplest: set a httpOnly cookie)
  // Implementation depends on your session strategy (e.g. iron-session)

  return true;
}