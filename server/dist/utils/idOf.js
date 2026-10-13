"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idOf = void 0;
const mongoose_1 = require("mongoose");
/**
 * Resolves a stable id string from a mongoose ObjectId, a hex string, or a
 * populated document (which only has an `_id` at runtime, e.g. `board.owner`
 * after `.populate()`).
 *
 * NOTE: never introspect arbitrary properties of bson `ObjectId` instances —
 * their `get` accessor returns the object itself, which would recurse forever.
 */
const idOf = (value) => {
    if (typeof value === "string")
        return value;
    if (value instanceof mongoose_1.Types.ObjectId)
        return value.toString();
    if (value && typeof value === "object") {
        const doc = value;
        const id = doc._id;
        if (typeof id === "string" || id instanceof mongoose_1.Types.ObjectId) {
            return (0, exports.idOf)(id);
        }
    }
    return String(value);
};
exports.idOf = idOf;
//# sourceMappingURL=idOf.js.map