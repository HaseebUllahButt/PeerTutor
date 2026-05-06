import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { toIdString, serializeMessage } from '@/lib/messagingSerialize';

describe('toIdString', () => {
  it('returns undefined for null/undefined', () => {
    expect(toIdString(null)).toBeUndefined();
    expect(toIdString(undefined)).toBeUndefined();
  });

  it('passes through plain strings', () => {
    expect(toIdString('64f0aa00aa00aa00aa00aa00')).toBe('64f0aa00aa00aa00aa00aa00');
  });

  it('extracts _id from a populated object', () => {
    const oid = new mongoose.Types.ObjectId();
    expect(toIdString({ _id: oid })).toBe(oid.toString());
  });

  it('handles ObjectId values directly', () => {
    const oid = new mongoose.Types.ObjectId();
    expect(toIdString(oid)).toBe(oid.toString());
  });
});

describe('serializeMessage', () => {
  it('produces a stable shape from a lean Mongo doc', () => {
    const senderId = new mongoose.Types.ObjectId();
    const conversationId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();

    const result = serializeMessage({
      _id: messageId,
      conversationId,
      senderId: { _id: senderId, name: 'Ali', email: 'a@b.com' },
      content: { type: 'text', body: 'hi' },
      readStatus: { isRead: false, readBy: [] },
      isEdited: false,
      isDeleted: false,
      createdAt: new Date('2026-05-01T10:00:00Z'),
    });

    expect(result._id).toBe(messageId.toString());
    expect(result.senderId.name).toBe('Ali');
    expect(result.content.body).toBe('hi');
    expect(result.createdAt).toBe('2026-05-01T10:00:00.000Z');
    expect(result.deliveredAt).toBeNull();
  });

  it('falls back to default sender fields when populated object is incomplete', () => {
    const senderId = new mongoose.Types.ObjectId();
    const result = serializeMessage({
      _id: new mongoose.Types.ObjectId(),
      conversationId: new mongoose.Types.ObjectId(),
      senderId: { _id: senderId },
      content: { type: 'text', body: 'x' },
      readStatus: { isRead: false, readBy: [] },
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
    });
    expect(result.senderId.name).toBe('Unknown');
    expect(result.senderId.email).toBe('');
  });

  it('serializes readBy timestamps as ISO strings', () => {
    const userId = new mongoose.Types.ObjectId();
    const result = serializeMessage({
      _id: new mongoose.Types.ObjectId(),
      conversationId: new mongoose.Types.ObjectId(),
      senderId: { _id: new mongoose.Types.ObjectId(), name: 'X', email: '' },
      content: { type: 'text', body: 'x' },
      readStatus: {
        isRead: true,
        readBy: [{ userId, readAt: new Date('2026-05-01T12:00:00Z') }],
      },
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
    });
    expect(result.readStatus.readBy[0].userId).toBe(userId.toString());
    expect(result.readStatus.readBy[0].readAt).toBe('2026-05-01T12:00:00.000Z');
  });

  it('throws on missing doc', () => {
    expect(() => serializeMessage(null)).toThrow();
  });
});
