---
description: Set herald notification style (tts, alerts, or silent)
argument-hint: <tts|alerts|silent>
allowed-tools: Bash
---

Set the notification style for when Claude finishes responding.

**Styles:**
- `tts` - Text-to-speech reads the response aloud
- `alerts` - Play a sound and activate VS Code
- `silent` - No notifications

!`node ${CLAUDE_PLUGIN_ROOT}/dist/cli/set-style.js $ARGUMENTS`
