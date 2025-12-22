import { spawn } from "child_process";

/**
 * Play a system sound in a cross-platform way.
 * @param type - The type of sound: "alert" (task complete) or "ping" (notification)
 */
export function playSound(type: "alert" | "ping"): void {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS: Use afplay with system sounds
    const sound = type === "alert"
      ? "/System/Library/Sounds/Glass.aiff"
      : "/System/Library/Sounds/Ping.aiff";
    spawn("afplay", [sound], {
      stdio: "ignore",
      detached: true,
    }).unref();
  } else if (platform === "win32") {
    // Windows: Use PowerShell to play system sounds
    const sound = type === "alert"
      ? "[System.Media.SystemSounds]::Exclamation.Play()"
      : "[System.Media.SystemSounds]::Asterisk.Play()";
    spawn("powershell", ["-Command", sound], {
      stdio: "ignore",
      detached: true,
      shell: true,
    }).unref();
  } else {
    // Linux: Try paplay (PulseAudio) or aplay (ALSA)
    // Most distros have some sound at these paths
    const sound = "/usr/share/sounds/freedesktop/stereo/complete.oga";
    spawn("paplay", [sound], {
      stdio: "ignore",
      detached: true,
    }).unref();
  }
}

/**
 * Activate VS Code window (bring to front).
 * Cross-platform support.
 */
export function activateEditor(): void {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS: Use AppleScript
    spawn("osascript", ["-e", 'tell application "Visual Studio Code" to activate'], {
      stdio: "ignore",
      detached: true,
    }).unref();
  } else if (platform === "win32") {
    // Windows: Use PowerShell with COM automation
    const script = `
      $shell = New-Object -ComObject WScript.Shell
      $shell.AppActivate('Visual Studio Code')
    `;
    spawn("powershell", ["-Command", script], {
      stdio: "ignore",
      detached: true,
      shell: true,
    }).unref();
  } else {
    // Linux: Use wmctrl if available
    spawn("wmctrl", ["-a", "Visual Studio Code"], {
      stdio: "ignore",
      detached: true,
    }).unref();
  }
}

/**
 * Play alert sound and activate editor.
 */
export function playAlert(): void {
  playSound("alert");
  activateEditor();
}

/**
 * Play ping/notification sound and activate editor.
 */
export function playPing(): void {
  playSound("ping");
  activateEditor();
}
