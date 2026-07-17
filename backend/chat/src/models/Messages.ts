import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
    chatId: Types.ObjectId;
    sender: string;
    text? : string;
    image?: {
        url: string;
        publicId: string;
    };
    messageType: 'text' | 'image';
    seen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const schema = new Schema<IMessage>({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: String, required: true },
    text: { type: String },
    image: {
        url: { type: String },
        publicId: { type: String }
    },
    messageType: { type: String, enum: ['text', 'image'], default: 'text' },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Message = mongoose.model<IMessage>('Messages', schema);
