import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IReadBy {
  userId: ObjectId;
  readAt: Date;
}

export interface IMessageContent {
  type: 'text' | 'image' | 'file' | 'system';
  body: string;
  metadata?: {
    originalSize?: number;
    mimeType?: string;
    fileName?: string;
  };
}

export interface IMessage extends Document {
  conversationId: ObjectId;
  senderId: ObjectId;
  sessionId?: ObjectId;
  content: IMessageContent;
  readStatus: {
    isRead: boolean;
    readBy: IReadBy[];
  };
  isEdited: boolean;
  editHistory: Array<{
    previousContent: string;
    editedAt: Date;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
  clientTimestamp?: Date;
  /** Recipient acknowledged receipt via socket (first ack wins for 1:1) */
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReadBySchema = new Schema<IReadBy>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  readAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const MessageContentSchema = new Schema<IMessageContent>({
  type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'system'], 
    default: 'text',
    required: true
  },
  body: { 
    type: String, 
    required: true,
    maxlength: 5000
  },
  metadata: {
    originalSize: Number,
    mimeType: String,
    fileName: String
  }
}, { _id: false });

const EditHistorySchema = new Schema({
  previousContent: { 
    type: String, 
    required: true 
  },
  editedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  conversationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Session',
    index: true
  },
  content: { 
    type: MessageContentSchema, 
    required: true 
  },
  readStatus: {
    isRead: { 
      type: Boolean, 
      default: false 
    },
    readBy: { 
      type: [ReadBySchema], 
      default: [] 
    }
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  editHistory: { 
    type: [EditHistorySchema], 
    default: [] 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: { 
    type: Date 
  },
  deletedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  clientTimestamp: { 
    type: Date 
  },
  deliveredAt: {
    type: Date,
    index: true,
  }
}, { 
  timestamps: true 
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, _id: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message || 
  mongoose.model<IMessage>('Message', MessageSchema);
