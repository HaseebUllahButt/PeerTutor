import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { z } from 'zod';
import { enrichConversationsForViewer } from '@/lib/conversationPresentation';

const createConversationSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  sessionId: z.string().optional(),
  initialMessage: z.string().min(1, 'Initial message is required'),
});

export async function GET(request: Request) {
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

export async function POST(request: Request) {
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
