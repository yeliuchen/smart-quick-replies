import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  mergeSettings,
  migrateSettings,
  clampPosition,
  getDefaultPanelPosition,
  createPositionStore,
  createRequestCoordinator,
  createDragScheduler,
  getApiKeyStorageMode,
  readApiKey,
  writeApiKey,
  resolveRuntimeSettings,
  shouldSuggestOnCharacterRendered,
} from '../index.js';

test('default settings use automatic trigger, 20 messages, compression, and four candidates', () => {
  assert.equal(DEFAULT_SETTINGS.triggerMode, 'auto');
  assert.equal(DEFAULT_SETTINGS.historyLimit, 20);
  assert.equal(DEFAULT_SETTINGS.compression.enabled, true);
  assert.equal(DEFAULT_SETTINGS.compression.threshold, 3000);
  assert.equal(DEFAULT_SETTINGS.api.maxTokens, 80);
  assert.equal(DEFAULT_SETTINGS.api.authMode, 'bearer');
  assert.match(DEFAULT_SYSTEM_PROMPT, /You generate reply suggestions for the USER/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /You are NOT \{\{char\}\}/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /exactly 4 distinct/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /user style examples/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /scene stagnation/);
  assert.match(DEFAULT_SYSTEM_PROMPT, /6 consecutive user-character exchanges/);
});

test('mergeSettings fills missing nested values without mutating saved settings', () => {
  const saved = { api: { model: 'local-model' } };
  const merged = mergeSettings(saved);
  assert.equal(merged.api.model, 'local-model');
  assert.equal(merged.api.temperature, 0.9);
  assert.equal(merged.historyLimit, 20);
  assert.deepEqual(saved, { api: { model: 'local-model' } });
});

test('migrateSettings maps the first version keys into the current contract', () => {
  const migrated = migrateSettings({ historyCount: 8, autoOnInterrupt: false, prompt: 'custom' });
  assert.equal(migrated.historyLimit, 8);
  assert.equal(migrated.interruptedAutoGenerate, false);
  assert.equal(migrated.systemPrompt, 'custom');
});

test('migrateSettings upgrades the original default prompt to user-perspective rules', () => {
  const migrated = migrateSettings({
    systemPrompt: 'You are an assistant that helps the user reply to {{char}}. Given the conversation history, generate 4 distinct, short, and in-character replies that {{user}} might say next. Reply ONLY with a JSON array of 4 strings, like: ["reply1", "reply2", "reply3", "reply4"]',
  });
  assert.match(migrated.systemPrompt, /You are NOT \{\{char\}\}/);
});

test('panel position clamps to the viewport with a margin', () => {
  assert.deepEqual(clampPosition({ left: -10, top: 900 }, { width: 1000, height: 800 }, { width: 300, height: 120 }, 8), { left: 8, top: 672 });
});

test('default panel position is directly above the input', () => {
  assert.deepEqual(getDefaultPanelPosition({ left: 100, top: 700, width: 600, height: 80 }, { width: 600, height: 120 }, { width: 1000, height: 800 }, 8), { left: 100, top: 572 });
});

test('settings markup contains all required sections and controls', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  for (const id of ['sqr-general', 'sqr-api', 'sqr-prompt', 'sqr-context', 'sqr-appearance', 'sqr-trigger-mode', 'sqr-api-type', 'sqr-api-auth-mode', 'sqr-api-url', 'sqr-api-key', 'sqr-model', 'sqr-fetch-models', 'sqr-system-prompt', 'sqr-reset-prompt', 'sqr-reset-position', 'sqr-history-limit', 'sqr-compression-strategy']) {
    assert.match(html, new RegExp('id=["\\\']' + id + '["\\\']'));
  }
});

test('settings use one outer drawer and five independent inner drawers', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  assert.match(html, /<div[^>]*class="sqr-settings inline-drawer"[^>]*id="sqr-settings-root"/s);
  assert.match(html, /<div[^>]*class="inline-drawer-toggle inline-drawer-header"[^>]*data-sqr-root-toggle/);
  assert.match(html, /data-sqr-root-toggle[^>]*>\s*<b>智能快捷回复建议<\/b>\s*<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"><\/div>/s);
  assert.match(html, /class="inline-drawer-content"[^>]*data-sqr-root-content[^>]*hidden/);
  assert.doesNotMatch(html, /data-sqr-tab=/);
  for (const id of ['general', 'api', 'prompt', 'context', 'appearance']) {
    assert.match(html, new RegExp(`<details[^>]*id="sqr-${id}"[^>]*data-sqr-section`));
    assert.match(html, new RegExp(`data-sqr-collapse="sqr-${id}"`));
    assert.match(html, new RegExp(`id="sqr-${id}"[^>]*>(?:\\s|.)*?<summary`));
  }
});

