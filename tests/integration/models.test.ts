import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import Session from '@/models/Session';
import { seedUser } from '../helpers';

describe('Message model — SCRUM-8 (chat content limits)', () => {
  it('accepts a body up to schema maxlength (5000)', async () => {
    const { user } = await seedUser();
    const conv = await Conversation.create({
      participants: [
        { userId: user._id, role: 'student' },
        { userId: new mongoose.Types.ObjectId(), role: 'tutor' },
      ],
      type: 'direct',
    });
    const body = 'a'.repeat(5000);
    const msg = await Message.create({
      conversationId: conv._id,
      senderId: user._id,
      content: { type: 'text', body },
    });
    expect(msg.content.body.length).toBe(5000);
  });

  it('rejects messages over the 5000 char schema cap', async () => {
    const { user } = await seedUser();
    const conv = await Conversation.create({
      participants: [
        { userId: user._id, role: 'student' },
        { userId: new mongoose.Types.ObjectId(), role: 'tutor' },
      ],
      type: 'direct',
    });
    await expect(
      Message.create({
        conversationId: conv._id,
        senderId: user._id,
        content: { type: 'text', body: 'a'.repeat(5001) },
      })
    ).rejects.toThrow();
  });

  it('defaults isDeleted=false and readStatus.isRead=false on new messages', async () => {
    const { user } = await seedUser();
    const conv = await Conversation.create({
      participants: [
        { userId: user._id, role: 'student' },
        { userId: new mongoose.Types.ObjectId(), role: 'tutor' },
      ],
      type: 'direct',
    });
    const msg = await Message.create({
      conversationId: conv._id,
      senderId: user._id,
      content: { type: 'text', body: 'hello' },
    });
    expect(msg.isDeleted).toBe(false);
    expect(msg.readStatus.isRead).toBe(false);
    expect(msg.readStatus.readBy).toEqual([]);
  });
});

describe('Conversation model', () => {
  it('requires at least 2 participants', async () => {
    const { user } = await seedUser();
    await expect(
      Conversation.create({
        participants: [{ userId: user._id, role: 'student' }],
        type: 'direct',
      })
    ).rejects.toThrow();
  });
});

describe('Session model defaults', () => {
  it('defaults status=pending and paymentStatus=unpaid', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const s = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: new Date(),
    });
    expect(s.status).toBe('pending');
    expect(s.paymentStatus).toBe('unpaid');
    expect(s.duration).toBe(1.5); // schema default
    expect(s.tutorPaymentStatus).toBe('pending');
  });

  it('rejects rating outside 1-5 (SCRUM-9)', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    await expect(
      Session.create({
        student: student._id,
        tutor: tutor._id,
        subject: 'Math',
        scheduledAt: new Date(),
        rating: 6,
      })
    ).rejects.toThrow();
  });
});
