import { spawn } from "child_process";
import type { ITTSProvider } from "./provider.js";

/**
 * Windows TTS provider using PowerShell's built-in speech synthesis.
 * Works on Windows only.
 */
export class WindowsTTSProvider implements ITTSProvider {
  readonly name = "Windows SAPI";

  async speak(message: string): Promise<void> {
    // Escape single quotes for PowerShell
    const escaped = message.replace(/'/g, "''");
    const script = `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${escaped}')`;

    return new Promise((resolve) => {
      const proc = spawn("powershell", ["-Command", script], {
        stdio: "ignore",
        shell: true,
      });
      proc.on("close", () => resolve());
      proc.on("error", () => resolve());
    });
  }

  async isAvailable(): Promise<boolean> {
    return process.platform === "win32";
  }
}
