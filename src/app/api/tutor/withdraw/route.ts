import {
  createTutorWithdrawal,
  getTutorWithdrawals,
} from '@/features/tutor/server/tutorHandlers';

export const GET = getTutorWithdrawals;
export const POST = createTutorWithdrawal;
