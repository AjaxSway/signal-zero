# CORTEX Signal Zero — CLI

Agentic terminal intelligence. Your CORTEX, in your shell, with file/shell/git tools and full safety prompts.

> **Status (v0.2.0)**: Agent loop wired and verified end-to-end. Default mode is chat-only; flip `agent on` inside the REPL to enable tool use.

---

## What it is

A Node.js CLI that talks to your CORTEX brain through `api.cortexnode.ai` (or a local control server at `127.0.0.1:7749`). Two surfaces:

- **Chat REPL** — same as before. Streaming responses, voice playback, project context auto-attached.
- **Agent mode** — opt-in. CORTEX gains 9 tools (file_read, file_write, file_list, shell_exec, git_status, git_diff, git_add, git_commit, git_push). Loops up to 8 iterations per turn. Diffs preview before writes. Destructive shell commands require typed confirmation.

The CLI ships generic — same code for every user. Per-user personalization lives in `~/.cortex-signal-zero/profile.md` (loaded automatically, never sent anywhere except your model context).

---

## Install

```bash
git clone https://github.com/AjaxSway/cortex-signal-zero-cli.git
cd cortex-signal-zero-cli
npm install
npm link    # registers the `cortex`, `signal-zero`, and `csz` commands globally
```

Requires Node 18+.

---

## First-time setup

```bash
cortex --setup
```

Walks you through:
1. Server choice (cloud `cortexnode.ai` or local dev `127.0.0.1:7749`)
2. CORTEX access token
3. Intelligence tier (`cortex-standard` / `cortex-advanced` / `cortex-lite`)
4. Voice on/off (CORTEX TTS — bring your own voice key)

Config saved to `~/.cortex-signal-zero/config.json`.

Optional: drop a `~/.cortex-signal-zero/profile.md` with anything you want CORTEX to know about you (name, preferences, project context, custom rules). It's loaded on every turn and never leaves your machine.

---

## Use

```bash
# One-shot question (non-interactive)
cortex "summarize this folder for me"

# Interactive REPL
cortex
```

Inside the REPL:

| Command | What it does |
|---|---|
| `help` | Show all commands |
| `status` | System + config info |
| `agent on` / `agent off` | Toggle tool use |
| `agent` | Show current agent mode state |
| `model <name>` | Switch tier |
| `reset` | Clear conversation history |
| `context` | Show project context CORTEX has |
| `ls` / `tree` / `cat <file>` | Local file commands (you, not the agent) |
| `run <cmd>` / `! <cmd>` | Run shell command directly |
| `clear` / `logo` / `exit` | Self-explanatory |
| anything else | Sent to CORTEX |

Quick env-var override (no config write):
```bash
CORTEX_AGENT=1 cortex "list files and tell me how many"
```

---

## Agent mode

When agent mode is on, CORTEX can use 9 tools to actually do things on your machine:

| Tool | Confirmation? |
|---|---|
| `file_read` | none — read-only |
| `file_list` | none — read-only |
| `git_status` | none — read-only |
| `git_diff` | none — read-only |
| `file_write` | yes — colored unified diff preview, y/N prompt |
| `git_add` | yes — y/N prompt |
| `git_commit` | yes — shows the message, y/N prompt |
| `git_push` | yes — shows the remote/branch, y/N prompt. Force-push to `main`/`master` requires typed `FORCE PUSH MAIN` |
| `shell_exec` | tiered — see below |

**Shell exec safety tiering:**

- **Allowlist** runs silently (no prompt): `ls`, `pwd`, `whoami`, `date`, `cat`, `head`, `tail`, `wc`, `grep`, `find`, `git status/diff/log/branch/show/remote`, `which`, `env`, etc.
- **Unknown commands** prompt y/N before running.
- **Danger list** requires typed confirmation `RUN IT`: `rm -rf`, `sudo`, `dd`, `mkfs`, `fdisk`, fork bombs, redirects to `/dev/sd*`, force-push to main, hard-reset to main, etc.

**Loop guard**: agent runs at most 8 tool iterations per user turn. Hitting the cap stops cleanly with a warning instead of running away.

---

## How it routes

```
you → cortex CLI → api.cortexnode.ai/v1/chat → control server → frontier reasoning provider
                                                              ↓
                                                       (tool_use blocks)
                                                              ↓
                                            ← tool_result loops back through CLI dispatcher
```

The CLI never calls model providers directly. Everything flows through your control server, which handles auth, brand-rule scrubbing, multi-provider failover, and tool forwarding.

---

## Per-user vs shipping

| Layer | Lives where | Contents |
|---|---|---|
| CLI binary (this repo) | Same for every user | Generic CORTEX persona, agent loop, tool dispatcher, safety prompts |
| `~/.cortex-signal-zero/config.json` | Per-user, local | Your auth token, model tier, voice key |
| `~/.cortex-signal-zero/profile.md` | Per-user, local | Your name, preferences, custom instructions, anything else |

The shipping CLI has zero personal data. The profile.md you write personalizes your experience without ever being part of the codebase.

---

## License

UNLICENSED — © CORTEXNODE Inc. Internal CORTEX surface; not for redistribution.
