#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════
//  C O R T E X   S I G N A L   Z E R O
//  Agentic Terminal Intelligence
//  One Brain. One System. One Solution.
//  (c) 2026 CORTEXNODE Inc
// ═══════════════════════════════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import { execSync, spawn } from 'child_process';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
  readdirSync, statSync, appendFileSync, unlinkSync
} from 'fs';
import { homedir, platform, hostname, cpus, totalmem, freemem } from 'os';
import path from 'path';
import readline from 'readline';

// ─── Config ────────────────────────────────────────────────────────────────

const HOME = homedir();
const CONFIG_DIR = path.join(HOME, '.cortex-signal-zero');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');
const SESSIONS_DIR = path.join(CONFIG_DIR, 'sessions');
const VERSION = '0.2.1';

// CORTEX API — routes through cortexnode.ai (control server proxy)
const CORTEX_API_URL = process.env.CORTEX_API_URL || 'https://api.cortexnode.ai';
const CORTEX_DEV_URL = 'http://127.0.0.1:7749';

if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

// ─── Colors (CORTEX — Neural Blue) ──────────────────────────────────────

const c = {
  brand: chalk.hex('#00E5FF'),
  brandBold: chalk.hex('#00E5FF').bold,
  accent: chalk.hex('#66F0FF'),
  core: chalk.hex('#00B8D4'),
  dim: chalk.hex('#1A3A4A'),
  dimmer: chalk.hex('#0A1A24'),
  text: chalk.hex('#C8E0E8'),
  bright: chalk.hex('#E0F4FF'),
  success: chalk.hex('#48BB78'),
  warning: chalk.hex('#ECC94B'),
  error: chalk.hex('#FC8181'),
  muted: chalk.hex('#718096'),
};

const signalGradient = gradient(['#00E5FF', '#66F0FF', '#00E5FF']);
const coreGradient = gradient(['#00E5FF', '#0088AA', '#004455']);

// ─── Config Management ────────────────────────────────────────────────────

function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getModel() {
  const config = loadConfig();
  return config.model || 'cortex-standard';
}

// ─── Logo ──────────────────────────────────────────────────────────────────

function renderLogo() {
  const logo = [
    '',
    c.dim('                          |'),
    c.dim('                          |'),
    c.dim('                  +-------+-------+'),
    c.dim('              +---') + c.brand('-------') + c.dim('+') + c.brand('-------') + c.dim('---+'),
    c.dim('           +--') + c.brand('-') + c.dim('+  ') + c.accent('.......') + c.brandBold('*') + c.accent('.......') + c.dim('  +') + c.brand('-') + c.dim('--+'),
    c.dim('           |  ') + c.brand('|') + c.dim('   ') + c.accent('.......') + c.dim('|') + c.accent('.......') + c.dim('   ') + c.brand('|') + c.dim('  |'),
    c.dim('       ----') + c.brand('+--') + c.dim('+   ') + c.accent('.......') + c.dim('|') + c.accent('.......') + c.dim('   +') + c.brand('--+') + c.dim('----'),
    c.dim('           |  ') + c.brand('|') + c.dim('   ') + c.accent('.......') + c.dim('|') + c.accent('.......') + c.dim('   ') + c.brand('|') + c.dim('  |'),
    c.dim('           +--') + c.brand('-') + c.dim('+  ') + c.accent('.......') + c.brandBold('*') + c.accent('.......') + c.dim('  +') + c.brand('-') + c.dim('--+'),
    c.dim('              +---') + c.brand('-------') + c.dim('+') + c.brand('-------') + c.dim('---+'),
    c.dim('                  +-------+-------+'),
    c.dim('                          |'),
    c.dim('                          |'),
    '',
  ];
  logo.forEach(line => console.log(line));
}

function renderTitle() {
  console.log('');
  console.log(signalGradient('   ====================================================='));
  console.log(signalGradient('   ||') + '                                                 ' + signalGradient('||'));
  console.log(signalGradient('   ||') + c.brandBold('        C O R T E X   S I G N A L   Z E R O      ') + signalGradient('||'));
  console.log(signalGradient('   ||') + c.dim('           Agentic Terminal Intelligence             ') + signalGradient('||'));
  console.log(signalGradient('   ||') + '                                                 ' + signalGradient('||'));
  console.log(signalGradient('   ====================================================='));
  console.log('');
}

function renderCompactHeader() {
  console.log('');
  console.log(c.brandBold('  CORTEX SIGNAL ZERO') + c.dim(` v${VERSION}`));
  console.log(c.dim('  Agentic Terminal Intelligence'));
  console.log('');
}

// ─── System Prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CORTEX, a personal intelligence operating system that runs inside the user's terminal. You read files, write files, execute shell commands, and complete multi-step work via tools.

Your personality:
- Calm, intelligent, composed. Direct and decisive. State what you know. State uncertainty plainly when present.
- Helpful because effective. Efficiency is respect.
- No over-explaining. No unnecessary apologies. You execute.
- Default address is the user's preference (loaded from profile if available; otherwise "you"). Match what their profile asks for.

Your capabilities:
- Read and analyze files anywhere the user has access
- Write and modify files (write changes are previewed as a diff before they apply)
- Run shell commands (destructive operations require explicit user confirmation)
- Explain code, debug issues, refactor with care for the user's existing patterns
- Show directory trees, file structures, project layouts
- Plan and execute multi-step work via tool use

When working with code:
- Full code blocks, never fragments
- Annotate only when the why is non-obvious
- Suggest the simplest effective solution that respects existing conventions

Operating rules:
- The user owns the machine you run on. Treat their files, credentials, and configuration with care.
- For destructive or hard-to-reverse operations (rm -rf, force-push, dropping data, deleting branches, sudo), confirm explicitly before acting.
- For routine reversible work, act first and report concisely.
- When the user's profile or instructions override these defaults, follow them — the profile is authoritative for that user.

