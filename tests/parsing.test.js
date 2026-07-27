import test from 'node:test';
import assert from 'node:assert/strict';
import { detectApiType, normalizeEndpoint, expandPrompt, parseCandidateArray } from '../index.js';

test('auto detection recognizes Anthropic and LM Studio URLs', () => {
  assert.equal(detectApiType('https://api.anthropic.com/v1', 'openai', true), 'anthropic');
  assert.equal(detectApiType('http://localhost:1234/v1', 'openai', true), 'lmstudio');
  assert.equal(detectApiType('http://127.0.0.1:1234/v1', 'openai', true), 'lmstudio');
  assert.equal(detectApiType('https://gateway.example/v1', 'anthropic', false), 'anthropic');
});

test('endpoint normalization handles base, v1, and full endpoint URLs', () => {
  assert.equal(normalizeEndpoint('http://localhost:1234', 'openai', 'completion'), 'http://localhost:1234/v1/chat/completions');
  assert.equal(normalizeEndpoint('http://localhost:1234/v1', 'lmstudio', 'models'), 'http://localhost:1234/v1/models');
  assert.equal(normalizeEndpoint('https://api.anthropic.com/v1/messages', 'anthropic', 'completion'), 'https://api.anthropic.com/v1/messages');
});

test('prompt expansion replaces names, description, and plain-text history', () => {
  const text = expandPrompt('{{char}}/{{user}}/{{char_description}}/{{history}}', { char: 'Mira', user: 'Amo', charDescription: 'calm', history: 'Mira: Hello' });
  assert.equal(text, 'Mira/Amo/calm/Mira: Hello');
});

test('candidate parser removes code fences and rejects duplicates or wrong counts', () => {
  assert.deepEqual(parseCandidateArray('~~~json\n["a","b","c","d"]\n~~~'), ['a', 'b', 'c', 'd']);
  assert.throws(() => parseCandidateArray('["a","a","b","c"]'), /four distinct/);
  assert.throws(() => parseCandidateArray('["a","b"]'), /four distinct/);
});
