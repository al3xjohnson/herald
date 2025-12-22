#!/usr/bin/env node
import { readFile } from "fs/promises";
import { loadConfig } from "../lib/config.js";
import { playAlert } from "../lib/audio.js";
import {
  cleanForSpeech,
  truncateToWords,
  summarizeWithClaude,
} from "../lib/summarize.js";
import { getProvider } from "../tts/index.js";
import type { StopHookInput, TranscriptMessage } from "../types.js";

async function extractLastAssistantMessage(
  transcriptPath: string
): Promise<string> {
  try {
    const text = await readFile(transcriptPath, "utf-8");
    const lines = text.trim().split("\n");

    // Parse JSONL and find last assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      const msg: TranscriptMessage = JSON.parse(lines[i]);
      if (msg.type === "assistant" && msg.message?.content) {
        const textParts = msg.message.content
          .filter((block) => block.type === "text" && block.text)
          .map((block) => block.text!)
          .join(" ");

        if (textParts.trim()) {
          return textParts.trim();
        }
      }
    }
  } catch {
    // Fall through
  }
  return "Done";
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    // Handle case where stdin is empty/closed
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

async function main() {
  const config = await loadConfig();

  if (!config.enabled) {
    process.exit(0);
  }

  // Read hook input from stdin
  const stdinText = await readStdin();
  let input: StopHookInput = {};

  try {
    input = JSON.parse(stdinText);
  } catch {
    // No input or invalid JSON
  }

  switch (config.style) {
    case "tts": {
      const ttsProvider = getProvider(config.tts);
      const transcriptPath = input.transcript_path;

      if (!transcriptPath) {
        await ttsProvider.speak("Done");
        break;
      }

      const rawText = await extractLastAssistantMessage(transcriptPath);
      const wordCount = rawText.split(/\s+/).length;
      const maxWords = config.preferences.max_words;

      let finalText: string;

      if (wordCount <= maxWords) {
        // Short enough, just clean it
        finalText = cleanForSpeech(rawText);
      } else {
        // Try to summarize with Claude
        const summarized = await summarizeWithClaude(
          rawText,
          maxWords,
          config.preferences.summary_prompt
        );

        if (summarized) {
          finalText = summarized;
        } else {
          // Fallback to truncation
          finalText = truncateToWords(cleanForSpeech(rawText), maxWords);
        }
      }

      await ttsProvider.speak(finalText || "Done");
      break;
    }

    case "alerts": {
      playAlert();
      break;
    }

    case "silent":
    default:
      // Do nothing
      break;
  }
}

main().catch(console.error);
