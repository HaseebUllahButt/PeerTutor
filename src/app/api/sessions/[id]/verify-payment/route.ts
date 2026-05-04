import {
  getSessionPaymentStatus,
  verifySessionPayment,
} from '@/features/sessions/server/sessionHandlers';

export const POST = verifySessionPayment;
export const GET = getSessionPaymentStatus;
