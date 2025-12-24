import type { HeraldConfig, StopHookInput } from "../types.js";
import type { ITTSProvider } from "../tts/provider.js";
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
    summarizeWithClaude: (text: string, maxWords: number, prompt: string | null) => Promise<string | null>;
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
export declare function getStopMessage(input: StopHookInput, config: HeraldConfig, deps: Pick<StopDeps, "extractLastAssistantMessage" | "cleanForSpeech" | "countWords" | "truncateToWords" | "summarizeWithClaude">): Promise<{
    content: string;
    isAlert: boolean;
}>;
/**
 * Handle a stop event.
 * This is the main business logic extracted from the hook.
 *
 * Flow: acquire lock → check duplicate → play → release lock
 * Uses unified lock for entire critical section.
 */
export declare function handleStop(input: StopHookInput, config: HeraldConfig, deps: StopDeps): Promise<StopResult>;
