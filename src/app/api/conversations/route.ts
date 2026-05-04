import {
  createConversation,
  listConversations,
} from '@/features/messaging/server/messagingHandlers';

export const GET = listConversations;
export const POST = createConversation;
