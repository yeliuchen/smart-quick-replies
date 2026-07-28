import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompletionRequest,
  buildModelsRequest,
  parseProviderResponse,
  parseModelList,
  requestCompletion,
  requestModels,
} from '../index.js';

test('OpenAI request uses system messages and bearer authentication', () => {
  const request = buildCompletionRequest({ type: 'openai', url: 'http://localhost:1234', key: 'secret', model: 'local', temperature: 0.9, maxTokens: 80, topP: 0.95 }, { system: 'system', messages: [{ role: 'user', content: 'hi' }], generationInstruction: 'Generate now.' });
  assert.equal(request.url, 'http://localhost:1234/v1/chat/completions');
  assert.equal(request.init.headers.Authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.init.body).messages, [{ role: 'system', content: 'system' }, { role: 'user', content: 'hi' }, { role: 'user', content: 'Generate now.' }]);
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

test('LM Studio discovery falls back when the OpenAI endpoint returns an empty list', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url === 'http://localhost:1234/v1/models') return { ok: true, status: 200, json: async () => ({ data: [] }) };
    return { ok: true, status: 200, json: async () => ({ models: [{ key: 'loaded-model' }] }) };
  };

  const models = await requestModels({ type: 'lmstudio', url: 'http://localhost:1234' }, { fetch: fetchImpl });
  assert.deepEqual(models, ['loaded-model']);
  assert.deepEqual(calls.map(call => call.url), [
    'http://localhost:1234/v1/models',
    'http://localhost:1234/api/v1/models',
  ]);
});

test('LM Studio retries a reasoning-only length response with a larger token budget', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push(JSON.parse(init.body));
    if (requests.length <= 2) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: '', reasoning_content: 'thinking' }, finish_reason: 'length' }] }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '["a","b","c","d"]' }, finish_reason: 'stop' }] }),
    };
  };

  const text = await requestCompletion(
    { type: 'lmstudio', url: 'http://localhost:1234/v1', model: 'gemma', maxTokens: 80 },
    { system: 'system', messages: [{ role: 'user', content: 'hi' }] },
    { fetch: fetchImpl },
  );
  assert.equal(text, '["a","b","c","d"]');
  assert.equal(requests[0].max_tokens, 80);
  assert.equal(requests[1].max_tokens, 512);
  assert.equal(requests[2].max_tokens, 1024);
});

test('LM Studio retries an empty response even without reasoning content', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    return {
      ok: true,
      status: 200,
      json: async () => callCount === 1
        ? { choices: [{ message: { content: '\n' }, finish_reason: 'stop' }] }
        : { choices: [{ message: { content: '["a","b","c","d"]' }, finish_reason: 'stop' }] },
    };
  };
  const text = await requestCompletion(
    { type: 'lmstudio', url: 'http://localhost:1234/v1', model: 'gemma', maxTokens: 80 },
    { system: 'system', messages: [{ role: 'user', content: 'hi' }] },
    { fetch: fetchImpl },
  );
  assert.equal(text, '["a","b","c","d"]');
  assert.equal(callCount, 2);
});

test('completion and model requests use injectable fetch dependencies', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/v1/models') && !url.includes('/api/v1/models')) return { ok: false, status: 404, json: async () => ({}) };
    return {
      ok: true,
      json: async () => url.includes('/models') ? { models: [{ id: 'local-model' }] } : { choices: [{ message: { content: '["a","b","c","d"]' } }] },
    };
  };
  const text = await requestCompletion(
    { type: 'openai', url: 'http://localhost:1234', key: 'secret', model: 'local', timeoutMs: 1000 },
    { system: 'system', messages: [{ role: 'user', content: 'hi' }] },
    { fetch: fetchImpl },
  );
  const models = await requestModels({ type: 'lmstudio', url: 'http://localhost:1234' }, { fetch: fetchImpl });
  assert.equal(text, '["a","b","c","d"]');
  assert.deepEqual(models, ['local-model']);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer secret');
  assert.equal(calls.at(-1).url, 'http://localhost:1234/api/v1/models');
});
