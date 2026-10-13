import mongoose, { Schema, Types } from "mongoose";

export interface IActivity {
  board: Types.ObjectId;
  task?: Types.ObjectId;
  user: Types.ObjectId;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const activitySchema = new Schema<IActivity>(
  {
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ board: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);