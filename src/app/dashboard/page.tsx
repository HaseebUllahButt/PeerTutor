import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import StudentDashboard from '@/features/dashboard/components/StudentDashboard';
import TutorDashboard from '@/features/dashboard/components/TutorDashboard';
import AdminDashboard from '@/features/dashboard/components/AdminDashboard';

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
