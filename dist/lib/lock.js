import { readFile, mkdir, open, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
const LOCK_DIR = join(homedir(), ".config", "herald");
const LOCK_FILE = join(LOCK_DIR, "herald.lock");
// Maximum time a lock can be held before considered stale
export const LOCK_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes
/**
 * Parse lock file content into LockData.
 * Format: "{timestamp}:{pid}"
 */
function parseLockContent(content) {
    const parts = content.trim().split(":");
    if (parts.length !== 2) {
        return null;
    }
    const timestamp = parseInt(parts[0], 10);
    const pid = parseInt(parts[1], 10);
    if (isNaN(timestamp) || isNaN(pid)) {
        return null;
    }
    return { timestamp, pid };
}
/**
 * Format LockData for writing to lock file.
 */
function formatLockContent(data) {
    return `${data.timestamp}:${data.pid}`;
}
/**
 * Check if a process with the given PID is still running.
 */
function isProcessRunning(pid) {
    try {
        // Sending signal 0 checks if process exists without killing it
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if the lock is stale (expired or dead process).
 */
function isLockStale(lockData) {
    // Check timestamp expiry
    if (Date.now() - lockData.timestamp >= LOCK_EXPIRY_MS) {
        return true;
    }
    // Check if process is still running
    if (!isProcessRunning(lockData.pid)) {
        return true;
    }
    return false;
}
/**
 * Attempt to acquire the lock.
 * Only one process can hold this lock at a time.
 * Uses atomic file creation and PID-based stale detection.
 * Fail-closed: returns false on any error (safer behavior).
 * @returns true if lock was acquired, false otherwise
 */
export async function acquireLock() {
    try {
        await mkdir(LOCK_DIR, { recursive: true });
        // Check if lock exists and is stale
        if (existsSync(LOCK_FILE)) {
            try {
                const content = await readFile(LOCK_FILE, "utf-8");
                const lockData = parseLockContent(content);
                if (lockData && !isLockStale(lockData)) {
                    return false; // Lock is held by active process
                }
                // Lock is stale, try to remove it (ignore errors, we'll try to create anyway)
                try {
                    await unlink(LOCK_FILE);
                }
                catch {
                    // Ignore unlink errors - we'll try to create anyway
                }
            }
            catch {
                // Error reading lock file - fail closed
                return false;
            }
        }
        // Atomic lock acquisition using exclusive create (wx flag)
        // This fails if file already exists, preventing race conditions
        const handle = await open(LOCK_FILE, "wx");
        const lockData = {
            timestamp: Date.now(),
            pid: process.pid,
        };
        await handle.write(formatLockContent(lockData));
        await handle.close();
        return true;
    }
    catch (err) {
        // EEXIST means another process created the lock between our check and create
        // Any other error also fails closed for safety
        if (err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === "EEXIST") {
            return false;
        }
        return false; // Fail closed on any error
    }
}
/**
 * Release the lock.
 * Safe to call even if lock doesn't exist.
 */
export async function releaseLock() {
    try {
        await unlink(LOCK_FILE);
    }
    catch {
        // Ignore errors
    }
}
// Default wait timeout (2 minutes)
export const WAIT_FOR_LOCK_TIMEOUT_MS = 2 * 60 * 1000;
// Poll interval when waiting for lock
const LOCK_POLL_INTERVAL_MS = 100;
/**
 * Wait for the lock to become available, then acquire it.
 * Polls periodically until lock is acquired or timeout is reached.
 * @param timeoutMs - Maximum time to wait (default 2 minutes)
 * @returns true if lock was acquired, false if timed out
 */
export async function waitForLock(timeoutMs = WAIT_FOR_LOCK_TIMEOUT_MS) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const acquired = await acquireLock();
        if (acquired) {
            return true;
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS));
    }
    // Timed out
    return false;
}
export { LOCK_FILE, LOCK_DIR };
