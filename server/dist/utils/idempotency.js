"use strict";
/**
 * In-memory idempotency store for preventing duplicate updates.
 * Stores operation IDs and their cached results with a 24-hour TTL.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyStore = void 0;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
class IdempotencyStore {
    cache = new Map();
    constructor() {
        // Periodic sweep every 30 minutes to clean up expired operation IDs
        setInterval(() => this.cleanup(), 30 * 60 * 1000).unref();
    }
    get(opId) {
        const cached = this.cache.get(opId);
        if (!cached)
            return undefined;
        if (Date.now() - cached.timestamp > TTL_MS) {
            this.cache.delete(opId);
            return undefined;
        }
        return cached;
    }
    set(opId, statusCode, data) {
        this.cache.set(opId, {
            statusCode,
            data,
            timestamp: Date.now(),
        });
    }
    cleanup() {
        const now = Date.now();
        for (const [opId, cached] of this.cache.entries()) {
            if (now - cached.timestamp > TTL_MS) {
                this.cache.delete(opId);
            }
        }
    }
}
exports.idempotencyStore = new IdempotencyStore();
//# sourceMappingURL=idempotency.js.map