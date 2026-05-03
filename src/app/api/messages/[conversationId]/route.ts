import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { serializeMessage } from '@/lib/messagingSerialize';

export async function GET(
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
      isDeleted: false
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
      nextCursor
    }, { status: 200 });
  } catch (error) {
    console.error('Message History Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
