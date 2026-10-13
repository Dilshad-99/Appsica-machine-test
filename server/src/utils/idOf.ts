import { Types } from "mongoose";

/**
 * Resolves a stable id string from a mongoose ObjectId, a hex string, or a
 * populated document (which only has an `_id` at runtime, e.g. `board.owner`
 * after `.populate()`).
 *
 * NOTE: never introspect arbitrary properties of bson `ObjectId` instances —
 * their `get` accessor returns the object itself, which would recurse forever.
 */
export const idOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (value && typeof value === "object") {
    const doc = value as { _id?: unknown };
    const id = doc._id;
    if (typeof id === "string" || id instanceof Types.ObjectId) {
      return idOf(id);
    }
  }
  return String(value);
};