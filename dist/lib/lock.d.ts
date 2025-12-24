declare const LOCK_DIR: string;
declare const LOCK_FILE: string;
export declare const LOCK_EXPIRY_MS: number;
/**
 * Attempt to acquire the lock.
 * Only one process can hold this lock at a time.
 * Uses atomic file creation and PID-based stale detection.
 * Fail-closed: returns false on any error (safer behavior).
 * @returns true if lock was acquired, false otherwise
 */
export declare function acquireLock(): Promise<boolean>;
/**
 * Release the lock.
 * Safe to call even if lock doesn't exist.
 */
export declare function releaseLock(): Promise<void>;
export declare const WAIT_FOR_LOCK_TIMEOUT_MS: number;
/**
 * Wait for the lock to become available, then acquire it.
 * Polls periodically until lock is acquired or timeout is reached.
 * @param timeoutMs - Maximum time to wait (default 2 minutes)
 * @returns true if lock was acquired, false if timed out
 */
export declare function waitForLock(timeoutMs?: number): Promise<boolean>;
export { LOCK_FILE, LOCK_DIR };
