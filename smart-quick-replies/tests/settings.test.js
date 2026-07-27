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
  getApiKeyStorageMode,
  readApiKey,
  writeApiKey,
} from '../index.js';

test('default settings use automatic trigger, 20 messages, compression, and four candidates', () => {
  assert.equal(DEFAULT_SETTINGS.triggerMode, 'auto');
  assert.equal(DEFAULT_SETTINGS.historyLimit, 20);
  assert.equal(DEFAULT_SETTINGS.compression.enabled, true);
  assert.equal(DEFAULT_SETTINGS.compression.threshold, 3000);
  assert.equal(DEFAULT_SETTINGS.api.maxTokens, 80);
  assert.match(DEFAULT_SYSTEM_PROMPT, /generate 4 distinct, short/);
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

test('panel position clamps to the viewport with a margin', () => {
  assert.deepEqual(clampPosition({ left: -10, top: 900 }, { width: 1000, height: 800 }, { width: 300, height: 120 }, 8), { left: 8, top: 672 });
});

test('default panel position is directly above the input', () => {
  assert.deepEqual(getDefaultPanelPosition({ left: 100, top: 700, width: 600, height: 80 }, { width: 600, height: 120 }, { width: 1000, height: 800 }, 8), { left: 100, top: 580 });
});

test('settings markup contains all required sections and controls', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  for (const id of ['sqr-general', 'sqr-api', 'sqr-prompt', 'sqr-context', 'sqr-appearance', 'sqr-trigger-mode', 'sqr-api-type', 'sqr-api-url', 'sqr-api-key', 'sqr-model', 'sqr-fetch-models', 'sqr-system-prompt', 'sqr-reset-prompt', 'sqr-reset-position', 'sqr-history-limit', 'sqr-compression-strategy']) {
    assert.match(html, new RegExp('id=["\\\']' + id + '["\\\']'));
  }
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

test('request coordinator makes only the newest request current', () => {
  const coordinator = createRequestCoordinator();
  const first = coordinator.begin();
  const second = coordinator.begin();
  assert.equal(coordinator.isCurrent(first.id), false);
  assert.equal(coordinator.isCurrent(second.id), true);
  coordinator.cancel();
  assert.equal(coordinator.isCurrent(second.id), false);
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
