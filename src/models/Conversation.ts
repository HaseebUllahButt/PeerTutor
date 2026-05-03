import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IParticipant {
  userId: ObjectId;
  role: 'student' | 'tutor';
  joinedAt: Date;
  lastReadMessageId?: ObjectId;
}

export interface ILastMessage {
  messageId: ObjectId;
  senderId: ObjectId;
  content: string;
  sentAt: Date;
  type: 'text' | 'image' | 'file';
}

export interface IConversation extends Document {
  participants: IParticipant[];
  sessionId?: ObjectId;
  type: 'direct' | 'group' | 'support';
  status: 'active' | 'archived' | 'blocked';
  lastMessage?: ILastMessage;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['student', 'tutor'], 
    required: true 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastReadMessageId: { 
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }
});

const LastMessageSchema = new Schema<ILastMessage>({
  messageId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Message',
    required: true 
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  sentAt: { 
    type: Date, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file'],
    default: 'text'
  }
}, { _id: false });

const ConversationSchema = new Schema<IConversation>({
  participants: { 
    type: [ParticipantSchema], 
    required: true,
    validate: {
      validator: function(v: IParticipant[]) {
        return v.length >= 2;
      },
      message: 'A conversation must have at least 2 participants'
    }
  },
  sessionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Session',
    index: true
  },
  type: { 
    type: String, 
    enum: ['direct', 'group', 'support'], 
    default: 'direct',
    index: true
  },
  status: { 
    type: String, 
    enum: ['active', 'archived', 'blocked'], 
    default: 'active',
    index: true
  },
  lastMessage: LastMessageSchema
}, { 
  timestamps: true 
});

ConversationSchema.index({ "participants.userId": 1, updatedAt: -1 });
ConversationSchema.index({ sessionId: 1, status: 1 });
ConversationSchema.index({ updatedAt: -1 });

export default mongoose.models.Conversation || 
  mongoose.model<IConversation>('Conversation', ConversationSchema);
