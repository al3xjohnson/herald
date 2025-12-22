export declare function cleanForSpeech(text: string): string;
export declare function truncateToWords(text: string, maxWords: number): string;
export declare function summarizeWithClaude(text: string, maxWords: number, customPrompt?: string | null): Promise<string | null>;
