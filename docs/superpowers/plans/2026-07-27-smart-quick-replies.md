# SillyTavern Smart Quick Replies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build and verify a no-build SillyTavern third-party extension that generates four short user reply suggestions through Anthropic-compatible, OpenAI-compatible, or LM Studio APIs and exposes them in a draggable floating panel.

**Architecture:** Keep the browser entry point in index.js, with pure exported helpers for defaults, URL normalization, prompt expansion, context construction, compression, request building, response parsing, and position clamping. The browser layer owns the floating panel and event lifecycle. settings.html supplies the native settings drawer and style.css supplies theme-aware styling. There are no runtime dependencies.

**Tech Stack:** Native ES modules, browser DOM APIs, SillyTavern extension APIs, fetch, Node.js built-in node:test, and Git.

## Global Constraints

- Direct installation path: public/scripts/extensions/third-party/smart-quick-replies/.
- Do not modify SillyTavern core files or alter the main AI generation flow.
- Support Anthropic Messages, OpenAI Chat Completions, and LM Studio through its OpenAI-compatible path.
- Prefer SillyTavern Secrets for API Keys; use local storage only as a clearly marked fallback.
- Defaults: 20 history messages, compression enabled, 3000 rough-token threshold, 80 max output tokens, temperature 0.9.
- Accept a result only when it contains exactly 4 distinct non-empty strings.
- Requests are non-streaming, cancelable, and limited by a 30-second timeout.
- Tests use Node.js built-in test runner with no external runtime dependencies.
- Never log or display API Keys.

## File Map

