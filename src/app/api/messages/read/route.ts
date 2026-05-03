import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { z } from 'zod';
import mongoose from 'mongoose';
import { broadcastPeerReadReceipt } from '@/lib/socket';

const markReadSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  /** When omitted, all unread peer messages in this conversation are marked read */
  messageIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const body = await request.json();
    const parsed = markReadSchema.parse(body);

    const conversation = await Conversation.findById(parsed.conversationId).lean();
    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p: { userId: { toString: () => string } }) => p.userId.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    const myOid = new mongoose.Types.ObjectId(user.userId);

    const baseFilter: Record<string, unknown> = {
      conversationId: parsed.conversationId,
      senderId: { $ne: myOid },
      isDeleted: false,
      readStatus: {
        readBy: { $not: { $elemMatch: { userId: myOid } } },
      },
    };

    if (parsed.messageIds && parsed.messageIds.length > 0) {
      baseFilter._id = {
        $in: parsed.messageIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    const result = await Message.updateMany(baseFilter, {
      $set: { 'readStatus.isRead': true },
      $push: {
        'readStatus.readBy': {
          userId: myOid,
          readAt: new Date(),
        },
      },
    });

    const latest = await Message.findOne({
      conversationId: parsed.conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .select('_id')
      .lean();

    const lastReadId = latest?._id ?? null;

    await Conversation.updateOne(
      {
        _id: parsed.conversationId,
        'participants.userId': user.userId,
      },
      {
        $set: { 'participants.$.lastReadMessageId': lastReadId },
      }
    );

    const participantUserIds = conversation.participants.map((p: { userId: { toString: () => string } }) =>
      p.userId.toString()
    );

    broadcastPeerReadReceipt(participantUserIds, user.userId, {
      conversationId: parsed.conversationId,
      lastReadMessageId: lastReadId ? String(lastReadId) : null,
    });

    return NextResponse.json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount,
      lastReadMessageId: lastReadId ? String(lastReadId) : null,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Mark Read Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
