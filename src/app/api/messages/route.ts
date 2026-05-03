import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { z } from 'zod';
import { broadcastNewMessageToParticipants } from '@/lib/socket';
import { serializeMessage } from '@/lib/messagingSerialize';

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  type: z.enum(['text', 'image', 'file']).default('text'),
  clientTimestamp: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const body = await request.json();
    const parsed = sendMessageSchema.parse(body);

    const conversation = await Conversation.findById(parsed.conversationId);
    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p: { userId: { toString: () => string } }) => p.userId.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json({ message: 'Not authorized to send messages in this conversation' }, { status: 403 });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: user.userId,
      sessionId: conversation.sessionId,
      content: {
        type: parsed.type,
        body: parsed.content,
      },
      clientTimestamp: parsed.clientTimestamp ? new Date(parsed.clientTimestamp) : undefined,
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: {
        messageId: message._id,
        senderId: user.userId,
        content: parsed.content.substring(0, 100),
        sentAt: new Date(),
        type: parsed.type,
      },
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email profilePicture')
      .lean();

    const publicMsg = serializeMessage(populatedMessage);

    const participantUserIds = conversation.participants.map((p: { userId: { toString: () => string } }) =>
      p.userId.toString()
    );

    broadcastNewMessageToParticipants(participantUserIds, {
      conversationId: parsed.conversationId,
      message: publicMsg,
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      data: publicMsg,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Message Send Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
