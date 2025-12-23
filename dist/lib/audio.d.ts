/**
 * Play a system sound in a cross-platform way.
 * @param type - The type of sound: "alert" (task complete) or "ping" (notification)
 */
export declare function playSound(type: "alert" | "ping"): void;
/**
 * Activate VS Code window (bring to front).
 * Cross-platform support.
 * @param projectName - Optional project/folder name to find the correct VS Code window
 */
export declare function activateEditor(projectName?: string): void;
/**
 * Play alert sound and activate editor.
 * @param projectName - Optional project name to find the correct VS Code window
 */
export declare function playAlert(projectName?: string): void;
/**
 * Play ping/notification sound and activate editor.
 * @param projectName - Optional project name to find the correct VS Code window
 */
export declare function playPing(projectName?: string): void;
