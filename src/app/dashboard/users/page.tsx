import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import UsersClient from './client';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  const user = verifyToken(token);
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');
  return <UsersClient user={user} />;
}