- smart-quick-replies/manifest.json — extension manifest.
- smart-quick-replies/index.js — pure helpers, API adapters, settings wiring, panel, and bootstrap.
- smart-quick-replies/style.css — panel, toolbar, settings tabs, loading/error states, and theme styling.
- smart-quick-replies/settings.html — five requested settings sections.
- smart-quick-replies/README.md — installation, configuration, security, and troubleshooting.
- smart-quick-replies/package.json — type module and node --test tests/*.test.js.
- smart-quick-replies/tests/settings.test.js — defaults, merge, migration, position, and lifecycle helpers.
- smart-quick-replies/tests/parsing.test.js — macros, URL handling, and candidate parsing.
- smart-quick-replies/tests/context.test.js — history, interrupted turns, and compression.
- smart-quick-replies/tests/api.test.js — request builders, model lists, and response parsing.

---

### Task 1: Create the test harness and settings contract

**Files:**
- Create: smart-quick-replies/package.json
- Create: smart-quick-replies/tests/settings.test.js
- Modify: smart-quick-replies/index.js

**Interfaces:** Export DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, mergeSettings(saved), migrateSettings(saved), clampPosition(position, viewport, panelSize, margin), and getDefaultPanelPosition(inputRect, panelSize, viewport, margin). mergeSettings returns a fresh object and never mutates its input.

- [ ] **Step 1: Write the failing tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, mergeSettings, migrateSettings, clampPosition, getDefaultPanelPosition } from '../index.js';

test('defaults use automatic trigger, 20 messages, compression, and four candidates', () => {
  assert.equal(DEFAULT_SETTINGS.triggerMode, 'auto');
  assert.equal(DEFAULT_SETTINGS.historyLimit, 20);
  assert.equal(DEFAULT_SETTINGS.compression.enabled, true);
  assert.equal(DEFAULT_SETTINGS.compression.threshold, 3000);
  assert.equal(DEFAULT_SETTINGS.api.maxTokens, 80);
  assert.match(DEFAULT_SYSTEM_PROMPT, /generate 4 distinct, short/);
});

test('mergeSettings fills missing nested values without mutation', () => {
  const saved = { api: { model: 'local-model' } };
  const merged = mergeSettings(saved);
  assert.equal(merged.api.model, 'local-model');
  assert.equal(merged.api.temperature, 0.9);
  assert.equal(merged.historyLimit, 20);
  assert.deepEqual(saved, { api: { model: 'local-model' } });
});

test('migrateSettings maps legacy values', () => {
  const migrated = migrateSettings({ historyCount: 8, autoOnInterrupt: false, prompt: 'custom' });
  assert.equal(migrated.historyLimit, 8);
  assert.equal(migrated.interruptedAutoGenerate, false);
  assert.equal(migrated.systemPrompt, 'custom');
});

test('panel position clamps to the viewport', () => {
  assert.deepEqual(clampPosition({ left: -10, top: 900 }, { width: 1000, height: 800 }, { width: 300, height: 120 }, 8), { left: 8, top: 672 });
});

test('default panel position is directly above the input', () => {
  assert.deepEqual(getDefaultPanelPosition({ left: 100, top: 700, width: 600, height: 80 }, { width: 600, height: 120 }, { width: 1000, height: 800 }, 8), { left: 100, top: 572 });
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/settings.test.js

Expected: FAIL because index.js and the exports do not exist yet.

- [ ] **Step 3: Implement the minimal settings contract**

Add defaults for trigger, dismiss behavior, history, prompt, API, compression, appearance, and position. Implement recursive plain-object merge, legacy migration, and viewport-safe coordinate helpers.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/settings.test.js

Expected: PASS with 5 tests and 0 failures.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/package.json smart-quick-replies/index.js smart-quick-replies/tests/settings.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "test: define smart quick replies settings contract"
~~~

### Task 2: Implement prompt macros, URL handling, and candidate parsing

**Files:**
- Create: smart-quick-replies/tests/parsing.test.js
- Modify: smart-quick-replies/index.js

**Interfaces:** Export detectApiType(url, selectedType, autoDetect), normalizeEndpoint(url, apiType, kind), expandPrompt(template, values), extractCandidateText(response, apiType), and parseCandidateArray(text). The parser returns four unique strings or throws InvalidCandidateError.

- [ ] **Step 1: Write the failing tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectApiType, normalizeEndpoint, expandPrompt, parseCandidateArray } from '../index.js';

test('auto detection recognizes Anthropic and LM Studio', () => {
  assert.equal(detectApiType('https://api.anthropic.com/v1', 'openai', true), 'anthropic');
  assert.equal(detectApiType('http://localhost:1234/v1', 'openai', true), 'lmstudio');
  assert.equal(detectApiType('https://gateway.example/v1', 'anthropic', false), 'anthropic');
});

test('endpoint normalization handles base, v1, and full endpoint URLs', () => {
  assert.equal(normalizeEndpoint('http://localhost:1234', 'openai', 'completion'), 'http://localhost:1234/v1/chat/completions');
  assert.equal(normalizeEndpoint('http://localhost:1234/v1', 'lmstudio', 'models'), 'http://localhost:1234/v1/models');
  assert.equal(normalizeEndpoint('https://api.anthropic.com/v1/messages', 'anthropic', 'completion'), 'https://api.anthropic.com/v1/messages');
});

test('prompt expansion replaces all supported macros', () => {
  assert.equal(expandPrompt('{{char}}/{{user}}/{{char_description}}/{{history}}', { char: 'Mira', user: 'Amo', charDescription: 'calm', history: 'Mira: Hello' }), 'Mira/Amo/calm/Mira: Hello');
});

test('candidate parser removes fences and rejects duplicates or wrong counts', () => {
  assert.deepEqual(parseCandidateArray('~~~json\n["a","b","c","d"]\n~~~'), ['a', 'b', 'c', 'd']);
  assert.throws(() => parseCandidateArray('["a","a","b","c"]'), /four distinct/);
  assert.throws(() => parseCandidateArray('["a","b"]'), /four distinct/);
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/parsing.test.js

Expected: FAIL because these exports are missing.

- [ ] **Step 3: Implement the pure helpers**

Normalize trailing slashes and append only missing provider suffixes. Detect Anthropic from anthropic or /messages, LM Studio from lmstudio, localhost:1234, or /api/v1, otherwise OpenAI. Remove code fences, extract the first balanced JSON array, trim strings, and enforce four distinct items.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/parsing.test.js

Expected: PASS with 4 tests and 0 failures.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/index.js smart-quick-replies/tests/parsing.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: add prompt and candidate parsing helpers"
~~~

### Task 3: Implement context construction and compression

**Files:**
- Create: smart-quick-replies/tests/context.test.js
- Modify: smart-quick-replies/index.js

**Interfaces:** Export mapChatMessage(message, names), buildHistory(chat, options), formatHistoryText(messages), estimateTokens(text), compressHistory(history, options, summarize), and buildPromptMessages(systemPrompt, history, values).

- [ ] **Step 1: Write the failing tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHistory, formatHistoryText, estimateTokens, compressHistory, buildPromptMessages } from '../index.js';

const chat = [
  { name: 'Mira', is_user: false, mes: 'Old answer' },
  { name: 'Amo', is_user: true, mes: 'Current question' },
  { name: 'Mira', is_user: false, mes: 'Partial answer' },
];

test('history maps user and assistant roles and keeps the limit', () => {
  const result = buildHistory(chat, { limit: 2, interrupted: false, charName: 'Mira', userName: 'Amo' });
  assert.deepEqual(result.messages.map(message => message.role), ['user', 'assistant']);
  assert.equal(result.messages[0].content, 'Current question');
});

test('interrupted history drops incomplete AI and preceding user message', () => {
  const result = buildHistory(chat, { limit: 20, interrupted: true, charName: 'Mira', userName: 'Amo' });
  assert.deepEqual(result.messages.map(message => message.content), ['Old answer']);
  assert.equal(result.interrupted, true);
});

test('formatting and rough token estimate are deterministic', () => {
  assert.equal(formatHistoryText([{ name: 'Mira', content: 'Hello' }]), 'Mira: Hello');
  assert.equal(estimateTokens('12345678'), 2);
});

test('sliding-window compression keeps newest messages', async () => {
  const history = { messages: [{ content: '1' }, { content: '2' }, { content: '3' }], estimatedTokens: 100 };
  const result = await compressHistory(history, { enabled: true, strategy: 'window', preserveRecent: 2, threshold: 10 }, async () => 'unused');
  assert.deepEqual(result.messages.map(message => message.content), ['2', '3']);
});

test('history placeholder avoids duplicate message arrays', () => {
  const result = buildPromptMessages('Reply using this history: {{history}}', { messages: [{ name: 'Mira', role: 'assistant', content: 'Hi' }] }, { history: 'Mira: Hi' });
  assert.match(result.system, /Mira: Hi/);
  assert.deepEqual(result.messages, []);
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/context.test.js

Expected: FAIL because context exports are missing.

- [ ] **Step 3: Implement context and compression**

Map is_user to user and all other messages to assistant, preserve names, trim empty messages, and keep the newest configured count. In interrupted mode remove the last assistant and then a directly preceding user message. Implement window, no-compression, and auto-summary strategies; summary failure returns the window fallback with summaryFallback true.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/context.test.js

Expected: PASS with 5 tests and 0 failures.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/index.js smart-quick-replies/tests/context.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: build chat context and compression"
~~~

### Task 4: Implement provider adapters and model discovery

**Files:**
- Create: smart-quick-replies/tests/api.test.js
- Modify: smart-quick-replies/index.js

**Interfaces:** Export buildCompletionRequest(config, promptData, signal), buildModelsRequest(config), parseProviderResponse(payload, apiType), parseModelList(payload), requestCompletion(config, promptData, dependencies), and requestModels(config, dependencies).

- [ ] **Step 1: Write the failing tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompletionRequest, buildModelsRequest, parseProviderResponse, parseModelList } from '../index.js';

test('OpenAI request uses system messages and bearer authentication', () => {
  const request = buildCompletionRequest({ type: 'openai', url: 'http://localhost:1234', key: 'secret', model: 'local', temperature: 0.9, maxTokens: 80, topP: 0.95 }, { system: 'system', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(request.url, 'http://localhost:1234/v1/chat/completions');
  assert.equal(request.init.headers.Authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.init.body).messages, [{ role: 'system', content: 'system' }, { role: 'user', content: 'hi' }]);
});

test('Anthropic request uses top-level system and x-api-key', () => {
  const request = buildCompletionRequest({ type: 'anthropic', url: 'https://gateway.example/v1', key: 'secret', model: 'claude', temperature: 0.9, maxTokens: 80, topP: 0.95 }, { system: 'system', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(request.url, 'https://gateway.example/v1/messages');
  assert.equal(request.init.headers['x-api-key'], 'secret');
  const body = JSON.parse(request.init.body);
  assert.equal(body.system, 'system');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'hi' }]);
});

test('response and model list parsers support common provider shapes', () => {
  assert.equal(parseProviderResponse({ choices: [{ message: { content: '["a","b","c","d"]' } }] }, 'openai'), '["a","b","c","d"]');
  assert.equal(parseProviderResponse({ content: [{ type: 'text', text: '["a","b","c","d"]' }] }, 'anthropic'), '["a","b","c","d"]');
  assert.deepEqual(parseModelList({ data: [{ id: 'z' }, { id: 'a' }] }), ['a', 'z']);
  assert.deepEqual(parseModelList({ models: [{ name: 'b' }, { model: 'a' }] }), ['a', 'b']);
});

test('LM Studio model discovery includes the API v1 fallback', () => {
  const request = buildModelsRequest({ type: 'lmstudio', url: 'http://localhost:1234', key: '' });
  assert.deepEqual(request.fallbackUrls, ['http://localhost:1234/api/v1/models']);
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/api.test.js

Expected: FAIL because provider helpers are missing.

- [ ] **Step 3: Implement provider request and response helpers**

Use non-streaming JSON requests. OpenAI and LM Studio send Authorization: Bearer only when a key exists; Anthropic sends x-api-key and anthropic-version: 2023-06-01. Add Content-Type, AbortSignal, and timeout cancellation in requestCompletion. Never include the key in thrown errors. Try /v1/models first and LM Studio /api/v1/models second; an Anthropic model-list failure remains visible.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/api.test.js

Expected: PASS with 4 tests and 0 failures.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/index.js smart-quick-replies/tests/api.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: add provider adapters and model discovery"
~~~

### Task 5: Add settings markup and theme-aware styling

**Files:**
- Create: smart-quick-replies/settings.html
- Create: smart-quick-replies/style.css
- Modify: smart-quick-replies/index.js
- Modify: smart-quick-replies/tests/settings.test.js

**Interfaces:** Export renderSettings(container, settings, handlers) and getInputElement(root, settingPath). Bind controls with data-sqr-setting and call handlers.save, handlers.fetchModels, handlers.resetPosition, and handlers.resetPrompt.

- [ ] **Step 1: Write the failing structure test**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('settings markup contains all required sections and controls', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  for (const id of ['sqr-general', 'sqr-api', 'sqr-prompt', 'sqr-context', 'sqr-appearance', 'sqr-trigger-mode', 'sqr-api-type', 'sqr-api-url', 'sqr-api-key', 'sqr-model', 'sqr-fetch-models', 'sqr-system-prompt', 'sqr-reset-prompt', 'sqr-reset-position', 'sqr-history-limit', 'sqr-compression-strategy']) {
    assert.match(html, new RegExp('id=[\"\\']' + id + '[\"\\']'));
  }
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/settings.test.js

Expected: FAIL because settings.html and the assertion are not present.

- [ ] **Step 3: Add markup, render binding, and CSS**

Create the five inline-drawer sections, internal tab buttons, labels/help text, model search and dropdown, security warning, current coordinates, and all settings controls. Use SillyTavern CSS variables with safe fallbacks, high z-index, optional backdrop-filter, and responsive wrapping below 760px.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/settings.test.js

Expected: PASS with the structure assertion included.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/settings.html smart-quick-replies/style.css smart-quick-replies/index.js smart-quick-replies/tests/settings.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: add extension settings and theme styling"
~~~

### Task 6: Implement the floating panel and SillyTavern event lifecycle

**Files:**
- Modify: smart-quick-replies/index.js
- Modify: smart-quick-replies/style.css
- Modify: smart-quick-replies/tests/settings.test.js

**Interfaces:** Export createPanel(document, callbacks), createPositionStore(storage, key), createRequestCoordinator(), and bootstrap(context). bootstrap returns a cleanup function and accepts injectable document, window, eventSource, eventTypes, extensionSettings, fetch, and getContext.

- [ ] **Step 1: Write failing lifecycle tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPositionStore, createRequestCoordinator } from '../index.js';

test('position store persists, reads, and clears JSON coordinates', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const store = createPositionStore(storage, 'sqr-position');
  store.write({ left: 10, top: 20 });
  assert.deepEqual(store.read(), { left: 10, top: 20 });
  store.clear();
  assert.equal(store.read(), null);
});

test('request coordinator makes only the newest request current', () => {
  const coordinator = createRequestCoordinator();
  const first = coordinator.begin();
  const second = coordinator.begin();
  assert.equal(coordinator.isCurrent(first.id), false);
  assert.equal(coordinator.isCurrent(second.id), true);
  coordinator.cancel();
  assert.equal(coordinator.isCurrent(second.id), false);
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: node --test tests/settings.test.js

Expected: FAIL because the position store and coordinator are missing.

- [ ] **Step 3: Implement panel and event lifecycle**

Create four candidate buttons, refresh, a header/drag handle, loading/error states, and toolbar trigger. Candidate click writes to #send_textarea, dispatches input, focuses, and hides. Refresh debounces and aborts the previous request. Listen to GENERATION_STARTED, GENERATION_STOPPED, CHARACTER_MESSAGE_RENDERED, MESSAGE_SENT, CHAT_CHANGED, CHAT_DELETED, CHAT_CREATED, and input events. Use a 100ms interrupted-generation inspection delay and a per-generation guard.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: node --test tests/settings.test.js

Expected: PASS with lifecycle tests included.

- [ ] **Step 5: Commit**

~~~powershell
git add smart-quick-replies/index.js smart-quick-replies/style.css smart-quick-replies/tests/settings.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: add draggable suggestion panel lifecycle"
~~~

### Task 7: Wire Secrets-first settings, model UI, and README

**Files:**
- Modify: smart-quick-replies/index.js
- Modify: smart-quick-replies/settings.html
- Create: smart-quick-replies/README.md
- Create: smart-quick-replies/manifest.json

**Interfaces:** Export readApiKey(context, provider), writeApiKey(context, provider, value), loadExtensionSettings(context), and initSettingsUI(context).

- [ ] **Step 1: Add the manifest and static files**

Set the extension ID from third-party/smart-quick-replies, entry module index.js, stylesheet style.css, and settings template path. Document installation by copying or cloning into public/scripts/extensions/third-party/.

- [ ] **Step 2: Implement Secrets-first key storage and settings UI**

Detect available SillyTavern helpers without assuming one version. Store non-secret settings through extension_settings and saveSettingsDebounced when available. Store fallback keys under a namespaced local-storage key, expose a warning when fallback is active, and never render the actual key outside the password input.

- [ ] **Step 3: Add model fetching and filter behavior**

The 获取模型 button calls requestModels, fills a searchable select, and writes the chosen model into the model input. Failures show an inline status and leave manual input enabled.

- [ ] **Step 4: Write README instructions**

Include installation, reload/enable steps, endpoint examples for local LM Studio, OpenAI, and Anthropic, CORS troubleshooting, Secrets fallback warning, interrupted-generation behavior, compression settings, and a warning that the exposed GitHub Token must never enter repository files.

- [ ] **Step 5: Run the full test suite**

Run: npm test

Expected: PASS with 0 failures and no warnings.

- [ ] **Step 6: Commit**

~~~powershell
git add smart-quick-replies/manifest.json smart-quick-replies/index.js smart-quick-replies/settings.html smart-quick-replies/README.md
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: package smart quick replies extension"
~~~

### Task 8: Verify, prepare the remote, and upload the complete repository

**Files:**
- Verify: all files under smart-quick-replies/
- Modify: .gitignore only if test output or editor artifacts appear.

- [ ] **Step 1: Run full verification**

Run:

~~~powershell
npm test --prefix smart-quick-replies
node --check smart-quick-replies/index.js
git diff --check
git status --short --branch
~~~

Expected: all tests pass, node --check exits 0, git diff --check has no errors, and only intended files are present.

- [ ] **Step 2: Scan the final files for secrets**

Run:

~~~powershell
rg -n --hidden -g '!smart-quick-replies/node_modules' -g '!docs/superpowers/specs/**' -g '!docs/superpowers/plans/**' 'github_pat_|ghp_|sk-[A-Za-z0-9]|xox[baprs]-|BEGIN [A-Z ]+ PRIVATE KEY' .
Get-ChildItem -Recurse -File smart-quick-replies | Select-Object FullName,Length
~~~

Expected: no credential-like strings and all deliverables exist.

- [ ] **Step 3: Add the remote without embedding credentials**

~~~powershell
git remote add origin https://github.com/yeliuchen/smart-quick-replies.git
git remote -v
~~~

Expected: origin points to the confirmed private repository URL, with no token in the URL or config.

- [ ] **Step 4: Push only through authenticated GitHub access**

Use the authenticated GitHub web flow or a credential manager already configured on the machine. Never pass the exposed token to Git, PowerShell, URLs, or repository files. Push the complete local history as main only after verifying the remote is empty.

- [ ] **Step 5: Verify the remote contents**

Open the repository URL and confirm it is private and contains manifest.json, index.js, style.css, settings.html, README.md, package.json, and tests/, with no secret material.

## Plan Self-Review

- Covers all five settings sections, three providers, trigger modes, interrupted-generation exclusion, position memory/reset, model discovery, compression, Secrets fallback, four-candidate validation, error/retry UI, and cloud upload.
- Each production behavior has a test-first step before implementation.
- All named interfaces are introduced before later tasks consume them.
- No step depends on a credential embedded in the repository or remote URL.
- Runtime dependencies remain at zero.