When the user asks you to do something, do it. When they ask a question, answer it. Concise. Clear. Effective.`;

// ─── Profile Loader ──────────────────────────────────────────────────────

function loadProfile() {
  const profilePath = path.join(CONFIG_DIR, 'profile.md');
  if (existsSync(profilePath)) {
    try {
      return readFileSync(profilePath, 'utf8');
    } catch {}
  }
  return null;
}

function getSystemPromptWithProfile() {
  const profile = loadProfile();
  if (profile) {
    return SYSTEM_PROMPT + '\n\n--- Owner Profile ---\n' + profile + '\n--- End Profile ---';
  }
  return SYSTEM_PROMPT;
}

// ─── Voice (CORTEX text-to-speech) ──────────────────────────────────────

const CORTEX_VOICE_ID = 's3TPKV1kjDlVtZbl4Ksh'; // Default CORTEX voice id (matches all CORTEX surfaces)
const CORTEX_VOICE_MODEL = 'eleven_multilingual_v2';

function getVoiceKey() {
  const config = loadConfig();
  // Accept new name (voiceKey) and legacy name (elevenLabsKey) for backward compat;
  // also honor env var. New configs only write voiceKey.
  return config.voiceKey || config.elevenLabsKey || process.env.CORTEX_VOICE_KEY || process.env.ELEVENLABS_API_KEY || null;
}

async function speakResponse(text) {
  const apiKey = getVoiceKey();
  if (!apiKey) return; // Voice not configured — silent mode

  // Strip code blocks and long technical content — speak only conversational text
  let spoken = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\|[^\n]+\|/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  // If nothing left after stripping, skip
  if (!spoken || spoken.length < 10) return;

  // Limit to first 3 sentences for brevity
  const sentences = spoken.match(/[^.!?]+[.!?]+/g) || [spoken];
  spoken = sentences.slice(0, 3).join(' ').trim();
  if (spoken.length > 500) spoken = spoken.substring(0, 500);

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CORTEX_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: spoken,
        model_id: CORTEX_VOICE_MODEL,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) return;

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const tmpFile = `/tmp/cortex_sz_${Date.now()}.mp3`;
    writeFileSync(tmpFile, audioBuffer);

    // Play in background — do not block the terminal
    spawn('afplay', [tmpFile], { detached: true, stdio: 'ignore' }).unref();
  } catch {}
}

// ─── API Communication (via cortexnode.ai) ────────────────────────────────

function getServerUrl() {
  const config = loadConfig();
  // Dev mode uses local server, production uses cortexnode.ai
  if (config.dev || process.env.CORTEX_DEV) return CORTEX_DEV_URL;
  return config.serverUrl || CORTEX_API_URL;
}

function getAuthToken() {
  const config = loadConfig();
  return config.authToken || process.env.CORTEX_AUTH_TOKEN || null;
}

// streamResponse — single API turn. Sends `messages` to the server, paints
// streamed text deltas, captures any tool_use blocks the model emits, and
// returns { text, toolUses, stopReason } so the agent loop can decide
// whether to dispatch tools and re-call.
//
// Backward-compatible: callers who don't pass `opts.tools` get the same
// behavior as before. With tools, the function additionally tracks tool_use
// content blocks and their accumulated input JSON.
async function streamResponse(messages, opts = {}) {
  const serverUrl = getServerUrl();
  const authToken = getAuthToken();
  const model = getModel();

  if (!authToken) {
    throw new Error('Not authenticated. Run: cortex --setup');
  }

  const body = {
    model,
    max_tokens: 8192,
    system: getSystemPromptWithProfile(),
    messages,
    stream: true,
  };
  if (opts.tools && opts.tools.length) body.tools = opts.tools;

  const res = await fetch(`${serverUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CORTEX API error ${res.status}: ${err}`);
  }

  const contentType = res.headers.get('content-type') || '';

  // Non-streaming JSON fallback (server may downgrade)
  if (!contentType.includes('text/event-stream')) {
    const data = await res.json();
    const text = data.content || '';
    if (text) {
      process.stdout.write(c.text(text));
      console.log('');
    }
    return { text, toolUses: [], stopReason: 'end_turn' };
  }

  // SSE streaming path — handles text deltas + tool_use blocks
  let fullText = '';
  const blocks = {}; // index → { type, id?, name?, text?, inputJson? }
  let stopReason = 'end_turn';
  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      let event;
      try { event = JSON.parse(data); } catch { continue; }

      // content_block_start: opens a text or tool_use block at index N
      if (event.type === 'content_block_start') {
        const i = event.index ?? 0;
        const cb = event.content_block || {};
        if (cb.type === 'tool_use') {
          blocks[i] = { type: 'tool_use', id: cb.id, name: cb.name, inputJson: '' };
          // Hint to user that a tool call is being prepared
          process.stdout.write(c.dim(`\n  [tool: ${cb.name}] `));
        } else if (cb.type === 'text') {
          blocks[i] = { type: 'text', text: '' };
        }
      }

      // content_block_delta: incremental update to a block
      else if (event.type === 'content_block_delta') {
        const i = event.index ?? 0;
        const d = event.delta || {};
        // Anthropic-native shape: delta.type=text_delta with .text
        // Server sometimes flattens to delta.text directly — handle both
        const textChunk = d.text || (d.type === 'text_delta' ? d.text : null);
        if (textChunk) {
          process.stdout.write(c.text(textChunk));
          fullText += textChunk;
          if (blocks[i] && blocks[i].type === 'text') blocks[i].text += textChunk;
        }
        if (d.type === 'input_json_delta' && typeof d.partial_json === 'string') {
          if (!blocks[i]) blocks[i] = { type: 'tool_use', inputJson: '' };
          blocks[i].inputJson += d.partial_json;
        }
      }

      // content_block_stop: finalize a block (especially parse tool_use input)
      else if (event.type === 'content_block_stop') {
        const i = event.index ?? 0;
        const block = blocks[i];
        if (block && block.type === 'tool_use' && block.inputJson) {
          try { block.input = JSON.parse(block.inputJson); }
          catch { block.input = {}; }
        }
      }

      // message_delta: carries stop_reason
      else if (event.type === 'message_delta') {
        if (event.delta?.stop_reason) stopReason = event.delta.stop_reason;
      }
    }
  }

  // Pull tool_use blocks out in index order
  const toolUses = Object.keys(blocks)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => blocks[k])
    .filter((b) => b.type === 'tool_use' && b.id && b.name)
    .map((b) => ({ id: b.id, name: b.name, input: b.input || {} }));

  console.log('');
  return { text: fullText, toolUses, stopReason };
}

// ─── File Operations ──────────────────────────────────────────────────────

function readFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!existsSync(resolved)) return null;
  try {
    return readFileSync(resolved, 'utf8');
  } catch (e) {
    return `Error reading file: ${e.message}`;
  }
}

function writeFile(filePath, content) {
  const resolved = path.resolve(filePath);
  try {
    const dir = path.dirname(resolved);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(resolved, content);
    return true;
  } catch (e) {
    return e.message;
  }
}

function listFiles(dir = '.', recursive = false) {
  const resolved = path.resolve(dir);
  if (!existsSync(resolved)) return [];

  try {
    if (recursive) {
      const results = [];
      const walk = (d, prefix = '') => {
        const entries = readdirSync(d);
        for (const entry of entries) {
          if (entry.startsWith('.') || entry === 'node_modules') continue;
          const full = path.join(d, entry);
          const rel = prefix ? `${prefix}/${entry}` : entry;
          const stat = statSync(full);
          if (stat.isDirectory()) {
            results.push(rel + '/');
            walk(full, rel);
          } else {
            results.push(rel);
          }
        }
      };
      walk(resolved);
      return results;
    }

    return readdirSync(resolved).map(f => {
      const full = path.join(resolved, f);
      try {
        return statSync(full).isDirectory() ? f + '/' : f;
      } catch { return f; }
    });
  } catch (e) {
    return [];
  }
}

function runCommand(cmd, cwd = process.cwd()) {
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      cwd,
    });
    return { success: true, output: output.trim() };
  } catch (e) {
    return {
      success: false,
      output: e.stdout?.trim() || '',
      error: e.stderr?.trim() || e.message,
      exitCode: e.status,
    };
  }
}

// ─── Agent Tool Schemas ────────────────────────────────────────────────────
//
// These are the tool definitions sent to the model on every agentic turn.
// Format: Anthropic tool-use spec — name, description, input_schema (JSON Schema).
// The dispatcher (below) maps tool names to local handler functions.
//
// Safety model:
//   - file_read, file_list, git_status, git_diff, git_log → read-only, no confirm
//   - file_write → diff preview + confirm before write lands
//   - shell_exec → allowlist runs silently; everything else confirms; danger list
//     requires typed confirmation
//   - git_add, git_commit, git_push → confirm; force-push to main blocked

const AGENT_TOOLS = [
  {
    name: 'file_read',
    description:
      'Read the contents of a file from the local filesystem. Use this when you need to see what is in a file before making decisions. Returns the file contents as text. Files larger than the byte limit are truncated.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file. ~ is expanded to the user home directory.',
        },
        max_bytes: {
          type: 'number',
          description: 'Optional limit on bytes to read. Default 50000.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'file_write',
    description:
      'Write content to a file on the local filesystem. The user will see a diff preview before the write actually happens. Use for creating new files or replacing the entire contents of an existing file. For partial edits, prefer reading the file, computing the new full content, and writing it.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file.',
        },
        content: {
          type: 'string',
          description: 'The full content to write to the file.',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'file_list',
    description:
      'List files and directories. Use to explore the filesystem before reading specific files. Hides hidden files and node_modules by default.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory to list. Defaults to current working directory.',
        },
        recursive: {
          type: 'boolean',
          description: 'If true, walk the tree recursively. Default false.',
        },
      },
    },
  },
  {
    name: 'shell_exec',
    description:
      'Execute a shell command in the user\'s terminal context. Safe read-only commands (ls, pwd, cat, git status, git diff, git log, etc.) run without confirmation. Write or destructive commands prompt the user before running. Truly dangerous commands (rm -rf, sudo, dd, mkfs) require typed confirmation. Returns stdout, stderr, and exit code.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute. Use single-line commands; chain with && or ; if needed.',
        },
        cwd: {
          type: 'string',
          description: 'Optional working directory for the command. Defaults to the user\'s current cwd.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'git_status',
    description:
      'Show the git status of a repository. Use to see modified, staged, and untracked files before deciding what to commit.',
    input_schema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Optional working directory. Defaults to current cwd.' },
      },
    },
  },
  {
    name: 'git_diff',
    description:
      'Show git diff. By default shows unstaged changes. Set staged=true to see what would be committed. Optionally limit to a specific path.',
    input_schema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Optional working directory.' },
        staged: { type: 'boolean', description: 'Show staged diff instead of unstaged. Default false.' },
        path: { type: 'string', description: 'Optional path to limit the diff to a specific file or directory.' },
      },
    },
  },
  {
    name: 'git_add',
    description:
      'Stage files for the next commit. Pass either a list of paths or ["."] to stage everything.',
    input_schema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of paths to stage. Use ["."] for all changes in the current directory.',
        },
        cwd: { type: 'string', description: 'Optional working directory.' },
      },
      required: ['paths'],
    },
  },
  {
    name: 'git_commit',
    description:
      'Create a commit with the staged changes. Always show the user the message before committing. Always prompts for confirmation. Use clear, conventional commit messages.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The commit message. Single subject line, optionally followed by a blank line and longer body.',
        },
        cwd: { type: 'string', description: 'Optional working directory.' },
      },
      required: ['message'],
    },
  },
  {
    name: 'git_push',
    description:
      'Push commits to the remote repository. Always prompts for confirmation. Refuses force-push to main without typed-out confirmation.',
    input_schema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Optional working directory.' },
        force: { type: 'boolean', description: 'Use git push --force. Requires extra confirmation. Default false.' },
        remote: { type: 'string', description: 'Remote name. Default "origin".' },
        branch: { type: 'string', description: 'Branch to push. Defaults to current branch.' },
      },
    },
  },
];

// ─── Safety: diff preview + confirmation prompts ─────────────────────────

// Shell allowlist — read-only commands that run without prompting
const SHELL_ALLOWLIST = [
  /^ls(\s|$)/, /^pwd$/, /^whoami$/, /^date$/, /^uname/, /^echo\s/,
  /^cat\s/, /^head\s/, /^tail\s/, /^wc\s/, /^file\s/,
  /^grep\s/, /^rg\s/, /^find\s/,
  /^git\s+(status|diff|log|branch|show|remote|config\s+--get|rev-parse)/,
  /^which\s/, /^type\s/, /^env$/, /^printenv$/,
  /^node\s+--version$/, /^npm\s+--version$/, /^npm\s+list/, /^npm\s+ls/,
];

// Hard danger list — commands that require typed confirmation (not just y)
const SHELL_DANGER_PATTERNS = [
  /\brm\s+-[a-z]*r[a-z]*f/, /\brm\s+-[a-z]*f[a-z]*r/, /\brm\s+--recursive/,
  /\bsudo\b/, /\bdoas\b/,
  /\bdd\s/, /\bmkfs/, /\bfdisk/, /\bparted/,
  /:\s*\(\)\s*\{\s*:\|/, // fork bomb
  />\s*\/dev\/sd[a-z]/, />\s*\/dev\/nvme/, />\s*\/dev\/disk/,
  /\bformat\s+[a-zA-Z]:/i,
  /\bgit\s+push\s+.*--force(-with-lease)?\s+.*main/,
  /\bgit\s+reset\s+--hard\s+(origin\/)?main/,
];

function isAllowlistedShell(cmd) {
  return SHELL_ALLOWLIST.some((re) => re.test(cmd.trim()));
}

function isDangerousShell(cmd) {
  return SHELL_DANGER_PATTERNS.some((re) => re.test(cmd));
}

// promptUser — fire a question + read a line. Reuses an existing readline
// if one is provided (interactive mode); otherwise creates a one-shot.
async function promptUser(question, expected = null) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      const a = (answer || '').trim();
      if (expected) resolve(a === expected);
      else resolve(a);
    });
  });
}

async function confirmYesNo(question, dangerLabel = false) {
  const tag = dangerLabel ? c.error('  [DANGER] ') : c.warning('  [confirm] ');
  const prompt = tag + question + c.dim(' [y/N]: ');
  const ans = await promptUser(prompt);
  return /^y(es)?$/i.test(ans);
}

async function confirmTyped(question, expected) {
  const prompt = c.error('  [DANGER] ') + question + c.dim(`\n  Type "${expected}" to confirm: `);
  return await promptUser(prompt, expected);
}

// renderUnifiedDiff — produce a colorized minimal unified diff between two
// strings. Not a full diff algorithm — line-level, good enough for review.
function renderUnifiedDiff(beforeText, afterText, label = 'file') {
  const before = (beforeText || '').split('\n');
  const after = (afterText || '').split('\n');
  const out = [];
  out.push(c.dim('  --- ' + label + ' (before)'));
  out.push(c.dim('  +++ ' + label + ' (after)'));
  const max = Math.max(before.length, after.length);
  let added = 0, removed = 0, unchanged = 0;
  for (let i = 0; i < max; i++) {
    const b = before[i];
    const a = after[i];
    if (b === a) {
      unchanged++;
      // Show 1 line of context around changes; skip otherwise
      const nextChange = (j) => before[j] !== after[j] && (before[j] !== undefined || after[j] !== undefined);
      const nearChange = nextChange(i - 1) || nextChange(i + 1);
      if (nearChange && b !== undefined) out.push(c.text('   ' + b));
    } else {
      if (b !== undefined) { out.push(c.error('  - ' + b)); removed++; }
      if (a !== undefined) { out.push(c.success('  + ' + a)); added++; }
    }
  }
  out.push(c.dim(`  [${added} added, ${removed} removed, ${unchanged} unchanged]`));
  return out.join('\n');
}

// ─── Tool Dispatcher ──────────────────────────────────────────────────────
//
// Takes a tool_use block from the model and routes it to the matching local
// handler. Returns a structured tool_result that the API consumes verbatim.

function expandPath(p) {
  if (!p) return p;
  if (p.startsWith('~')) return path.join(HOME, p.slice(1));
  return p;
}

function toolResult(toolUseId, content, isError = false) {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    ...(isError ? { is_error: true } : {}),
  };
}

const TOOL_HANDLERS = {
  file_read: ({ path: p, max_bytes }) => {
    const abs = expandPath(p);
    const resolved = path.resolve(abs);
    if (!existsSync(resolved)) return { ok: false, error: `File not found: ${p}` };
    try {
      const stats = statSync(resolved);
      if (stats.isDirectory()) return { ok: false, error: `Path is a directory, not a file: ${p}` };
      const limit = Math.max(1, Math.min(max_bytes || 50000, 500000));
      const buf = readFileSync(resolved);
      const truncated = buf.length > limit;
      const content = buf.slice(0, limit).toString('utf8');
      return {
        ok: true,
        path: resolved,
        bytes: buf.length,
        truncated,
        content: truncated ? content + `\n\n[truncated at ${limit} of ${buf.length} bytes]` : content,
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  file_write: async ({ path: p, content }) => {
    if (!p) return { ok: false, error: 'path required' };
    if (typeof content !== 'string') return { ok: false, error: 'content must be a string' };
    const abs = expandPath(p);
    const resolved = path.resolve(abs);
    const exists = existsSync(resolved);
    const before = exists ? readFileSync(resolved, 'utf8') : '';

    // Show diff before writing
    console.log('');
    console.log(c.brand('  ┌─ Proposed change'));
    console.log(c.brand('  │ ') + c.accent(resolved));
    console.log(c.brand('  │ ') + (exists ? c.dim('replacing existing file') : c.success('creating new file')));
    console.log(c.brand('  │'));
    if (exists) {
      console.log(renderUnifiedDiff(before, content, path.basename(resolved)));
    } else {
      console.log(c.dim('  --- (new file)'));
      content.split('\n').slice(0, 30).forEach((line) => console.log(c.success('  + ' + line)));
      if (content.split('\n').length > 30) console.log(c.dim(`  + ... (${content.split('\n').length - 30} more lines)`));
    }
    console.log('');

    const ok = await confirmYesNo(`Apply write to ${path.basename(resolved)}?`);
    if (!ok) return { ok: false, error: 'User declined write' };

    const result = writeFile(abs, content);
    if (result === true) {
      console.log(c.success(`  ✓ wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${resolved}`));
      return { ok: true, path: resolved, bytes: Buffer.byteLength(content, 'utf8') };
    }
    return { ok: false, error: typeof result === 'string' ? result : 'Unknown write error' };
  },

  file_list: ({ path: p, recursive }) => {
    const target = p ? expandPath(p) : '.';
    try {
      const files = listFiles(target, !!recursive);
      return { ok: true, path: path.resolve(target), count: files.length, files };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  shell_exec: async ({ command, cwd }) => {
    if (!command || !command.trim()) return { ok: false, error: 'command required' };
    const workDir = cwd ? expandPath(cwd) : process.cwd();

    // Tier the command: allowlist (silent) → dangerous (typed confirm) → unknown (y/n)
    if (isDangerousShell(command)) {
      console.log('');
      console.log(c.error('  ⚠ This command is on the danger list:'));
      console.log(c.text(`    $ ${command}`));
      console.log(c.dim(`    cwd: ${workDir}`));
      const ok = await confirmTyped(
        `Type "RUN IT" exactly to proceed. Anything else cancels.`,
        'RUN IT',
      );
      if (!ok) return { ok: false, error: 'User declined dangerous command' };
    } else if (!isAllowlistedShell(command)) {
      console.log('');
      console.log(c.warning(`  Command requires confirmation:`));
      console.log(c.text(`    $ ${command}`));
      console.log(c.dim(`    cwd: ${workDir}`));
      const ok = await confirmYesNo('Run it?');
      if (!ok) return { ok: false, error: 'User declined command' };
    } else {
      // Allowlisted — run silently with a one-line dim trace
      console.log(c.dim(`  $ ${command}`));
    }

    const result = runCommand(command, workDir);
    return {
      ok: result.success,
      command,
      cwd: workDir,
      stdout: result.output || '',
      stderr: result.error || '',
      exit_code: result.exitCode ?? (result.success ? 0 : 1),
    };
  },

  git_status: ({ cwd }) => {
    const workDir = cwd ? expandPath(cwd) : process.cwd();
    const result = runCommand('git status --porcelain=v1 --branch', workDir);
    return {
      ok: result.success,
      cwd: workDir,
      output: result.output || result.error || '',
    };
  },

  git_diff: ({ cwd, staged, path: p }) => {
    const workDir = cwd ? expandPath(cwd) : process.cwd();
    const flags = staged ? '--staged' : '';
    const target = p ? `-- ${JSON.stringify(p)}` : '';
    const result = runCommand(`git diff ${flags} ${target}`.trim(), workDir);
    return {
      ok: result.success,
      cwd: workDir,
      staged: !!staged,
      output: result.output || result.error || '',
    };
  },

  git_add: ({ paths, cwd }) => {
    const workDir = cwd ? expandPath(cwd) : process.cwd();
    const safePaths = (paths || []).map((p) => JSON.stringify(p)).join(' ');
    if (!safePaths) return { ok: false, error: 'paths array required' };
    const result = runCommand(`git add ${safePaths}`, workDir);
    return {
      ok: result.success,
      cwd: workDir,
      paths,
      output: result.output || result.error || '',
    };
  },

  git_commit: async ({ message, cwd }) => {
    const workDir = cwd ? expandPath(cwd) : process.cwd();
    if (!message || !message.trim()) return { ok: false, error: 'commit message required' };

    console.log('');
    console.log(c.brand('  ┌─ Proposed commit'));
    console.log(c.brand('  │ ') + c.dim(`cwd: ${workDir}`));
    console.log(c.brand('  │'));
    message.split('\n').forEach((line) => console.log(c.brand('  │ ') + c.text(line)));
    console.log('');

    const ok = await confirmYesNo('Create this commit?');
    if (!ok) return { ok: false, error: 'User declined commit' };

    try {
      execSync(`git commit -F -`, {
        cwd: workDir,
        input: message,
        encoding: 'utf8',
        timeout: 30000,
      });
      const head = runCommand('git log -1 --oneline', workDir);
      console.log(c.success(`  ✓ ${head.output || 'committed'}`));
      return { ok: true, cwd: workDir, head: head.output || '' };
    } catch (e) {
      return { ok: false, error: (e.stderr || e.stdout || e.message || '').trim() };
    }
  },

  git_push: async ({ cwd, force, remote, branch }) => {
    const workDir = cwd ? expandPath(cwd) : process.cwd();
    const r = remote || 'origin';
    const b = branch || (runCommand('git branch --show-current', workDir).output || '<current>');
    const f = force ? ' --force' : '';

    // Block force-push to main without typed confirm
    if (force && (b === 'main' || b === 'master')) {
      console.log('');
      console.log(c.error(`  ⚠ Force-pushing to ${b} can destroy upstream history.`));
      const ok = await confirmTyped(
        `Type "FORCE PUSH ${b.toUpperCase()}" exactly to proceed.`,
        `FORCE PUSH ${b.toUpperCase()}`,
      );
      if (!ok) return { ok: false, error: 'User declined force-push to protected branch' };
    } else {
      console.log('');
      console.log(c.warning(`  About to push:`));
      console.log(c.text(`    git push ${r} ${b}${f}`));
      console.log(c.dim(`    cwd: ${workDir}`));
      const ok = await confirmYesNo('Push?');
      if (!ok) return { ok: false, error: 'User declined push' };
    }

    const branchArg = branch ? ` ${JSON.stringify(branch)}` : '';
    const result = runCommand(`git push ${r}${branchArg}${f}`, workDir);
    return {
      ok: result.success,
      cwd: workDir,
      remote: r,
      branch: b,
      forced: !!force,
      output: result.output || result.error || '',
    };
  },
};

async function dispatchTool(toolUseBlock) {
  const { id, name, input } = toolUseBlock || {};
  if (!name || !TOOL_HANDLERS[name]) {
    return toolResult(id, `Unknown tool: ${name}`, true);
  }
  try {
    const handler = TOOL_HANDLERS[name];
    const result = await Promise.resolve(handler(input || {}));
    if (result && result.ok === false) {
      return toolResult(id, `Tool ${name} failed: ${result.error || 'unknown error'}`, true);
    }
    return toolResult(id, result);
  } catch (e) {
    return toolResult(id, `Tool ${name} threw: ${e.message}`, true);
  }
}

// ─── System Info ──────────────────────────────────────────────────────────

function getSystemInfo() {
  const info = {
    platform: platform(),
    hostname: hostname(),
    cpus: cpus().length,
    memory: `${Math.round(freemem() / 1024 / 1024)}MB free / ${Math.round(totalmem() / 1024 / 1024)}MB total`,
    node: process.version,
    cwd: process.cwd(),
  };

  try {
    info.shell = process.env.SHELL || 'unknown';
  } catch {}

  try {
    info.git = execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    info.branch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}

  return info;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Late hours. CORTEX is online. What do you need.";
  if (hour < 12) return "Morning. CORTEX is online and operational.";
  if (hour < 17) return "Afternoon. CORTEX standing by.";
  if (hour < 21) return "Evening. CORTEX is active. Ready when you are.";
  return "Late session. CORTEX is with you.";
}

// ─── Status ───────────────────────────────────────────────────────────────

function showStatus() {
  const info = getSystemInfo();
  const authToken = getAuthToken();
  const model = getModel();
  const serverUrl = getServerUrl();

  console.log(c.brand('  +---------------------------------------------+'));
  console.log(c.brand('  |') + c.brandBold('  SYSTEM STATUS                               ') + c.brand('|'));
  console.log(c.brand('  +---------------------------------------------+'));
  console.log(c.brand('  |') + `  ${c.accent('Platform')}:  ${c.text(info.platform)} (${info.hostname})` + c.brand(''));
  console.log(c.brand('  |') + `  ${c.accent('CPUs')}:      ${c.text(String(info.cpus))} cores`);
  console.log(c.brand('  |') + `  ${c.accent('Memory')}:    ${c.text(info.memory)}`);
  console.log(c.brand('  |') + `  ${c.accent('Node')}:      ${c.text(info.node)}`);
  console.log(c.brand('  |') + `  ${c.accent('CWD')}:       ${c.text(info.cwd)}`);

  if (info.branch) {
    console.log(c.brand('  |') + `  ${c.accent('Git')}:       ${c.text(info.branch)} (${info.git})`);
  }

  console.log(c.brand('  +---------------------------------------------+'));
  console.log(c.brand('  |') + `  ${c.accent('Server')}:    ${c.text(serverUrl)}`);
  console.log(c.brand('  |') + `  ${c.accent('Model')}:     ${c.text(model)}`);
  console.log(c.brand('  |') + `  ${c.accent('Auth')}:      ${authToken ? c.success('connected') : c.error('NOT SET — run: cortex --setup')}`);
  console.log(c.brand('  +---------------------------------------------+'));
  console.log('');
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────

async function setup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('');
  console.log(c.brandBold('  CORTEX SIGNAL ZERO — Setup'));
  console.log(c.dim('  ─────────────────────────────'));
  console.log('');

  const config = loadConfig();

  // Server connection
  console.log(c.accent('  Connect to CORTEX:'));
  console.log(c.text('  1. cortexnode.ai (cloud — recommended)'));
  console.log(c.text('  2. Local server (development)'));
  console.log('');

  const serverChoice = await ask(c.brand('  Choice [1]: '));
  if (serverChoice === '2') {
    config.dev = true;
    console.log(c.dim(`  Using local server: ${CORTEX_DEV_URL}`));
  } else {
    config.dev = false;
    config.serverUrl = CORTEX_API_URL;
    console.log(c.dim(`  Using: ${CORTEX_API_URL}`));
  }

  console.log('');

  // Auth token
  console.log(c.accent('  Enter your CORTEX access token:'));
  console.log(c.dim('  (Get yours at cortexnode.ai/signup)'));
  console.log('');
  const token = await ask(c.brand('  Access Token: '));
  if (token.trim()) config.authToken = token.trim();

  console.log('');

  // Model selection
  console.log(c.accent('  Select intelligence tier:'));
  console.log(c.text('  1. CORTEX Standard (fast, balanced — recommended)'));
  console.log(c.text('  2. CORTEX Advanced (maximum intelligence)'));
  console.log(c.text('  3. CORTEX Lite (fastest, high volume)'));
  console.log('');
  const modelChoice = await ask(c.brand('  Choice [1]: '));
  if (modelChoice === '2') config.model = 'cortex-advanced';
  else if (modelChoice === '3') config.model = 'cortex-lite';
  else config.model = 'cortex-standard';

  console.log('');

  // Voice setup
  console.log(c.accent('  Enable CORTEX voice?'));
  console.log(c.text('  1. Yes — CORTEX speaks responses aloud'));
  console.log(c.text('  2. No — text only'));
  console.log('');
  const voiceChoice = await ask(c.brand('  Choice [1]: '));
  if (voiceChoice !== '2') {
    console.log(c.dim('  Enter your CORTEX voice key:'));
    console.log(c.dim('  (Provided when you activated CORTEX voice synthesis)'));
    const elKey = await ask(c.brand('  Voice key: '));
    if (elKey.trim()) {
      config.voiceKey = elKey.trim();
      console.log(c.success('  Voice enabled.'));
    }
  }

  saveConfig(config);

  console.log('');
  console.log(c.success('  CORTEX is configured.'));
  console.log(c.dim(`  Config saved to: ${CONFIG_FILE}`));
  console.log(c.text('  Run "cortex" to start.'));
  console.log('');

  rl.close();
}

// ─── Context Builder ──────────────────────────────────────────────────────

function buildContext() {
  const cwd = process.cwd();
  let context = `Working directory: ${cwd}\n`;

  // Detect project type
  if (existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      context += `Project: ${pkg.name || 'unknown'} (Node.js)\n`;
    } catch {}
  } else if (existsSync(path.join(cwd, 'Cargo.toml'))) {
    context += 'Project: Rust (Cargo)\n';
  } else if (existsSync(path.join(cwd, 'go.mod'))) {
    context += 'Project: Go\n';
  } else if (existsSync(path.join(cwd, 'requirements.txt')) || existsSync(path.join(cwd, 'pyproject.toml'))) {
    context += 'Project: Python\n';
  }

  // Git info
  try {
    const branch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8' }).trim();
    const status = execSync('git status --short 2>/dev/null', { encoding: 'utf8' }).trim();
    if (branch) context += `Git branch: ${branch}\n`;
    if (status) context += `Git status:\n${status}\n`;
  } catch {}

  return context;
}

// ─── Conversation History ──────────────────────────────────────────────────

let conversationMessages = [];

function addMessage(role, content) {
  conversationMessages.push({ role, content });
  // Keep context manageable — last 20 exchanges
  if (conversationMessages.length > 40) {
    conversationMessages = conversationMessages.slice(-40);
  }
}

// ─── Command Handling ─────────────────────────────────────────────────────

async function handleCommand(input, rl) {
  const trimmed = input.trim();
  const cmd = trimmed.toLowerCase();

  if (!trimmed) return;

  // Built-in commands
  if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') {
    console.log('');
    console.log(c.brand('  CORTEX signing off.'));
    console.log('');
    process.exit(0);
  }

  if (cmd === 'help' || cmd === 'h' || cmd === '?') {
    showHelp();
    return;
  }

  if (cmd === 'status' || cmd === 'sys') {
    showStatus();
    return;
  }

  if (cmd === 'clear' || cmd === 'cls') {
    console.clear();
    renderCompactHeader();
    return;
  }

  if (cmd === 'logo') {
    renderLogo();
    renderTitle();
    return;
  }

  if (cmd === 'ls' || cmd.startsWith('ls ')) {
    const dir = trimmed.slice(2).trim() || '.';
    const files = listFiles(dir);
    files.forEach(f => {
      if (f.endsWith('/')) console.log(c.accent('  ' + f));
      else console.log(c.text('  ' + f));
    });
    return;
  }

  if (cmd === 'tree') {
    const files = listFiles('.', true);
    files.slice(0, 100).forEach(f => {
      if (f.endsWith('/')) console.log(c.accent('  ' + f));
      else console.log(c.text('  ' + f));
    });
    if (files.length > 100) console.log(c.dim(`  ... and ${files.length - 100} more`));
    return;
  }

  if (cmd.startsWith('cat ') || cmd.startsWith('read ')) {
    const filePath = trimmed.replace(/^(cat|read)\s+/, '');
    const content = readFile(filePath);
    if (content === null) {
      console.log(c.error(`  File not found: ${filePath}`));
    } else {
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        console.log(c.dim(`  ${String(i + 1).padStart(4)} `) + c.text(line));
      });
    }
    return;
  }

  if (cmd.startsWith('run ') || cmd.startsWith('! ') || cmd.startsWith('$')) {
    const shellCmd = trimmed.replace(/^(run\s+|!\s*|\$\s*)/, '');
    console.log(c.dim(`  > ${shellCmd}`));
    const result = runCommand(shellCmd);
    if (result.output) console.log(c.text('  ' + result.output.split('\n').join('\n  ')));
    if (!result.success && result.error) console.log(c.error('  ' + result.error));
    return;
  }

  if (cmd === 'model') {
    console.log(c.accent(`  Provider: ${getProvider()}`));
    console.log(c.accent(`  Model:    ${getModel()}`));
    return;
  }

  if (cmd.startsWith('model ')) {
    const newModel = trimmed.slice(6).trim();
    const config = loadConfig();
    config.model = newModel;
    saveConfig(config);
    console.log(c.success(`  Model set to: ${newModel}`));
    return;
  }

  if (cmd === 'reset') {
    conversationMessages = [];
    console.log(c.success('  Conversation reset.'));
    return;
  }

  if (cmd === 'context') {
    console.log(c.text(buildContext()));
    return;
  }

  if (cmd === 'agent' || cmd === 'agent status') {
    const on = isAgentModeOn();
    console.log(c.accent(`  Agent mode: ${on ? c.success('ON') : c.warning('OFF')}`));
    if (on) {
      console.log(c.dim('  CORTEX can read/write files, run shell, use git.'));
      console.log(c.dim('  Writes and destructive operations always prompt for confirmation.'));
    } else {
      console.log(c.dim('  Chat-only. Run "agent on" to enable tool use.'));
    }
    return;
  }

  if (cmd === 'agent on') {
    const config = loadConfig();
    config.agentMode = true;
    saveConfig(config);
    console.log(c.success('  Agent mode enabled.'));
    console.log(c.dim('  CORTEX can now read/write files, run shell, and use git.'));
    console.log(c.dim('  Writes and destructive operations always prompt before running.'));
    return;
  }

  if (cmd === 'agent off') {
    const config = loadConfig();
    config.agentMode = false;
    saveConfig(config);
    console.log(c.warning('  Agent mode disabled. Chat-only.'));
    return;
  }

  // Everything else goes to the AI
  await chat(trimmed);
}

// ─── Chat with AI ─────────────────────────────────────────────────────────

const MAX_AGENT_LOOP_ITERATIONS = 8;

function isAgentModeOn() {
  const config = loadConfig();
  return config.agentMode === true || process.env.CORTEX_AGENT === '1';
}

// agentLoop — runs the model in agent mode. Sends messages with tools,
// dispatches any tool_use blocks the model returns, appends tool_results,
// and loops until the model stops requesting tools (or we hit the cap).
//
// Returns the final assistant text for voice playback / history.
async function agentLoop(messages) {
  let iteration = 0;
  let finalText = '';

  while (iteration < MAX_AGENT_LOOP_ITERATIONS) {
    iteration++;

    const result = await streamResponse(messages, { tools: AGENT_TOOLS });
    if (result.text) finalText = result.text;

    // No tools requested? We're done.
    if (!result.toolUses || result.toolUses.length === 0) {
      return finalText;
    }

    // The assistant message must include both text (if any) and tool_use blocks
    // for Anthropic to accept the subsequent tool_result message.
    const assistantContent = [];
    if (result.text) assistantContent.push({ type: 'text', text: result.text });
    for (const tu of result.toolUses) {
      assistantContent.push({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input });
    }
    messages.push({ role: 'assistant', content: assistantContent });

    // Execute each tool_use, gather tool_result blocks
    const toolResults = [];
    for (const tu of result.toolUses) {
      console.log(c.dim(`  > executing ${tu.name}...`));
      const tr = await dispatchTool(tu);
      toolResults.push(tr);
    }

    // Send tool_results back as a new user message and let the model continue
    messages.push({ role: 'user', content: toolResults });

    // Soft progress signal so user knows another turn is coming
    console.log(c.dim(`  [agent loop · iter ${iteration} done · ${result.toolUses.length} tool${result.toolUses.length > 1 ? 's' : ''} run]`));

    // Debug trace (env-gated) so we can inspect message structure when troubleshooting
    if (process.env.CORTEX_DEBUG === '1') {
      console.log(c.dim('  --- DEBUG: outgoing messages for next turn ---'));
      console.log(c.dim(JSON.stringify(messages, null, 2).slice(0, 4000)));
      console.log(c.dim('  --- end debug ---'));
    }
    console.log('');
  }

  console.log(c.warning(`  [agent loop hit max iterations (${MAX_AGENT_LOOP_ITERATIONS}) — stopping]`));
  return finalText;
}

async function chat(input) {
  // Build user message with file context if referencing files
  let userContent = input;

  // Auto-attach file contents if user references a file path
  const filePatterns = input.match(/(?:^|\s)(\.\/[\w\/\.\-]+|[\w\/\.\-]+\.\w{1,10})(?:\s|$)/g);
  if (filePatterns) {
    for (const match of filePatterns) {
      const filePath = match.trim();
      if (existsSync(path.resolve(filePath))) {
        const content = readFile(filePath);
        if (content && content.length < 50000) {
          userContent += `\n\n--- File: ${filePath} ---\n${content}\n--- End File ---`;
        }
      }
    }
  }

  // Add project context on first message
  if (conversationMessages.length === 0) {
    userContent = `[Project Context]\n${buildContext()}\n[User Message]\n${userContent}`;
  }

  addMessage('user', userContent);

  console.log('');
  console.log(c.brand('  CORTEX') + c.dim(' >'));
  console.log('');

  try {
    let finalText;
    if (isAgentModeOn()) {
      finalText = await agentLoop(conversationMessages);
    } else {
      const result = await streamResponse(conversationMessages);
      finalText = result.text;
      // Persist a clean assistant message in non-agent mode
      addMessage('assistant', finalText);
    }
    console.log('');
    // Speak the final response (non-blocking)
    if (finalText) speakResponse(finalText);
  } catch (e) {
    console.log(c.error(`  Error: ${e.message}`));
    console.log('');
    // Roll back the user message we just added so the conversation history
    // doesn't end on an unanswered turn.
    conversationMessages.pop();
  }
}

// ─── Help ─────────────────────────────────────────────────────────────────

function showHelp() {
  const agentOn = isAgentModeOn();
  console.log('');
  console.log(c.brand('  +---------------------------------------------+'));
  console.log(c.brand('  |') + c.brandBold('  COMMANDS                                    ') + c.brand('|'));
  console.log(c.brand('  +---------------------------------------------+'));
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + `  ${c.accent('help')}            Show this menu`);
  console.log(c.brand('  |') + `  ${c.accent('status')}          System + config info`);
  console.log(c.brand('  |') + `  ${c.accent('model')}           Show current model`);
  console.log(c.brand('  |') + `  ${c.accent('model <name>')}    Switch AI model`);
  console.log(c.brand('  |') + `  ${c.accent('reset')}           Clear conversation`);
  console.log(c.brand('  |') + `  ${c.accent('context')}         Show project context`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Local file commands (you, not the agent)'));
  console.log(c.brand('  |') + `  ${c.accent('ls [dir]')}        List files`);
  console.log(c.brand('  |') + `  ${c.accent('tree')}            Project file tree`);
  console.log(c.brand('  |') + `  ${c.accent('cat <file>')}      Read a file`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Shell (you, not the agent)'));
  console.log(c.brand('  |') + `  ${c.accent('run <cmd>')}       Execute shell command`);
  console.log(c.brand('  |') + `  ${c.accent('! <cmd>')}         Execute shell command`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Agent mode'));
  console.log(c.brand('  |') + `  ${c.accent('agent')}           Show agent mode status`);
  console.log(c.brand('  |') + `  ${c.accent('agent on')}        Enable agent mode (CORTEX uses tools)`);
  console.log(c.brand('  |') + `  ${c.accent('agent off')}       Disable agent mode (chat only)`);
  console.log(c.brand('  |') + `  Currently: ${agentOn ? c.success('ON') : c.warning('OFF')}`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Interface'));
  console.log(c.brand('  |') + `  ${c.accent('logo')}            Show CORTEX logo`);
  console.log(c.brand('  |') + `  ${c.accent('clear')}           Clear screen`);
  console.log(c.brand('  |') + `  ${c.accent('exit')}            Sign off`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Anything else is sent to CORTEX.'));
  console.log(c.brand('  |') + c.dim('  In agent mode, CORTEX can read/write files, run shell, use git'));
  console.log(c.brand('  |') + c.dim('  Writes and destructive ops always confirm before running.'));
  console.log(c.brand('  |'));
  console.log(c.brand('  +---------------------------------------------+'));
}

// ─── Interactive REPL ─────────────────────────────────────────────────────

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: c.brand('  * ') + c.accent('CORTEX') + c.brand(' > '),
  });

  console.log(c.dim('  Type a command or question. "help" for commands. "exit" to quit.'));
  console.log('');

  rl.prompt();

  // Serialize line handlers so a fast-typed or pasted multi-line submission
  // can't fire two concurrent handleCommand() invocations whose streamed
  // output would interleave on the terminal. Each new line waits for the
  // previous one to fully resolve before running.
  let processing = Promise.resolve();
  rl.on('line', (input) => {
    processing = processing.then(async () => {
      rl.pause();
      try {
        await handleCommand(input, rl);
      } catch (e) {
        console.log(c.error(`  Error: ${e.message}`));
      }
      console.log('');
      rl.resume();
      rl.prompt();
    });
  });

  rl.on('close', () => {
    console.log('');
    console.log(c.brand('  CORTEX signing off.'));
    process.exit(0);
  });
}

// ─── CLI Entry ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Setup mode
  if (args.includes('--setup') || args.includes('setup')) {
    renderCompactHeader();
    await setup();
    process.exit(0);
  }

  // Version
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`cortex-signal-zero v${VERSION}`);
    process.exit(0);
  }

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    renderCompactHeader();
    showHelp();
    process.exit(0);
  }

  // Status
  if (args.includes('--status')) {
    renderCompactHeader();
    showStatus();
    process.exit(0);
  }

  // Quick question mode (non-interactive)
  const nonFlagArgs = args.filter(a => !a.startsWith('-'));
  if (nonFlagArgs.length > 0) {
    renderCompactHeader();

    const authToken = getAuthToken();
    if (!authToken) {
      console.log(c.error('  Not authenticated.'));
      console.log(c.dim('  Run: cortex --setup'));
      process.exit(1);
    }

    await chat(nonFlagArgs.join(' '));
    process.exit(0);
  }

  // Full interactive mode
  console.clear();
  renderLogo();
  renderTitle();

  const greeting = getGreeting();
  console.log(c.brand('  CORTEX') + c.dim(' > ') + c.text(greeting));
  console.log('');

  const authToken = getAuthToken();
  if (!authToken) {
    console.log(c.warning('  Not authenticated. Run "cortex --setup" to connect.'));
    console.log('');
  }

  showStatus();
  await interactiveMode();
}

main().catch(err => {
  console.error(c.error('Fatal: ') + err.message);
  process.exit(1);
});
