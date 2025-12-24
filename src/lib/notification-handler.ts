import { basename } from "path";
import type { HeraldConfig, NotificationHookInput } from "../types.js";
import type { ITTSProvider } from "../tts/provider.js";

// Minimum delay between ping sounds
const PING_MIN_DELAY_MS = 1000;

// Valid notification types that trigger notifications
const VALID_NOTIFICATION_TYPES = ["permission_prompt", "elicitation_dialog"];

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
export function getNotificationMessage(
  notificationType: string,
  style: "tts" | "alerts"
): { content: string; isPing: boolean } {
  // Use the same message for both modes - consistent content-based hashing
  let content: string;
  switch (notificationType) {
    case "permission_prompt":
      content = "Claude needs permission";
      break;
    case "elicitation_dialog":
      content = "Claude needs more information";
      break;
    default:
      content = "Claude is waiting for input";
  }

  return { content, isPing: style === "alerts" };
}

/**
 * Handle a notification event.
 * This is the main business logic extracted from the hook.
 *
 * Flow: acquire lock → check duplicate → play → release lock
 * Uses unified lock for entire critical section.
 */
export async function handleNotification(
  input: NotificationHookInput,
  config: HeraldConfig,
  deps: NotificationDeps
): Promise<NotificationResult> {
  // Check if enabled
  if (!config.enabled) {
    return { handled: false, reason: "disabled" };
  }

  // Validate notification type
  const notificationType = input.notification_type;
  if (!VALID_NOTIFICATION_TYPES.includes(notificationType)) {
    return { handled: false, reason: "invalid_type" };
  }

  const projectName = input.cwd ? basename(input.cwd) : undefined;

  // Generate message content (consistent content-based hashing)
  const { content: messageContent, isPing } = getNotificationMessage(
    notificationType,
    config.style
  );

  // Hash content for deduplication
  const hash = deps.hashContent(messageContent);

  // Acquire unified lock (waits for any audio playback to finish)
  const gotLock = await deps.waitForLock();
  if (!gotLock) {
    return { handled: false, reason: "no_lock" };
  }

  try {
    // Check for duplicate (now protected by lock)
    const isNew = await deps.checkAndRecord(hash);
    if (!isNew) {
      return { handled: false, reason: "duplicate" };
    }

    // Play the notification
    if (isPing) {
      if (config.preferences.activate_editor) {
        deps.playPing(projectName);
      } else {
        deps.playSound("ping");
      }
      // Minimum delay between pings
      await new Promise((resolve) => setTimeout(resolve, PING_MIN_DELAY_MS));
    } else {
      const ttsProvider = deps.getProvider(config.tts);
      await deps.withMediaControl(() => ttsProvider.speak(messageContent));
      if (config.preferences.activate_editor) {
        deps.activateEditor(projectName);
      }
    }
  } finally {
    await deps.releaseLock();
  }

  return { handled: true, reason: "played" };
}
