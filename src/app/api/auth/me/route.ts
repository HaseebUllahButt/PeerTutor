import { getCurrentUser, updateCurrentUser } from '@/features/auth/server/authHandlers';

export const GET = getCurrentUser;
export const PATCH = updateCurrentUser;
