import { listMessages } from '@/features/messaging/server/messagingHandlers';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

export const GET = listMessages;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { conversationId: messageId } = await params;

    await connectToDatabase();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (message.senderId.toString() !== user.userId) {
      return NextResponse.json({ message: 'You can only delete your own messages' }, { status: 403 });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = message.senderId;
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.lastMessage?.messageId?.toString() === messageId) {
      const prevMessage = await Message.findOne({
        conversationId: message.conversationId,
        isDeleted: false,
        _id: { $ne: message._id },
      }).sort({ createdAt: -1 });

      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: prevMessage ? {
          messageId: prevMessage._id,
          senderId: prevMessage.senderId,
          content: prevMessage.content.body.substring(0, 100),
          sentAt: prevMessage.createdAt,
          type: prevMessage.content.type,
        } : null,
      });
    }

    return NextResponse.json({ message: 'Message deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete Message Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
