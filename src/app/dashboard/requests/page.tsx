import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import RequestsClient from './client';

export default async function RequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  const user = verifyToken(token);
  if (!user) redirect('/login');
  if (user.role !== 'tutor') redirect('/dashboard');
  return <RequestsClient user={user} />;
}
