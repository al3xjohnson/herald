#!/usr/bin/env node
import { saveConfig } from "../lib/config.js";
const style = process.argv[2]?.toLowerCase();
if (!style || !["tts", "alerts", "silent"].includes(style)) {
    console.error("Error: Style must be tts, alerts, or silent");
    process.exit(1);
}
await saveConfig({ style: style });
console.log(`Herald style set to: ${style}`);
