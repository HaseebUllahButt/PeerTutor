import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { broadcastNewMessageToParticipants, broadcastPeerReadReceipt } from '@/lib/socket';
import { serializeMessage } from '@/lib/messagingSerialize';
import { enrichConversationsForViewer } from '@/lib/conversationPresentation';

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  type: z.enum(['text', 'image', 'file']).default('text'),
  clientTimestamp: z.string().optional(),
});

const createConversationSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  sessionId: z.string().optional(),
  initialMessage: z.string().min(1, 'Initial message is required'),
});

const markReadSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  messageIds: z.array(z.string()).optional(),
});

export async function sendMessage(request: Request) {
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

export async function listMessages(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    await connectToDatabase();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p: { userId: { toString: () => string } }) => p.userId.toString() === user.userId
    );

    if (!isParticipant) {
      return NextResponse.json({ message: 'Not authorized to view this conversation' }, { status: 403 });
    }

    const query: {
      conversationId: string;
      isDeleted: boolean;
      _id?: { $lt: string };
    } = {
      conversationId,
      isDeleted: false,
    };

    if (before) {
      query._id = { $lt: before };
    }

    const rawMessages = await Message.find(query)
      .populate('senderId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const messages = rawMessages.reverse().map((m) => serializeMessage(m));

    const hasMore = rawMessages.length === limit;
    const nextCursor = hasMore && rawMessages.length > 0 ? rawMessages[rawMessages.length - 1]._id : null;

    return NextResponse.json({
      messages,
      hasMore,
      nextCursor,
    }, { status: 200 });
  } catch (error) {
    console.error('Message History Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function markMessagesRead(request: Request) {
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

export async function listConversations(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const conversations = await Conversation.find({
      'participants.userId': user.userId,
      status: { $ne: 'blocked' },
    })
      .populate('participants.userId', 'name email profilePicture role')
      .populate('sessionId', 'subject scheduledAt status')
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await enrichConversationsForViewer(conversations, user.userId);

    return NextResponse.json({ conversations: enriched }, { status: 200 });
  } catch (error) {
    console.error('Conversation Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function createConversation(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const body = await request.json();
    const parsed = createConversationSchema.parse(body);

    const otherUser = await User.findById(parsed.participantId);
    if (!otherUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (otherUser._id.toString() === user.userId) {
      return NextResponse.json({ message: 'Cannot create conversation with yourself' }, { status: 400 });
    }

    const existingConversation = await Conversation.findOne({
      type: 'direct',
      $and: [{ 'participants.userId': user.userId }, { 'participants.userId': parsed.participantId }],
    }).select('_id');

    if (existingConversation) {
      const populated = await Conversation.findById(existingConversation._id)
        .populate('participants.userId', 'name email profilePicture role')
        .populate('sessionId', 'subject scheduledAt status')
        .lean();

      if (!populated) {
        return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
      }

      const [enriched] = await enrichConversationsForViewer([populated], user.userId);

      return NextResponse.json(
        {
          message: 'Conversation already exists',
          conversation: enriched,
        },
        { status: 200 }
      );
    }

    const conversation = await Conversation.create({
      participants: [
        { userId: user.userId, role: user.role as 'student' | 'tutor', joinedAt: new Date() },
        {
          userId: otherUser._id,
          role: otherUser.role as 'student' | 'tutor',
          joinedAt: new Date(),
        },
      ],
      sessionId: parsed.sessionId || undefined,
      type: 'direct',
      status: 'active',
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.userId', 'name email profilePicture role')
      .populate('sessionId', 'subject scheduledAt status')
      .lean();

    if (!populatedConversation) {
      return NextResponse.json({ message: 'Conversation not found after create' }, { status: 500 });
    }

    const [enriched] = await enrichConversationsForViewer([populatedConversation], user.userId);

    return NextResponse.json(
      {
        message: 'Conversation created successfully',
        conversation: enriched,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Conversation Create Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
