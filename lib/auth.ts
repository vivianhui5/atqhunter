import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  return session;
}

/**
 * Check if user is authenticated as admin (without redirecting)
 * Returns true if user has an active admin session
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session;
}

