#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { loadConfig } from "../lib/config.js";
import { playAlert } from "../lib/audio.js";
import { cleanForSpeech, truncateToWords, summarizeWithClaude, } from "../lib/summarize.js";
import { getProvider } from "../tts/index.js";
// Session deduplication to prevent multiple TTS plays
const LOCK_DIR = join(homedir(), ".config", "herald", "locks");
const LOCK_EXPIRY_MS = 10000; // 10 seconds
async function acquireSessionLock(sessionId) {
    if (!sessionId)
        return true; // No session ID, allow
    const lockFile = join(LOCK_DIR, `${sessionId}.lock`);
    try {
        await mkdir(LOCK_DIR, { recursive: true });
        // Check if lock exists and is recent
        if (existsSync(lockFile)) {
            const content = await readFile(lockFile, "utf-8");
            const timestamp = parseInt(content, 10);
            if (Date.now() - timestamp < LOCK_EXPIRY_MS) {
                return false; // Lock is held
            }
        }
        // Create/update lock
        await writeFile(lockFile, String(Date.now()));
        return true;
    }
    catch {
        return true; // On error, allow (fail open)
    }
}
async function extractLastAssistantMessage(transcriptPath) {
    try {
        const text = await readFile(transcriptPath, "utf-8");
        const lines = text.trim().split("\n");
        // Parse JSONL and find last assistant message
        for (let i = lines.length - 1; i >= 0; i--) {
            const msg = JSON.parse(lines[i]);
            if (msg.type === "assistant" && msg.message?.content) {
                const textParts = msg.message.content
                    .filter((block) => block.type === "text" && block.text)
                    .map((block) => block.text)
                    .join(" ");
                if (textParts.trim()) {
                    return textParts.trim();
                }
            }
        }
    }
    catch {
        // Fall through
    }
    return "Done";
}
async function readStdin(timeoutMs = 5000) {
    return new Promise((resolve) => {
        let data = "";
        let resolved = false;
        const done = (result) => {
            if (!resolved) {
                resolved = true;
                resolve(result);
            }
        };
        // Timeout to prevent hanging if stdin never closes
        const timeout = setTimeout(() => {
            done(data);
        }, timeoutMs);
        process.stdin.setEncoding("utf-8");
        process.stdin.on("data", (chunk) => {
            data += chunk;
        });
        process.stdin.on("end", () => {
            clearTimeout(timeout);
            done(data);
        });
        process.stdin.on("error", () => {
            clearTimeout(timeout);
            done(data);
        });
        // Handle case where stdin is empty/closed
        if (process.stdin.isTTY) {
            clearTimeout(timeout);
            done("");
        }
    });
}
async function main() {
    const logFile = join(homedir(), ".config", "herald", "debug.log");
    const log = async (msg) => {
        const line = `[${new Date().toISOString()}] ${msg}\n`;
        await writeFile(logFile, line, { flag: "a" }).catch(() => { });
    };
    await log("on-stop triggered");
    const config = await loadConfig();
    if (!config.enabled) {
        await log("disabled, exiting");
        process.exit(0);
    }
    // Read hook input from stdin
    const stdinText = await readStdin();
    await log(`stdin: ${stdinText.substring(0, 200)}`);
    let input = {};
    try {
        input = JSON.parse(stdinText);
    }
    catch {
        // No input or invalid JSON
    }
    await log(`session_id: ${input.session_id}`);
    // Prevent duplicate notifications for the same session
    if (input.session_id) {
        const gotLock = await acquireSessionLock(input.session_id);
        await log(`lock result: ${gotLock}`);
        if (!gotLock) {
            await log("lock held, exiting");
            process.exit(0); // Another instance already handling this session
        }
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
            let finalText;
            if (wordCount <= maxWords) {
                // Short enough, just clean it
                finalText = cleanForSpeech(rawText);
            }
            else {
                // Try to summarize with Claude
                const summarized = await summarizeWithClaude(rawText, maxWords, config.preferences.summary_prompt);
                if (summarized) {
                    finalText = summarized;
                }
                else {
                    // Fallback to truncation
                    finalText = truncateToWords(cleanForSpeech(rawText), maxWords);
                }
            }
            const textToSpeak = finalText || "Done";
            await log(`speaking: ${textToSpeak}`);
            await ttsProvider.speak(textToSpeak);
            await log("speech complete");
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
