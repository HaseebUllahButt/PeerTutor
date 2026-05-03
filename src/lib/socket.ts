import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import mongoose from 'mongoose';
import { verifyToken } from './auth';
import connectToDatabase from './db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';

export type SocketServer = SocketIOServer;

interface SocketUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

let io: SocketIOServer | null = null;

/** httpOnly cookies are not visible to JS — handshake must send auth.token or Cookie header. */
function extractTokenFromSocketHandshake(socket: Socket): string | undefined {
  const authTok = socket.handshake.auth?.token;
  if (typeof authTok === 'string' && authTok.length > 0) return authTok;

  const hdr = socket.handshake.headers.authorization;
  if (typeof hdr === 'string' && hdr.startsWith('Bearer ')) {
    const t = hdr.slice(7).trim();
    if (t.length > 0) return t;
  }

  const raw = socket.handshake.headers.cookie;
  if (!raw || typeof raw !== 'string') return undefined;

  for (const part of raw.split(';')) {
    const s = part.trim();
    if (!s.startsWith('token=')) continue;
    const v = s.slice('token='.length);
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return undefined;
}

export function initSocketServer(server: NetServer): SocketIOServer {
  if (io) {
    return io;
  }

  const corsOrigin =
    process.env.SOCKET_IO_CORS_ORIGIN === '*'
      ? true
      : process.env.SOCKET_IO_CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || true;

  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const q = socket.handshake.query.token;
    const queryTok = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : undefined;
    const token = extractTokenFromSocketHandshake(socket) || queryTok;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const user = verifyToken(token);
      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.data.user = user as SocketUser;
      next();
    } catch {
      next(new Error('Authentication error: Token verification failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;

    socket.join(`user:${user.userId}`);
    console.log(`Socket connected: ${socket.id} (User: ${user.name}) → room user:${user.userId}`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${user.name} joined conversation: ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${user.name} left conversation: ${conversationId}`);
    });

    socket.on('typing_start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing', {
        userId: user.userId,
        name: user.name,
        conversationId: data.conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing', {
        userId: user.userId,
        name: user.name,
        conversationId: data.conversationId,
        isTyping: false,
      });
    });

    socket.on(
      'message_delivered',
      async (payload: { conversationId?: string; messageId?: string }) => {
        const conversationId = payload?.conversationId;
        const messageId = payload?.messageId;
        if (!conversationId || !messageId) return;

        try {
          await connectToDatabase();

          let mid: mongoose.Types.ObjectId;
          let cid: mongoose.Types.ObjectId;
          try {
            mid = new mongoose.Types.ObjectId(messageId);
            cid = new mongoose.Types.ObjectId(conversationId);
          } catch {
            return;
          }

          const msg = await Message.findOne({
            _id: mid,
            conversationId: cid,
            isDeleted: false,
          }).lean();

          if (!msg) return;
          const senderId = msg.senderId?.toString?.() ?? String(msg.senderId);
          if (senderId === user.userId) return;

          const conversation = await Conversation.findById(cid).select('participants.userId').lean();
          if (!conversation) return;
          const allowed = conversation.participants.some(
            (p: { userId: { toString: () => string } }) => p.userId.toString() === user.userId
          );
          if (!allowed) return;

          const upd = await Message.updateOne(
            { _id: mid, deliveredAt: { $exists: false } },
            { $set: { deliveredAt: new Date() } }
          );

          if (!io) return;

          if (upd.modifiedCount > 0) {
            io.to(`user:${senderId}`).emit('message_status', {
              conversationId,
              messageId,
              status: 'delivered',
            });
          }
        } catch (e) {
          console.error('message_delivered handler error:', e);
        }
      }
    );

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

/** @deprecated Prefer broadcastNewMessageToParticipants — recipient-only conversation rooms miss pushes */
export function emitToConversation(
  conversationId: string,
  event: string,
  data: unknown,
  excludeSocketId?: string
): void {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  if (excludeSocketId) {
    io.to(`conversation:${conversationId}`).except(excludeSocketId).emit(event, data);
  } else {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
}

/** Deliver to every participant's personal room (all tabs). Caller must dedupe by message id. */
export function broadcastNewMessageToParticipants(participantUserIds: string[], payload: unknown): void {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  const unique = [...new Set(participantUserIds)];
  for (const uid of unique) {
    io.to(`user:${uid}`).emit('new_message', payload);
  }
}

export function broadcastPeerReadReceipt(
  participantUserIds: string[],
  readerUserId: string,
  body: { conversationId: string; lastReadMessageId: string | null }
): void {
  if (!io) return;
  for (const uid of participantUserIds) {
    if (uid === readerUserId) continue;
    io.to(`user:${uid}`).emit('peer_read_receipt', {
      ...body,
      readerUserId,
    });
  }
}
