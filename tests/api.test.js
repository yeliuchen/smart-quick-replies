import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompletionRequest,
  buildModelsRequest,
  detectApiType,
  parseProviderResponse,
  parseModelList,
  requestCompletion,
  requestModels,
  resolveApiRequestConfig,
  summarizeProviderPayload,
  shouldUseStreaming,
  getEffectiveMaxTokens,
} from '../index.js';

test('OpenAI request uses system messages and bearer authentication', () => {
  const request = buildCompletionRequest({ type: 'openai', url: 'http://localhost:1234', key: 'secret', model: 'local', temperature: 0.9, maxTokens: 80, topP: 0.95 }, { system: 'system', messages: [{ role: 'user', content: 'hi' }], generationInstruction: 'Generate now.' });
  assert.equal(request.url, 'http://localhost:1234/v1/chat/completions');
  assert.equal(request.init.headers.Authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.init.body).messages, [{ role: 'system', content: 'system' }, { role: 'user', content: 'hi' }, { role: 'user', content: 'Generate now.' }]);
});

test('provider-specific token floors avoid predictable first-attempt truncation', () => {
  assert.equal(getEffectiveMaxTokens({ type: 'openai', maxTokens: 80 }), 256);
  assert.equal(getEffectiveMaxTokens({ type: 'lmstudio', maxTokens: 80 }), 512);
  assert.equal(getEffectiveMaxTokens({ type: 'openai', model: '假流式-gemini-3-flash-preview', maxTokens: 80 }), 1024);
});

test('OpenAI-compatible requests support x-api-key and no-auth modes', () => {
  const xApiKeyRequest = buildCompletionRequest({ type: 'openai', authMode: 'x-api-key', url: 'https://gateway.example/v1', key: 'secret', model: 'gemini' }, { messages: [] });
  assert.equal(xApiKeyRequest.init.headers['x-api-key'], 'secret');
  assert.equal(xApiKeyRequest.init.headers.Authorization, undefined);

  const noAuthRequest = buildCompletionRequest({ type: 'openai', authMode: 'none', url: 'http://localhost:1234/v1', key: 'secret', model: 'local' }, { messages: [] });
  assert.equal(noAuthRequest.init.headers.Authorization, undefined);
  assert.equal(noAuthRequest.init.headers['x-api-key'], undefined);
});

test('Google Gemini requests use native contents and x-goog-api-key authentication', () => {
  const request = buildCompletionRequest({ type: 'google', url: 'https://generativelanguage.googleapis.com/v1beta', key: 'google-secret', model: 'gemini-2.5-flash', temperature: 0.7, maxTokens: 80, topP: 0.9 }, {
    system: 'You help the user.',
    messages: [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }],
    generationInstruction: 'Generate four replies.',
  });
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(request.init.headers['x-goog-api-key'], 'google-secret');
  const body = JSON.parse(request.init.body);
  assert.deepEqual(body.systemInstruction, { parts: [{ text: 'You help the user.' }] });
  assert.deepEqual(body.contents, [
    { role: 'user', parts: [{ text: 'hello' }] },
    { role: 'model', parts: [{ text: 'hi' }] },
    { role: 'user', parts: [{ text: 'Generate four replies.' }] },
  ]);
  assert.deepEqual(body.generationConfig, { temperature: 0.7, topP: 0.9, maxOutputTokens: 256 });
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

test('OpenAI-compatible responses accept text-part content arrays', () => {
  assert.equal(parseProviderResponse({ choices: [{ message: { content: [{ type: 'text', text: '["a","b","c","d"]' }] } }] }, 'openai'), '["a","b","c","d"]');
});

test('runtime API config prefers the current settings input key', () => {
  const config = resolveApiRequestConfig({ api: { type: 'google', autoDetect: true, url: 'https://gcli.ggchan.dev', key: '' } }, {
    inputApiKey: 'current-key',
    runtimeApiKey: 'stale-key',
  });
  assert.equal(config.type, 'openai');
  assert.equal(config.key, 'current-key');
});

test('provider payload debug summary exposes content and reasoning diagnostics without secrets', () => {
  const summary = summarizeProviderPayload({ choices: [{ finish_reason: 'length', message: { content: '', reasoning_content: 'thinking' } }], usage: { total_tokens: 42 } }, 'lmstudio');
  assert.equal(summary.finishReason, 'length');
  assert.equal(summary.standardContentLength, 0);
  assert.equal(summary.reasoningContentLength, 8);
  assert.equal(summary.usage.total_tokens, 42);
  assert.doesNotMatch(JSON.stringify(summary), /secret|authorization/i);
});

test('Google response and model list parsers support native Gemini shapes', () => {
  assert.equal(parseProviderResponse({ candidates: [{ content: { parts: [{ text: '["a","b","c","d"]' }] } }] }, 'google'), '["a","b","c","d"]');
  assert.deepEqual(parseModelList({ models: [{ name: 'models/gemini-2.5-flash' }, { name: 'models/gemini-2.0-flash' }] }, 'google'), ['gemini-2.0-flash', 'gemini-2.5-flash']);
});

test('Google API auto detection recognizes the official endpoint', () => {
  assert.equal(detectApiType('https://generativelanguage.googleapis.com/v1beta', 'openai', true), 'google');
});

test('HTTP errors retain status and provide an actionable unauthorized message', async () => {
  await assert.rejects(
    requestCompletion({ type: 'openai', url: 'https://gateway.example/v1', key: '', model: 'gemini' }, { messages: [] }, {
      fetch: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API key' } }) }),
    }),
    error => error.status === 401 && /API Key|鉴权|unauthorized/i.test(error.message),
  );
});

test('LM Studio model discovery includes the API v1 fallback', () => {
  const request = buildModelsRequest({ type: 'lmstudio', url: 'http://localhost:1234', key: '' });
  assert.deepEqual(request.fallbackUrls, ['http://localhost:1234/api/v1/models']);
});

test('Google model discovery uses the native models endpoint', async () => {
  const calls = [];
  const models = await requestModels({ type: 'google', url: 'https://generativelanguage.googleapis.com/v1beta', key: 'secret' }, {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200, json: async () => ({ models: [{ name: 'models/gemini-2.5-flash' }] }) };
    },
  });
  assert.deepEqual(models, ['gemini-2.5-flash']);
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models');
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'secret');
});

