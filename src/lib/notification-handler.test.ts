import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleNotification,
  getNotificationMessage,
  type NotificationDeps,
} from "./notification-handler.js";
import type { HeraldConfig, NotificationHookInput } from "../types.js";

describe("notification-handler", () => {
  // Mock TTS provider
  const mockTTSProvider = {
    speak: vi.fn().mockResolvedValue(undefined),
    isAvailable: vi.fn().mockResolvedValue(true),
    name: "mock",
  };

  // Mock dependencies
  const createMockDeps = (): NotificationDeps => ({
    checkAndRecord: vi.fn().mockResolvedValue(true),
    hashContent: vi.fn((content: string) => `hash:${content}`),
    waitForLock: vi.fn().mockResolvedValue(true),
    releaseLock: vi.fn().mockResolvedValue(undefined),
    playSound: vi.fn(),
    playPing: vi.fn(),
    getProvider: vi.fn().mockReturnValue(mockTTSProvider),
    withMediaControl: vi.fn((fn) => fn()),
    activateEditor: vi.fn(),
  });

  // Default config
  const createConfig = (overrides?: Partial<HeraldConfig>): HeraldConfig => ({
    enabled: true,
    style: "alerts",
    tts: { provider: "macos" },
    preferences: {
      max_words: 50,
      summary_prompt: null,
      activate_editor: true,
    },
    ...overrides,
  });

  // Default input
  const createInput = (
    overrides?: Partial<NotificationHookInput>
  ): NotificationHookInput => ({
    notification_type: "permission_prompt",
    cwd: "/path/to/project",
    session_id: "session-123",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotificationMessage", () => {
    describe("alerts mode", () => {
      it("generates ping message with content-based hash", () => {
        const result = getNotificationMessage("permission_prompt", "alerts");

        expect(result.isPing).toBe(true);
        expect(result.content).toBe("Claude needs permission");
      });

      it("generates correct message for elicitation_dialog", () => {
        const result = getNotificationMessage("elicitation_dialog", "alerts");

        expect(result.isPing).toBe(true);
        expect(result.content).toBe("Claude needs more information");
      });

      it("generates generic message for unknown types", () => {
        const result = getNotificationMessage("unknown_type", "alerts");

        expect(result.isPing).toBe(true);
        expect(result.content).toBe("Claude is waiting for input");
      });
    });

    describe("tts mode", () => {
      it("generates TTS message for permission_prompt", () => {
        const result = getNotificationMessage("permission_prompt", "tts");

        expect(result.isPing).toBe(false);
        expect(result.content).toBe("Claude needs permission");
      });

      it("generates TTS message for elicitation_dialog", () => {
        const result = getNotificationMessage("elicitation_dialog", "tts");

        expect(result.isPing).toBe(false);
        expect(result.content).toBe("Claude needs more information");
      });

      it("generates generic message for unknown types", () => {
        const result = getNotificationMessage("unknown_type", "tts");

        expect(result.isPing).toBe(false);
        expect(result.content).toBe("Claude is waiting for input");
      });
    });
  });

  describe("handleNotification", () => {
    describe("when disabled", () => {
      it("returns handled: false with reason disabled", async () => {
        const deps = createMockDeps();
        const config = createConfig({ enabled: false });
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: false, reason: "disabled" });
        expect(deps.waitForLock).not.toHaveBeenCalled();
      });
    });

    describe("with invalid notification type", () => {
      it("returns handled: false for empty type", async () => {
        const deps = createMockDeps();
        const config = createConfig();
        const input = createInput({ notification_type: "" });

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: false, reason: "invalid_type" });
      });

      it("returns handled: false for unknown type", async () => {
        const deps = createMockDeps();
        const config = createConfig();
        const input = createInput({ notification_type: "some_other_event" });

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: false, reason: "invalid_type" });
      });
    });

    describe("when lock unavailable", () => {
      it("returns handled: false when lock times out", async () => {
        const deps = createMockDeps();
        vi.mocked(deps.waitForLock).mockResolvedValue(false);
        const config = createConfig();
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: false, reason: "no_lock" });
        expect(deps.playSound).not.toHaveBeenCalled();
        expect(deps.playPing).not.toHaveBeenCalled();
        expect(deps.checkAndRecord).not.toHaveBeenCalled();
      });
    });

    describe("with duplicate content", () => {
      it("returns handled: false when duplicate detected", async () => {
        const deps = createMockDeps();
        vi.mocked(deps.checkAndRecord).mockResolvedValue(false);
        const config = createConfig();
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: false, reason: "duplicate" });
        expect(deps.playSound).not.toHaveBeenCalled();
        expect(deps.releaseLock).toHaveBeenCalled(); // Lock still released
      });
    });

    describe("alerts mode", () => {
      it("plays ping with editor activation", async () => {
        const deps = createMockDeps();
        const config = createConfig({ style: "alerts" });
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: true, reason: "played" });
        expect(deps.playPing).toHaveBeenCalledWith("project");
        expect(deps.playSound).not.toHaveBeenCalled();
        expect(deps.releaseLock).toHaveBeenCalled();
      });

      it("plays sound without editor activation", async () => {
        const deps = createMockDeps();
        const config = createConfig({
          style: "alerts",
          preferences: {
            max_words: 50,
            summary_prompt: null,
            activate_editor: false,
          },
        });
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: true, reason: "played" });
        expect(deps.playSound).toHaveBeenCalledWith("ping");
        expect(deps.playPing).not.toHaveBeenCalled();
      });
    });

    describe("tts mode", () => {
      it("speaks message with TTS provider", async () => {
        const deps = createMockDeps();
        const config = createConfig({ style: "tts" });
        const input = createInput();

        const result = await handleNotification(input, config, deps);

        expect(result).toEqual({ handled: true, reason: "played" });
        expect(deps.getProvider).toHaveBeenCalledWith(config.tts);
        expect(mockTTSProvider.speak).toHaveBeenCalledWith(
          "Claude needs permission"
        );
        expect(deps.withMediaControl).toHaveBeenCalled();
      });

      it("activates editor after TTS when enabled", async () => {
        const deps = createMockDeps();
        const config = createConfig({ style: "tts" });
        const input = createInput();

        await handleNotification(input, config, deps);

        expect(deps.activateEditor).toHaveBeenCalledWith("project");
      });

      it("does not activate editor when disabled", async () => {
        const deps = createMockDeps();
        const config = createConfig({
          style: "tts",
          preferences: {
            max_words: 50,
            summary_prompt: null,
            activate_editor: false,
          },
        });
        const input = createInput();

        await handleNotification(input, config, deps);

        expect(deps.activateEditor).not.toHaveBeenCalled();
      });
    });

    describe("lock release", () => {
      it("releases lock after successful playback", async () => {
        const deps = createMockDeps();
        const config = createConfig();
        const input = createInput();

        await handleNotification(input, config, deps);

        expect(deps.releaseLock).toHaveBeenCalled();
      });

      it("releases lock even if playback throws", async () => {
        const deps = createMockDeps();
        vi.mocked(deps.playPing).mockImplementation(() => {
          throw new Error("Playback failed");
        });
        const config = createConfig();
        const input = createInput();

        await expect(handleNotification(input, config, deps)).rejects.toThrow(
          "Playback failed"
        );

        expect(deps.releaseLock).toHaveBeenCalled();
      });

      it("releases lock even if TTS throws", async () => {
        const deps = createMockDeps();
        mockTTSProvider.speak.mockRejectedValue(new Error("TTS failed"));
        const config = createConfig({ style: "tts" });
        const input = createInput();

        await expect(handleNotification(input, config, deps)).rejects.toThrow(
          "TTS failed"
        );

        expect(deps.releaseLock).toHaveBeenCalled();
      });

      it("releases lock when duplicate detected", async () => {
        const deps = createMockDeps();
        vi.mocked(deps.checkAndRecord).mockResolvedValue(false);
        const config = createConfig();
        const input = createInput();

        await handleNotification(input, config, deps);

        expect(deps.releaseLock).toHaveBeenCalled();
      });
    });

    describe("project name extraction", () => {
      it("extracts project name from cwd", async () => {
        const deps = createMockDeps();
        const config = createConfig();
        const input = createInput({ cwd: "/Users/alex/repos/my-project" });

        await handleNotification(input, config, deps);

        expect(deps.playPing).toHaveBeenCalledWith("my-project");
      });

      it("handles missing cwd", async () => {
        const deps = createMockDeps();
        const config = createConfig();
        const input = createInput({ cwd: undefined });

        await handleNotification(input, config, deps);

        expect(deps.playPing).toHaveBeenCalledWith(undefined);
      });
    });

    describe("unified lock flow", () => {
      it("acquires lock before checking for duplicates", async () => {
        const deps = createMockDeps();
        const callOrder: string[] = [];
        vi.mocked(deps.waitForLock).mockImplementation(async () => {
          callOrder.push("waitForLock");
          return true;
        });
        vi.mocked(deps.checkAndRecord).mockImplementation(async () => {
          callOrder.push("checkAndRecord");
          return true;
        });
        const config = createConfig();
        const input = createInput();

        await handleNotification(input, config, deps);

        expect(callOrder).toEqual(["waitForLock", "checkAndRecord"]);
      });
    });
  });
});
