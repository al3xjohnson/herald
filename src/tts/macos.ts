import { spawn } from "child_process";
import type { ITTSProvider } from "./provider.js";

/**
 * macOS TTS provider using the built-in `say` command.
 * Works on macOS only.
 */
export class MacOSTTSProvider implements ITTSProvider {
  readonly name = "macOS Say";

  async speak(message: string): Promise<void> {
    return new Promise((resolve) => {
      const proc = spawn("say", [message], {
        stdio: "inherit",
      });
      proc.on("close", () => resolve());
      proc.on("error", () => resolve());
    });
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn("which", ["say"], {
        stdio: "ignore",
      });
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });
  }
}
