import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import InvoicesClient from './client';

export default async function InvoicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) redirect('/login');
  
  const user = verifyToken(token);
  if (!user) redirect('/login');
  
  return <InvoicesClient user={user} />;
}
