/**
 * Play a system sound in a cross-platform way.
 * @param type - The type of sound: "alert" (task complete) or "ping" (notification)
 */
export declare function playSound(type: "alert" | "ping"): void;
/**
 * Activate VS Code window (bring to front).
 * Cross-platform support.
 */
export declare function activateEditor(): void;
/**
 * Play alert sound and activate editor.
 */
export declare function playAlert(): void;
/**
 * Play ping/notification sound and activate editor.
 */
export declare function playPing(): void;
