import mongoose, { Schema, Types } from "mongoose";

export interface IComment {
  task: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
}

const commentSchema = new Schema<IComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>("Comment", commentSchema);