import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import type { TTSProviderConfig } from "../types.js";
import type { ITTSProvider } from "./provider.js";

/**
 * ElevenLabs TTS provider.
 * Requires an API key and voice ID to be configured.
 *
 * Uses native Node.js fetch (Node 18+) to call the ElevenLabs API,
 * then plays the audio using afplay (macOS) or aplay (Linux).
 */
export class ElevenLabsTTSProvider implements ITTSProvider {
  readonly name = "ElevenLabs";
  private apiKey: string;
  private voiceId: string;

  constructor(config: TTSProviderConfig) {
    if (!config.elevenlabs?.apiKey) {
      throw new Error("ElevenLabs API key is required");
    }
    if (!config.elevenlabs?.voiceId) {
      throw new Error("ElevenLabs voice ID is required");
    }
    this.apiKey = config.elevenlabs.apiKey;
    this.voiceId = config.elevenlabs.voiceId;
  }

  async speak(message: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": this.apiKey,
          },
          body: JSON.stringify({
            text: message,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${error}`);
        return;
      }

      // Save audio to temp file and play it
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const tempFile = join(tmpdir(), `herald-${randomUUID()}.mp3`);

      await writeFile(tempFile, audioBuffer);

      await new Promise<void>((resolve) => {
        // Use afplay on macOS, aplay on Linux
        const player = process.platform === "darwin" ? "afplay" : "aplay";
        const proc = spawn(player, [tempFile], {
          stdio: "ignore",
        });
        proc.on("close", () => {
          // Clean up temp file
          unlink(tempFile).catch(() => {});
          resolve();
        });
        proc.on("error", () => {
          unlink(tempFile).catch(() => {});
          resolve();
        });
      });
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
    }
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured and valid
    if (!this.apiKey || !this.voiceId) {
      return false;
    }

    try {
      // Quick validation request to check API key
      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
