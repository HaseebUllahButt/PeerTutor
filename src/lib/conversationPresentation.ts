import mongoose from 'mongoose';
import Message from '@/models/Message';

/** Attach per-viewer unread counts + stable last-message sender id for list UI */
export async function enrichConversationsForViewer<T extends { _id: unknown; lastMessage?: unknown }>(
  conversations: T[],
  viewerUserId: string
): Promise<Array<T & { unreadCount: number; lastMessageSenderId?: string }>> {
  if (conversations.length === 0) return [];

  const myOid = new mongoose.Types.ObjectId(viewerUserId);

  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      Message.countDocuments({
        conversationId: c._id,
        senderId: { $ne: myOid },
        isDeleted: false,
        readStatus: {
          readBy: { $not: { $elemMatch: { userId: myOid } } },
        },
      })
    )
  );

  return conversations.map((c, i) => {
    const lm = c.lastMessage as { senderId?: unknown } | undefined;
    const lastMessageSenderId = lm?.senderId != null ? String(lm.senderId) : undefined;
    return {
      ...c,
      unreadCount: unreadCounts[i],
      lastMessageSenderId,
    };
  });
}
