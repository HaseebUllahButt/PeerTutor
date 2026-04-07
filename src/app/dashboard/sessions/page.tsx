import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import SessionsPageClient from './client';

export default async function SessionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  const user = verifyToken(token);
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/dashboard');
  return <SessionsPageClient user={user} />;
}
