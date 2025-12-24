import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";
const HISTORY_DIR = join(homedir(), ".config", "herald");
const HISTORY_FILE = join(HISTORY_DIR, "recent.json");
// How long to remember played content for deduplication
export const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
// Maximum number of entries to keep in history
export const MAX_HISTORY_SIZE = 10;
/**
 * Hash content for deduplication.
 * Uses SHA256 and returns first 16 characters.
 */
export function hashContent(text) {
    return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
/**
 * Read recent plays, filtering out expired entries and limiting to max size.
 * NOTE: Caller must hold the unified lock before calling this.
 */
async function readHistory() {
    try {
        if (!existsSync(HISTORY_FILE)) {
            return [];
        }
        const content = await readFile(HISTORY_FILE, "utf-8");
        const plays = JSON.parse(content);
        const now = Date.now();
        // Filter expired entries and keep only the most recent MAX_HISTORY_SIZE
        return plays
            .filter((p) => now - p.timestamp < DEDUP_WINDOW_MS)
            .slice(-MAX_HISTORY_SIZE);
    }
    catch {
        return [];
    }
}
/**
 * Write history to disk, keeping only the most recent entries.
 * NOTE: Caller must hold the unified lock before calling this.
 */
async function writeHistory(plays) {
    await mkdir(HISTORY_DIR, { recursive: true });
    // Keep only the most recent MAX_HISTORY_SIZE entries
    const trimmed = plays.slice(-MAX_HISTORY_SIZE);
    await writeFile(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
}
/**
 * Check if content was recently played (duplicate).
 * Returns true if this is a duplicate that should be skipped.
 * NOTE: Caller must hold the unified lock before calling this.
 */
export async function isDuplicate(hash) {
    const history = await readHistory();
    return history.some((p) => p.hash === hash);
}
/**
 * Record that content was played.
 * Call this after successfully playing a message.
 * NOTE: Caller must hold the unified lock before calling this.
 */
export async function recordPlay(hash) {
    const history = await readHistory();
    // Don't add duplicate entries
    if (!history.some((p) => p.hash === hash)) {
        history.push({ hash, timestamp: Date.now() });
        await writeHistory(history);
    }
}
/**
 * Check if duplicate and record in one atomic operation.
 * Returns true if this is a NEW message (should be played).
 * Returns false if this is a DUPLICATE (should be skipped).
 * NOTE: Caller must hold the unified lock before calling this.
 */
export async function checkAndRecord(hash) {
    const history = await readHistory();
    // Check for duplicate
    if (history.some((p) => p.hash === hash)) {
        return false; // Duplicate
    }
    // Record this play
    history.push({ hash, timestamp: Date.now() });
    await writeHistory(history);
    return true; // New message
}
/**
 * Clear all history (for testing).
 * NOTE: Caller must hold the unified lock before calling this.
 */
export async function clearHistory() {
    await writeHistory([]);
}
export { HISTORY_FILE, HISTORY_DIR };
