import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  mergeSettings,
  migrateSettings,
  clampPosition,
  getDefaultPanelPosition,
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
