/** Normalize populated / plain Mongo user refs for JSON + UI comparisons */
export function toIdString(ref: unknown): string | undefined {
  if (ref == null) return undefined;
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && '_id' in (ref as object)) {
    const id = (ref as { _id?: unknown })._id;
    if (id == null) return undefined;
    if (typeof id === 'object' && id !== null && 'toString' in id) {
      return String((id as { toString: () => string }).toString());
    }
    return String(id);
  }
  if (typeof ref === 'object' && ref !== null && 'toString' in ref) {
    return String((ref as { toString: () => string }).toString());
  }
  return String(ref);
}

export type PublicSender = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
};

export type PublicMessage = {
  _id: string;
  conversationId: string;
  senderId: PublicSender;
  content: { type: string; body: string };
  readStatus: {
    isRead: boolean;
    readBy: Array<{ userId: string; readAt: string }>;
  };
  deliveredAt?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
};

function serializeSender(populated: unknown): PublicSender {
  const id = toIdString(populated);
  if (!populated || typeof populated !== 'object' || populated === null) {
    return { _id: id ?? '', name: 'Unknown', email: '' };
  }
  const o = populated as Record<string, unknown>;
  return {
    _id: id ?? '',
    name: typeof o.name === 'string' ? o.name : 'Unknown',
    email: typeof o.email === 'string' ? o.email : '',
    ...(typeof o.profilePicture === 'string' ? { profilePicture: o.profilePicture } : {}),
  };
}

/** Lean Mongoose message doc → stable JSON for HTTP + sockets */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeMessage(doc: any): PublicMessage {
  if (!doc) {
    throw new Error('serializeMessage: missing doc');
  }

  const readBy = Array.isArray(doc.readStatus?.readBy)
    ? doc.readStatus.readBy.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => ({
          userId: toIdString(r.userId) ?? '',
          readAt: (() => {
            try {
              if (r.readAt instanceof Date) return r.readAt.toISOString();
              if (typeof r.readAt === 'string') return new Date(r.readAt).toISOString();
              const d = new Date(r.readAt);
              return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
            } catch {
              return new Date().toISOString();
            }
          })(),
        })
      )
    : [];

  const delivered: string | null =
    doc.deliveredAt == null
      ? null
      : doc.deliveredAt instanceof Date
        ? doc.deliveredAt.toISOString()
        : new Date(doc.deliveredAt).toISOString();

  const convId =
    doc.conversationId != null && typeof doc.conversationId === 'object' && 'toString' in doc.conversationId
      ? String(doc.conversationId.toString())
      : String(doc.conversationId);

  return {
    _id: String(doc._id),
    conversationId: convId,
    senderId: serializeSender(doc.senderId),
    content: {
      type: doc.content?.type ?? 'text',
      body: doc.content?.body ?? '',
    },
    readStatus: {
      isRead: Boolean(doc.readStatus?.isRead),
      readBy,
    },
    deliveredAt: delivered,
    isEdited: Boolean(doc.isEdited),
    isDeleted: Boolean(doc.isDeleted),
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    ...(doc.updatedAt
      ? {
          updatedAt:
            doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date(doc.updatedAt).toISOString(),
        }
      : {}),
  };
}
