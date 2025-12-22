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
    content: Array<{ type: string; text?: string }>;
  };
}

export const DEFAULT_CONFIG: HeraldConfig = {
  enabled: true,
  style: "alerts",
  tts: {
    provider: "macos",
  },
  preferences: {
    max_words: 50,
    summary_prompt: null,
  },
};

export const DEFAULT_TTS_PROMPT = `Summarize this for text-to-speech output. Requirements:
- Keep it under {max_words} words
- Write in natural spoken language (no bullet points, no markdown)
- Spell out abbreviations and acronyms
- Avoid special characters, code snippets, or URLs
- Focus on the key outcome or action taken
- Make it sound conversational, as if briefly telling someone what happened

Text to summarize:
`;
