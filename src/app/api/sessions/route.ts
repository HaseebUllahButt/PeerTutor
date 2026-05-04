import { createSession, listSessions } from '@/features/sessions/server/sessionHandlers';

export const GET = listSessions;
export const POST = createSession;
