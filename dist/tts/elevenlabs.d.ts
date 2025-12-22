import type { TTSProviderConfig } from "../types.js";
import type { ITTSProvider } from "./provider.js";
/**
 * ElevenLabs TTS provider.
 * Requires an API key and voice ID to be configured.
 *
 * Uses native Node.js fetch (Node 18+) to call the ElevenLabs API,
 * then plays the audio using afplay (macOS) or aplay (Linux).
 */
export declare class ElevenLabsTTSProvider implements ITTSProvider {
    readonly name = "ElevenLabs";
    private apiKey;
    private voiceId;
    constructor(config: TTSProviderConfig);
    speak(message: string): Promise<void>;
    isAvailable(): Promise<boolean>;
}