test('settings use compact root heading and inline model and prompt toolbars', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /<h[1-4][\s>]/i);
  assert.match(html, /id="sqr-button-color"[^>]*data-sqr-setting="appearance\.buttonColor"/);
  assert.match(html, /id="sqr-button-text-color"[^>]*data-sqr-setting="appearance\.buttonTextColor"/);
  assert.match(html, /<option value="google">Google Gemini/);
  assert.match(html, /data-sqr-color-picker[\s\S]*data-sqr-color-value="#4f8cff"/);
  assert.match(html, /data-sqr-color-picker[\s\S]*data-sqr-color-value="#ffffff"/);
  assert.match(html, /class="sqr-model-toolbar"[\s\S]*id="sqr-model-search"[\s\S]*id="sqr-fetch-models"/);
  assert.match(html, /class="sqr-prompt-toolbar"[\s\S]*系统提示词[\s\S]*id="sqr-reset-prompt"/);
});

test('settings layout contracts define desktop and narrow-screen toolbar rules', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.sqr-settings\s*\{[\s\S]*border:\s*0[;\s][\s\S]*padding:\s*0[;\s]/);
  assert.doesNotMatch(css, /\.sqr-root-toggle[^}]*font-size/i);
  assert.doesNotMatch(css, /\.sqr-root-toggle[^}]*line-height/i);
  assert.match(css, /\.sqr-model-toolbar[\s\S]*display:\s*(?:flex|grid)/);
  assert.match(css, /\.sqr-prompt-toolbar[\s\S]*display:\s*(?:flex|grid)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.sqr-model-toolbar[\s\S]*grid-template-columns:\s*1fr/);
});

test('settings CSS gives form controls theme-aware colors', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.sqr-settings[\s\S]*--sqr-input-background/);
  assert.match(css, /\.sqr-settings[\s\S]*\.sqr-field input/);
  assert.match(css, /background:\s*var\(--sqr-input-background/);
  assert.match(css, /color:\s*var\(--sqr-input-text/);
  assert.match(css, /::placeholder/);
});

test('suggestion buttons use multiline clamping instead of single-line ellipsis', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /#sqr-panel \.sqr-candidate\s*\{[\s\S]*-webkit-line-clamp:\s*3/);
  assert.match(css, /#sqr-panel \.sqr-candidate\s*\{[\s\S]*white-space:\s*normal/);
  assert.doesNotMatch(css, /#sqr-panel \.sqr-candidate,[\s\S]*text-overflow:\s*ellipsis/);
});

test('loading state hides empty candidates and centers its status', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /#sqr-panel \.sqr-candidate\[hidden\]\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /#sqr-panel \.sqr-panel-status\s*\{[\s\S]*text-align:\s*center/);
});

test('progression candidates have a visible marker style', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.sqr-candidate\.sqr-progression::before[\s\S]*content:\s*'↗'/);
});

test('drag scheduler keeps only the newest pending point until the frame runs', () => {
  const frames = [];
  const scheduler = createDragScheduler(callback => frames.push(callback));
  scheduler.queue({ left: 10, top: 20 });
  scheduler.queue({ left: 30, top: 40 });
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.deepEqual(scheduler.flushes, [{ left: 30, top: 40 }]);
});

test('position store persists, reads, and clears JSON coordinates', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const store = createPositionStore(storage, 'sqr-position');
  store.write({ left: 10, top: 20 });
  assert.deepEqual(store.read(), { left: 10, top: 20 });
  store.clear();
  assert.equal(store.read(), null);
});

test('request coordinator reuses an active request instead of duplicating it', () => {
  const coordinator = createRequestCoordinator();
  const first = coordinator.begin();
  const second = coordinator.begin();
  assert.equal(second.id, first.id);
  assert.equal(second.reused, true);
  assert.equal(coordinator.isCurrent(first.id), true);
  coordinator.cancel();
  assert.equal(coordinator.isCurrent(first.id), false);
});

test('API keys prefer a Secrets adapter and never enter extension settings', async () => {
  const secrets = new Map();
  const context = {
    getSecret: key => secrets.get(key) ?? '',
    setSecret: (key, value) => secrets.set(key, value),
  };
  assert.equal(getApiKeyStorageMode(context), 'secrets');
  assert.equal(await writeApiKey(context, 'openai', 'secret-value'), 'secrets');
  assert.equal(await readApiKey(context, 'openai'), 'secret-value');
});

test('runtime settings prefer the latest persisted extension settings', () => {
  const initial = { api: { url: 'http://localhost:1234/v1', model: '' } };
  const persisted = { api: { url: 'http://127.0.0.1:1234/v1', model: 'gemma-4-e4b-it-ud' } };
  const resolved = resolveRuntimeSettings({
    settings: initial,
    extensionSettings: { smartQuickReplies: persisted },
  });
  assert.equal(resolved.api.url, persisted.api.url);
  assert.equal(resolved.api.model, persisted.api.model);
});

test('character render suggestions wait until the main generation stops', () => {
  assert.equal(shouldSuggestOnCharacterRendered({ triggerMode: 'auto' }, true), false);
  assert.equal(shouldSuggestOnCharacterRendered({ triggerMode: 'auto' }, false), true);
  assert.equal(shouldSuggestOnCharacterRendered({ triggerMode: 'manual' }, false), false);
});
