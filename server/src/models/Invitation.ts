import mongoose, { Schema, Types } from "mongoose";

export interface IInvitation {
  _id?: Types.ObjectId;
  board: Types.ObjectId;
  inviter: Types.ObjectId;
  invitee: Types.ObjectId;
  inviteeEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt?: Date;
  updatedAt?: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    inviter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

invitationSchema.index({ board: 1, invitee: 1, status: 1 });

export const Invitation = mongoose.model<IInvitation>("Invitation", invitationSchema);
