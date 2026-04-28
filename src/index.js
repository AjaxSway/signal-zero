#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════
//  C O R T E X   S I G N A L   Z E R O
//  AI Terminal Intelligence
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
const VERSION = '0.1.0';

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
  console.log(signalGradient('   ||') + c.dim('              AI Terminal Intelligence                ') + signalGradient('||'));
  console.log(signalGradient('   ||') + '                                                 ' + signalGradient('||'));
  console.log(signalGradient('   ====================================================='));
  console.log('');
}

function renderCompactHeader() {
  console.log('');
  console.log(c.brandBold('  CORTEX SIGNAL ZERO') + c.dim(` v${VERSION}`));
  console.log(c.dim('  AI Terminal Intelligence'));
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

async function streamResponse(messages) {
  const serverUrl = getServerUrl();
  const authToken = getAuthToken();
  const model = getModel();

  if (!authToken) {
    throw new Error('Not authenticated. Run: cortex --setup');
  }

  const res = await fetch(`${serverUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: getSystemPromptWithProfile(),
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CORTEX API error ${res.status}: ${err}`);
  }

  // Check if streaming SSE or JSON
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    let fullText = '';
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            process.stdout.write(c.text(event.delta.text));
            fullText += event.delta.text;
          }
        } catch {}
      }
    }

    console.log('');
    return fullText;
  }

  // Non-streaming JSON response
  const data = await res.json();
  const text = data.content || '';
  process.stdout.write(c.text(text));
  console.log('');
  return text;
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

function runCommand(cmd) {
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      cwd: process.cwd(),
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

  // Everything else goes to the AI
  await chat(trimmed);
}

// ─── Chat with AI ─────────────────────────────────────────────────────────

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
    const response = await streamResponse(conversationMessages);
    addMessage('assistant', response);
    console.log('');
    // Speak the response (non-blocking)
    speakResponse(response);
  } catch (e) {
    console.log(c.error(`  Error: ${e.message}`));
    console.log('');
    // Remove failed message
    conversationMessages.pop();
  }
}

// ─── Help ─────────────────────────────────────────────────────────────────

function showHelp() {
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
  console.log(c.brand('  |') + c.dim('  File Operations'));
  console.log(c.brand('  |') + `  ${c.accent('ls [dir]')}        List files`);
  console.log(c.brand('  |') + `  ${c.accent('tree')}            Project file tree`);
  console.log(c.brand('  |') + `  ${c.accent('cat <file>')}      Read a file`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Shell'));
  console.log(c.brand('  |') + `  ${c.accent('run <cmd>')}       Execute shell command`);
  console.log(c.brand('  |') + `  ${c.accent('! <cmd>')}         Execute shell command`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Interface'));
  console.log(c.brand('  |') + `  ${c.accent('logo')}            Show Signal Zero logo`);
  console.log(c.brand('  |') + `  ${c.accent('clear')}           Clear screen`);
  console.log(c.brand('  |') + `  ${c.accent('exit')}            Sign off`);
  console.log(c.brand('  |'));
  console.log(c.brand('  |') + c.dim('  Anything else is sent to CORTEX.'));
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

  rl.on('line', async (input) => {
    // Disable prompt during processing
    rl.pause();

    await handleCommand(input, rl);

    console.log('');
    rl.resume();
    rl.prompt();
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
