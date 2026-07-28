import test from 'node:test';
import assert from 'node:assert/strict';
import { detectApiType, normalizeEndpoint, expandPrompt, parseCandidateArray, parseProviderResponse } from '../index.js';

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

test('candidate parser accepts four markdown Option lines from reasoning models', () => {
  const text = [
    '分析：需要给出四个候选。',
    '* **Option 1:** 你好，很高兴见到你。',
    '* **Option 2:** 你现在感觉好些了吗？',
    '* **Option 3:** 我在这里陪着你。',
    '* **Option 4:** 我们慢慢聊吧。',
  ].join('\n');
  assert.deepEqual(parseCandidateArray(text), [
    '你好，很高兴见到你。',
    '你现在感觉好些了吗？',
    '我在这里陪着你。',
    '我们慢慢聊吧。',
  ]);
});

test('candidate parser prefers final Reply lines over reasoning-only option descriptions', () => {
  const text = [
    '* Option 1: Cheeky/Playful',
    '* Option 2: Soft/Endearing',
    '* Option 3: Acting hurt/Cute',
    '* Option 4: Direct/Bold',
    '* Reply 1: "Reply one" (Playful)',
    '* Reply 2: "Reply two" (Teasing)',
    '* Reply 3: "Reply three" (Cute)',
    '* Reply 4: "Reply four" (Bold)',
  ].join('\n');
  assert.deepEqual(parseCandidateArray(text), ['Reply one', 'Reply two', 'Reply three', 'Reply four']);
});

test('LM Studio suggestion response can include reasoning content for parsing', () => {
  const text = parseProviderResponse({
    choices: [{ message: { content: '```json\n[', reasoning_content: '* Reply 1: "one"\n* Reply 2: "two"\n* Reply 3: "three"\n* Reply 4: "four"' } }],
  }, 'lmstudio', { includeReasoning: true });
  assert.match(text, /Reply 4/);
});

test('candidate parser accepts numbered replies recovered from reasoning content', () => {
  const text = [
    '* Idea 1: tease the character',
    '1. "First user reply" (teasing)',
    '2. "Second user reply" (playful)',
    '3. "Third user reply" (direct)',
    '4. "Fourth user reply" (warm)',
    '* Exactly 4 strings? Yes.',
  ].join('\n');
  assert.deepEqual(parseCandidateArray(text), [
    'First user reply',
    'Second user reply',
    'Third user reply',
    'Fourth user reply',
  ]);
});
