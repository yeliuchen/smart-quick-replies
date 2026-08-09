import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHistory,
  formatHistoryText,
  estimateTokens,
  compressHistory,
  buildPromptMessages,
  formatUserStyleExamples,
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

test('system chat entries remain system context instead of impersonating the character', () => {
  const result = buildHistory([
    { is_system: true, name: 'System', mes: 'World state changed.' },
    { is_user: false, name: 'Mira', mes: 'Did you notice?' },
  ], { limit: 20, charName: 'Mira', userName: 'Amo' });

  assert.deepEqual(result.messages.map(message => message.role), ['system', 'assistant']);
});

test('interrupted history drops the incomplete AI message and preceding user message', () => {
  const result = buildHistory(chat, { limit: 20, interrupted: true, charName: 'Mira', userName: 'Amo' });
  assert.deepEqual(result.messages.map(message => message.content), ['Old answer']);
  assert.equal(result.interrupted, true);
});

test('interrupted history leaves completed history intact when the latest message is from the user', () => {
  const completed = [...chat.slice(0, 2), { name: 'Amo', is_user: true, mes: 'A new message' }];
  const result = buildHistory(completed, { limit: 20, interrupted: true, charName: 'Mira', userName: 'Amo' });

  assert.deepEqual(result.messages.map(message => message.content), ['Old answer', 'Current question', 'A new message']);
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

test('compression derives a token estimate when callers omit cached metadata', async () => {
  const result = await compressHistory({
    messages: [
      { name: 'Amo', role: 'user', content: '12345678' },
      { name: 'Mira', role: 'assistant', content: 'abcdefgh' },
    ],
  }, { enabled: true, strategy: 'window', preserveRecent: 1, threshold: 1 });

  assert.equal(result.compressed, true);
  assert.deepEqual(result.messages.map(message => message.content), ['abcdefgh']);
});

test('history placeholder is inserted into the system prompt without duplicate messages', () => {
  const result = buildPromptMessages('Reply using this history: {{history}}', { messages: [{ name: 'Mira', role: 'assistant', content: 'Hi' }] }, { history: 'Mira: Hi' });
  assert.match(result.system, /Mira: Hi/);
  assert.deepEqual(result.messages, []);
});

test('history placeholders include an automatic summary exactly once', () => {
  const result = buildPromptMessages('Reply using this history:\n{{history}}', {
    messages: [
      { name: 'Conversation summary', role: 'system', content: 'Earlier context summary.' },
      { name: 'Mira', role: 'assistant', content: 'Latest reply.' },
    ],
  });

  assert.equal((result.system.match(/Earlier context summary\./g) ?? []).length, 1);
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

test('user style examples are added separately from conversation history', () => {
  const examples = formatUserStyleExamples([
    { role: 'assistant', content: 'Character voice' },
    { role: 'user', content: '短句。带一点直接的语气。' },
    { role: 'user', content: '这是一条很长的消息。'.repeat(100) },
  ], 2, 24);
  assert.match(examples, /Example 1:/);
  assert.match(examples, /Example 2:/);
  assert.ok(examples.length < 100);

  const prompt = buildPromptMessages('Reply as the user.', { messages: [] }, { userStyleExamples: examples });
  assert.match(prompt.system, /User style reference/);
  assert.match(prompt.system, /Example 1:/);
});
