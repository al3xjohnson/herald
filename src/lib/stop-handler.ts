import { basename } from "path";
import type { HeraldConfig, StopHookInput } from "../types.js";
import type { ITTSProvider } from "../tts/provider.js";

// Minimum delay between alert sounds
const ALERT_MIN_DELAY_MS = 1000;

/**
 * Result of handling a stop event.
 */
export interface StopResult {
  handled: boolean;
  reason?: "disabled" | "duplicate" | "no_lock" | "played";
}

/**
 * Dependencies for the stop handler.
 * Injecting these allows for easy testing.
 */
export interface StopDeps {
  extractLastAssistantMessage: (path: string) => Promise<string>;
  cleanForSpeech: (text: string) => string;
  countWords: (text: string) => number;
  truncateToWords: (text: string, max: number) => string;
  summarizeWithClaude: (
    text: string,
    maxWords: number,
    prompt: string | null
  ) => Promise<string | null>;
  checkAndRecord: (hash: string) => Promise<boolean>;
  hashContent: (content: string) => string;
  waitForLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  playSound: (type: "alert" | "ping") => void;
  playAlert: (projectName?: string) => void;
  getProvider: (config: HeraldConfig["tts"]) => ITTSProvider;
  withMediaControl: <T>(fn: () => Promise<T>) => Promise<T>;
  activateEditor: (projectName?: string) => void;
}

/**
 * Generate the message content for a stop event.
 * Uses consistent content-based messages for both modes.
 */
export async function getStopMessage(
  input: StopHookInput,
  config: HeraldConfig,
  deps: Pick<
    StopDeps,
    | "extractLastAssistantMessage"
    | "cleanForSpeech"
    | "countWords"
    | "truncateToWords"
    | "summarizeWithClaude"
  >
): Promise<{ content: string; isAlert: boolean }> {
  if (config.style === "alerts") {
    // For alerts, use consistent content (will play a sound)
    return { content: "Claude is done", isAlert: true };
  }

  // TTS: Get the text to speak
  const transcriptPath = input.transcript_path;

  if (!transcriptPath) {
    return { content: "Done", isAlert: false };
  }

  const rawText = await deps.extractLastAssistantMessage(transcriptPath);
  const wordCount = deps.countWords(rawText);
  const maxWords = config.preferences.max_words;

  let messageContent: string;

  if (wordCount <= maxWords) {
    messageContent = deps.cleanForSpeech(rawText);
  } else {
    // Try to summarize with Claude
    const summarized = await deps.summarizeWithClaude(
      rawText,
      maxWords,
      config.preferences.summary_prompt
    );

    if (summarized) {
      messageContent = summarized;
    } else {
      // Fallback to truncation
      messageContent = deps.truncateToWords(
        deps.cleanForSpeech(rawText),
        maxWords
      );
    }
  }

  return { content: messageContent || "Done", isAlert: false };
}

/**
 * Handle a stop event.
 * This is the main business logic extracted from the hook.
 *
 * Flow: acquire lock → check duplicate → play → release lock
 * Uses unified lock for entire critical section.
 */
export async function handleStop(
  input: StopHookInput,
  config: HeraldConfig,
  deps: StopDeps
): Promise<StopResult> {
  // Check if enabled
  if (!config.enabled) {
    return { handled: false, reason: "disabled" };
  }

  const projectName = input.cwd ? basename(input.cwd) : undefined;

  // Generate message content (consistent content-based hashing)
  const { content: messageContent, isAlert } = await getStopMessage(
    input,
    config,
    deps
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
    if (isAlert) {
      if (config.preferences.activate_editor) {
        deps.playAlert(projectName);
      } else {
        deps.playSound("alert");
      }
      // Minimum delay between alerts
      await new Promise((resolve) => setTimeout(resolve, ALERT_MIN_DELAY_MS));
    } else {
      const ttsProvider = deps.getProvider(config.tts);
      if (config.preferences.activate_editor) {
        deps.activateEditor(projectName);
      }
      await deps.withMediaControl(() => ttsProvider.speak(messageContent));
    }
  } finally {
    await deps.releaseLock();
  }

  return { handled: true, reason: "played" };
}
