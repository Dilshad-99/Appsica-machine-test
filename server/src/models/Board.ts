import mongoose, { Schema, Types } from "mongoose";

export interface IColumn {
  _id?: Types.ObjectId;
  name: string;
  order?: number;
}

export interface IBoard {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  columns: Types.DocumentArray<IColumn>;
  inviteCode?: string;
  isArchived: boolean;
}

const columnSchema = new Schema<IColumn>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const boardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    columns: { type: [columnSchema], default: [] },
    inviteCode: { type: String, unique: true, sparse: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Board = mongoose.model<IBoard>("Board", boardSchema);