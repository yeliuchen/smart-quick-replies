import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHistory,
  formatHistoryText,
  estimateTokens,
  compressHistory,
  buildPromptMessages,
} from '../index.js';

const chat = [
  { name: 'Mira', is_user: false, mes: 'Old answer' },
  { name: 'Amo', is_user: true, mes: 'Current question' },
  { name: 'Mira', is_user: false, mes: 'Partial answer' },
];

test('history maps user and assistant roles and keeps the recent limit', () => {
  const result = buildHistory(chat, { limit: 2, interrupted: false, charName: 'Mira', userName: 'Amo' });
  assert.deepEqual(result.messages.map(message => message.role), ['user', 'assistant']);
  assert.equal(result.messages[0].content, 'Current question');
});

test('interrupted history drops the incomplete AI message and preceding user message', () => {
  const result = buildHistory(chat, { limit: 20, interrupted: true, charName: 'Mira', userName: 'Amo' });
  assert.deepEqual(result.messages.map(message => message.content), ['Old answer']);
  assert.equal(result.interrupted, true);
});

test('history formatting and rough token estimate are deterministic', () => {
  assert.equal(formatHistoryText([{ name: 'Mira', content: 'Hello' }]), 'Mira: Hello');
  assert.equal(estimateTokens('12345678'), 2);
});

test('sliding-window compression keeps the configured newest messages', async () => {
  const history = { messages: [{ content: '1' }, { content: '2' }, { content: '3' }], estimatedTokens: 100 };
  const result = await compressHistory(history, { enabled: true, strategy: 'window', preserveRecent: 2, threshold: 10 }, async () => 'unused');
  assert.deepEqual(result.messages.map(message => message.content), ['2', '3']);
});

test('history placeholder is inserted into the system prompt without duplicate messages', () => {
  const result = buildPromptMessages('Reply using this history: {{history}}', { messages: [{ name: 'Mira', role: 'assistant', content: 'Hi' }] }, { history: 'Mira: Hi' });
  assert.match(result.system, /Mira: Hi/);
  assert.deepEqual(result.messages, []);
});

test('system history is folded into one system prompt for chat templates', () => {
  const result = buildPromptMessages('Return four replies.', {
    messages: [
      { name: 'Conversation summary', role: 'system', content: 'Earlier context summary.' },
      { name: 'Amo', role: 'user', content: 'What happened?' },
      { name: 'Mira', role: 'assistant', content: 'I can explain.' },
    ],
  });
  assert.match(result.system, /Conversation summary:\nEarlier context summary\./);
  assert.deepEqual(result.messages.map(message => message.role), ['user', 'assistant']);
});
