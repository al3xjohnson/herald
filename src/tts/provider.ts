import type { TTSProviderConfig } from "../types.js";

/**
 * Interface for TTS providers.
 * Implement this to add support for new TTS services.
 */
export interface ITTSProvider {
  /**
   * Speak the given text aloud.
   * @param message - The text to speak
   * @returns Promise that resolves when speech is complete (or started, for async providers)
   */
  speak(message: string): Promise<void>;

  /**
   * Check if this provider is available/configured.
   * @returns true if the provider can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the provider name for display purposes.
   */
  readonly name: string;
}

/**
 * Registry of available TTS providers.
 */
export type ProviderFactory = (config: TTSProviderConfig) => ITTSProvider;

const providers = new Map<string, ProviderFactory>();

/**
 * Register a TTS provider factory.
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  providers.set(name, factory);
}

/**
 * Get a TTS provider by name.
 */
export function getProvider(config: TTSProviderConfig): ITTSProvider {
  const factory = providers.get(config.provider);
  if (!factory) {
    throw new Error(`Unknown TTS provider: ${config.provider}`);
  }
  return factory(config);
}

/**
 * Get list of registered provider names.
 */
export function getAvailableProviders(): string[] {
  return Array.from(providers.keys());
}
