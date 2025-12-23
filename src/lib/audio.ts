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
 * @param projectName - Optional project/folder name to find the correct VS Code window
 */
export function activateEditor(projectName?: string): void {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS: Use AppleScript with System Events to find the right window
    const script = projectName
      ? `
        tell application "System Events"
          tell process "Code"
            set frontmost to true
            repeat with w in windows
              if name of w contains "${projectName}" then
                perform action "AXRaise" of w
                exit repeat
              end if
            end repeat
          end tell
        end tell
      `
      : 'tell application "Visual Studio Code" to activate';
    spawn("osascript", ["-e", script], {
      stdio: "ignore",
      detached: true,
    }).unref();
  } else if (platform === "win32") {
    // Windows: Use PowerShell with COM automation
    const windowTitle = projectName || "Visual Studio Code";
    const script = `
      $shell = New-Object -ComObject WScript.Shell
      $shell.AppActivate('${windowTitle}')
    `;
    spawn("powershell", ["-Command", script], {
      stdio: "ignore",
      detached: true,
      shell: true,
    }).unref();
  } else {
    // Linux: Use wmctrl if available
    const windowTitle = projectName || "Visual Studio Code";
    spawn("wmctrl", ["-a", windowTitle], {
      stdio: "ignore",
      detached: true,
    }).unref();
  }
}

/**
 * Play alert sound and activate editor.
 * @param projectName - Optional project name to find the correct VS Code window
 */
export function playAlert(projectName?: string): void {
  playSound("alert");
  activateEditor(projectName);
}

/**
 * Play ping/notification sound and activate editor.
 * @param projectName - Optional project name to find the correct VS Code window
 */
export function playPing(projectName?: string): void {
  playSound("ping");
  activateEditor(projectName);
}
