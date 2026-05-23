import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  imageUrl: string;
  voiceUrl: string;
  voiceDuration: number;
  read: boolean;
  readAt?: Date;
  isDeleted: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "", trim: true, maxlength: 5000 },
    imageUrl: { type: String, default: "" },
    voiceUrl: { type: String, default: "" },
    voiceDuration: { type: Number, default: 0, min: 0 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, read: 1 });
messageSchema.index({ receiverId: 1, read: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, read: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
