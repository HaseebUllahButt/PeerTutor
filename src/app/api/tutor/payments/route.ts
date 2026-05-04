import {
  createTutorPayment,
  getTutorPayments,
} from '@/features/tutor/server/tutorHandlers';

export const GET = getTutorPayments;
export const POST = createTutorPayment;
