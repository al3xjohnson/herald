import type { HeraldConfig, NotificationHookInput } from "../types.js";
import type { ITTSProvider } from "../tts/provider.js";
/**
 * Result of handling a notification.
 */
export interface NotificationResult {
    handled: boolean;
    reason?: "disabled" | "invalid_type" | "duplicate" | "no_lock" | "played";
}
/**
 * Dependencies for the notification handler.
 * Injecting these allows for easy testing.
 */
export interface NotificationDeps {
    checkAndRecord: (hash: string) => Promise<boolean>;
    hashContent: (content: string) => string;
    waitForLock: () => Promise<boolean>;
    releaseLock: () => Promise<void>;
    playSound: (type: "alert" | "ping") => void;
    playPing: (projectName?: string) => void;
    getProvider: (config: HeraldConfig["tts"]) => ITTSProvider;
    withMediaControl: <T>(fn: () => Promise<T>) => Promise<T>;
    activateEditor: (projectName?: string) => void;
}
/**
 * Generate the message content based on notification type and config style.
 * Uses consistent content-based messages for both modes (simpler deduplication).
 */
export declare function getNotificationMessage(notificationType: string, style: "tts" | "alerts"): {
    content: string;
    isPing: boolean;
};
/**
 * Handle a notification event.
 * This is the main business logic extracted from the hook.
 *
 * Flow: acquire lock → check duplicate → play → release lock
 * Uses unified lock for entire critical section.
 */
export declare function handleNotification(input: NotificationHookInput, config: HeraldConfig, deps: NotificationDeps): Promise<NotificationResult>;