test('LM Studio completion explicitly disables reasoning output', () => {
  const request = buildCompletionRequest({ type: 'lmstudio', url: 'http://localhost:1234/v1', model: 'gemma', maxTokens: 80 }, { system: 'system', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(JSON.parse(request.init.body).reasoning, false);
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
    if (requests.length === 1) {
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
  assert.equal(requests[0].max_tokens, 512);
  assert.equal(requests[1].max_tokens, 1024);
});

test('OpenAI-compatible requests retry truncated JSON with larger token budgets', async () => {
  const requests = [];
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    requests.push(body.max_tokens);
    if (requests.length < 3) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: '[{"reply":"' }, finish_reason: 'length' }] }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '[{"reply":"a","progression":false},{"reply":"b","progression":false},{"reply":"c","progression":false},{"reply":"d","progression":false}]' }, finish_reason: 'stop' }] }),
    };
  };
  const text = await requestCompletion(
    { type: 'openai', url: 'https://gateway.example/v1', key: 'secret', model: 'gemini', maxTokens: 81 },
    { messages: [] },
    { fetch: fetchImpl },
  );
  assert.match(text, /"reply":"d"/);
  assert.deepEqual(requests, [256, 512, 1024]);
});

test('fake-stream models request streaming and aggregate SSE content', async () => {
  assert.equal(shouldUseStreaming({ model: '假流式-gemini-3-flash-preview' }), true);
  const encoder = new TextEncoder();
  const chunks = [
    '[{"reply":"a",',
    '"progression":false},{"reply":"b",',
    '"progression":false},{"reply":"c",',
    '"progression":false},{"reply":"d","progression":false}]',
  ].map((content, index, values) => `data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: index === values.length - 1 ? 'stop' : null }] })}\n\n`).concat('data: [DONE]\n\n');
  const text = await requestCompletion({ type: 'openai', url: 'https://gateway.example/v1', key: 'secret', model: '假流式-gemini-3-flash-preview', maxTokens: 256 }, { messages: [] }, {
    fetch: async (_url, init) => {
      assert.equal(JSON.parse(init.body).stream, true);
      let index = 0;
      return {
        ok: true,
        status: 200,
        body: { getReader: () => ({ read: async () => index < chunks.length ? { done: false, value: encoder.encode(chunks[index++]) } : { done: true, value: undefined } }) },
      };
    },
  });
  assert.match(text, /"reply":"d"/);
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

test('LM Studio reports when reasoning consumed the whole response budget', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: '', reasoning_content: 'long internal reasoning' }, finish_reason: 'length' }] }),
  });
  await assert.rejects(
    requestCompletion({ type: 'lmstudio', url: 'http://localhost:1234/v1', model: 'gemma', maxTokens: 80 }, { messages: [] }, { fetch: fetchImpl }),
    error => /reasoning|推理|最终内容/i.test(error.message) && /content/i.test(error.message),
  );
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
