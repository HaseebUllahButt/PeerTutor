import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TutorDashboard from '@/components/dashboard/TutorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = verifyToken(token);
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      {user.role === 'student' && <StudentDashboard user={user} />}
      {user.role === 'tutor' && <TutorDashboard user={user} />}
      {user.role === 'admin' && <AdminDashboard user={user} />}
    </>
  );
}
