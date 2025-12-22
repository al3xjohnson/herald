export type TTSProvider = "macos" | "windows" | "elevenlabs";
export interface TTSProviderConfig {
    provider: TTSProvider;
    elevenlabs?: {
        apiKey: string;
        voiceId: string;
    };
}
export interface HeraldConfig {
    enabled: boolean;
    style: "tts" | "alerts" | "silent";
    tts: TTSProviderConfig;
    preferences: {
        max_words: number;
        summary_prompt: string | null;
    };
}
export interface StopHookInput {
    transcript_path?: string;
    session_id?: string;
}
export interface NotificationHookInput {
    type: string;
    message?: string;
}
export interface TranscriptMessage {
    type: "user" | "assistant" | "system";
    message?: {
        content: Array<{
            type: string;
            text?: string;
        }>;
    };
}
export declare const DEFAULT_CONFIG: HeraldConfig;
export declare const DEFAULT_TTS_PROMPT = "Summarize this for text-to-speech output. Requirements:\n- Keep it under {max_words} words\n- Write in natural spoken language (no bullet points, no markdown)\n- Spell out abbreviations and acronyms\n- Avoid special characters, code snippets, or URLs\n- Focus on the key outcome or action taken\n- Make it sound conversational, as if briefly telling someone what happened\n\nText to summarize:\n";
