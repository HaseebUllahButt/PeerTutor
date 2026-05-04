import {
  createTutorInvoice,
  getTutorInvoices,
} from '@/features/tutor/server/tutorHandlers';

export const GET = getTutorInvoices;
export const POST = createTutorInvoice;
