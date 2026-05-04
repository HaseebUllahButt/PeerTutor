import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import PaymentsClient from './client';

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) redirect('/login');
  
  const user = verifyToken(token);
  if (!user) redirect('/login');
  
  return <PaymentsClient user={user} />;
}
