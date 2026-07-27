export const DEFAULT_SYSTEM_PROMPT = 'You are an assistant that helps the user reply to {{char}}. Given the conversation history, generate 4 distinct, short, and in-character replies that {{user}} might say next. Reply ONLY with a JSON array of 4 strings, like: ["reply1", "reply2", "reply3", "reply4"]';

export const DEFAULT_SETTINGS = Object.freeze({
  version: 1,
  triggerMode: 'auto',
  interruptedAutoGenerate: true,
  dismissAfterSend: true,
  escDismiss: true,
  outsideClickDismiss: false,
  historyLimit: 20,
  includeCharacterDescription: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  api: {
    type: 'openai',
    autoDetect: true,
    url: 'http://localhost:1234/v1',
    model: '',
    temperature: 0.9,
    maxTokens: 80,
    topP: 0.95,
    timeoutMs: 30000,
  },
  compression: {
    enabled: true,
    strategy: 'auto-summary',
    threshold: 3000,
    preserveRecent: 4,
    summaryModel: '',
    summaryApiUrl: '',
    summaryApiType: '',
    summaryApiKey: '',
  },
  appearance: {
    opacity: 0.94,
    buttonColor: '',
    buttonTextColor: '',
  },
  position: null,
});

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const cloneValue = value => {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  return value;
};

const mergePlainObjects = (defaults, saved) => {
  const result = cloneValue(defaults);
  if (!isPlainObject(saved)) return result;
  for (const [key, value] of Object.entries(saved)) {
    if (isPlainObject(result[key]) && isPlainObject(value)) {
      result[key] = mergePlainObjects(result[key], value);
    } else {
      result[key] = cloneValue(value);
    }
  }
  return result;
};

export function migrateSettings(saved = {}) {
  const source = isPlainObject(saved) ? cloneValue(saved) : {};
  if (source.historyLimit === undefined && Number.isFinite(Number(source.historyCount))) {
    source.historyLimit = Number(source.historyCount);
  }
  if (source.interruptedAutoGenerate === undefined && typeof source.autoOnInterrupt === 'boolean') {
    source.interruptedAutoGenerate = source.autoOnInterrupt;
  }
  if (source.systemPrompt === undefined && typeof source.prompt === 'string') {
    source.systemPrompt = source.prompt;
  }
  source.version = 1;
  return source;
}

export function mergeSettings(saved = {}) {
  return mergePlainObjects(DEFAULT_SETTINGS, migrateSettings(saved));
}

export function clampPosition(position, viewport, panelSize, margin = 8) {
  const safeMargin = Math.max(0, Number(margin) || 0);
  const maxLeft = Math.max(safeMargin, Number(viewport?.width || 0) - Number(panelSize?.width || 0) - safeMargin);
  const maxTop = Math.max(safeMargin, Number(viewport?.height || 0) - Number(panelSize?.height || 0) - safeMargin);
  const left = Number.isFinite(Number(position?.left)) ? Number(position.left) : safeMargin;
  const top = Number.isFinite(Number(position?.top)) ? Number(position.top) : safeMargin;
  return {
    left: Math.min(maxLeft, Math.max(safeMargin, left)),
    top: Math.min(maxTop, Math.max(safeMargin, top)),
  };
}

export function getDefaultPanelPosition(inputRect, panelSize, viewport, margin = 8) {
  return clampPosition({
    left: Number(inputRect?.left) || margin,
    top: (Number(inputRect?.top) || margin) - (Number(panelSize?.height) || 0),
  }, viewport, panelSize, margin);
}

export function detectApiType(url, selectedType = 'openai', autoDetect = true) {
  if (!autoDetect) return selectedType;
  const value = String(url || '').toLowerCase();
  if (value.includes('anthropic') || value.includes('/messages')) return 'anthropic';
  if (value.includes('lmstudio') || value.includes('localhost:1234') || value.includes('/api/v1')) return 'lmstudio';
  return 'openai';
}

const trimUrl = url => String(url || '').trim().replace(/\/+$/, '');

export function normalizeEndpoint(url, apiType, kind = 'completion') {
  let base = trimUrl(url);
  if (!base) return '';
  if (kind === 'models') {
    if (/\/models$/i.test(base)) return base;
    if (/\/chat\/completions$/i.test(base)) base = base.replace(/\/chat\/completions$/i, '');
    return /\/v1$/i.test(base) ? `${base}/models` : `${base}/v1/models`;
  }
  if (apiType === 'anthropic') {
    if (/\/messages$/i.test(base)) return base;
    if (/\/v1$/i.test(base)) return `${base}/messages`;
    return `${base}/v1/messages`;
  }
  if (/\/chat\/completions$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

export function expandPrompt(template, values = {}) {
  const replacements = {
    char: values.char ?? '',
    user: values.user ?? '',
    char_description: values.charDescription ?? values.char_description ?? '',
    history: values.history ?? '',
  };
  return String(template ?? '').replace(/\{\{\s*(char|user|char_description|history)\s*\}\}/gi, (_match, key) => replacements[key.toLowerCase()] ?? '');
}

export class InvalidCandidateError extends Error {
  constructor(message = 'Response must contain four distinct non-empty replies') {
    super(message);
    this.name = 'InvalidCandidateError';
  }
}

const removeCodeFences = text => String(text ?? '')
  .replace(/^\s*(?:```|~~~)\s*(?:json)?\s*/i, '')
  .replace(/\s*(?:```|~~~)\s*$/i, '')
  .trim();

const extractJsonArray = text => {
  const source = removeCodeFences(text);
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === '[' && start === -1) {
      start = index;
      depth = 1;
      continue;
    }
    if (start !== -1 && character === '[') depth += 1;
    if (start !== -1 && character === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return source;
};

export function parseCandidateArray(text) {
  let parsed;
  try {
    parsed = JSON.parse(extractJsonArray(text));
  } catch {
    throw new InvalidCandidateError();
  }
  if (!Array.isArray(parsed) || parsed.length !== 4 || parsed.some(item => typeof item !== 'string' || !item.trim())) {
    throw new InvalidCandidateError();
  }
  const candidates = parsed.map(item => item.trim());
  if (new Set(candidates).size !== 4) throw new InvalidCandidateError();
  return candidates;
}

export function mapChatMessage(message = {}, names = {}) {
  const isUser = Boolean(message.is_user ?? message.isUser ?? message.role === 'user');
  const role = isUser ? 'user' : 'assistant';
  const fallbackName = isUser ? names.userName : names.charName;
  const name = String(message.name || fallbackName || (isUser ? 'User' : 'Character'));
  const content = String(message.mes ?? message.content ?? '').trim();
  return { name, isUser, role, content };
}

export function formatHistoryText(messages = []) {
  return messages
    .filter(message => message && String(message.content ?? '').trim())
    .map(message => `${message.name || (message.role === 'user' ? 'User' : 'Character')}: ${String(message.content).trim()}`)
    .join('\n');
}

export function estimateTokens(text) {
  const length = String(text ?? '').length;
  return length ? Math.ceil(length / 4) : 0;
}

export function buildHistory(chat = [], options = {}) {
  const limit = Math.max(0, Number.isFinite(Number(options.limit)) ? Number(options.limit) : 20);
  const mapped = (Array.isArray(chat) ? chat : [])
    .map(message => mapChatMessage(message, options))
    .filter(message => message.content);
  const messages = limit === 0 ? [] : mapped.slice(-limit);
  let selected = messages;

  if (options.interrupted) {
    const incompleteIndex = selected.map(message => message.role).lastIndexOf('assistant');
    if (incompleteIndex !== -1) {
      const removeIndexes = new Set([incompleteIndex]);
      if (selected[incompleteIndex - 1]?.role === 'user') removeIndexes.add(incompleteIndex - 1);
      selected = selected.filter((_message, index) => !removeIndexes.has(index));
    }
  }

  return {
    messages: selected,
    interrupted: Boolean(options.interrupted),
    estimatedTokens: estimateTokens(formatHistoryText(selected)),
  };
}

const withCompressionMetadata = (history, metadata = {}) => ({
  ...history,
  ...metadata,
  messages: Array.isArray(metadata.messages) ? metadata.messages : history.messages,
  estimatedTokens: estimateTokens(formatHistoryText(Array.isArray(metadata.messages) ? metadata.messages : history.messages)),
});

export async function compressHistory(history = { messages: [] }, options = {}, summarize) {
  const source = {
    ...history,
    messages: Array.isArray(history.messages) ? history.messages : [],
  };
  const threshold = Math.max(0, Number(options.threshold) || 0);
  const strategy = String(options.strategy || 'auto-summary').toLowerCase();
  const shouldCompress = Boolean(options.enabled) && source.estimatedTokens > threshold && strategy !== 'none' && strategy !== 'no-compression';
  if (!shouldCompress) return withCompressionMetadata(source, { compressed: false });

  const preserveRecent = Math.max(0, Number(options.preserveRecent) || 0);
  const recent = preserveRecent === 0 ? [] : source.messages.slice(-preserveRecent);
  const early = preserveRecent === 0 ? source.messages : source.messages.slice(0, -preserveRecent);
  const isWindow = strategy === 'window' || strategy === 'sliding-window' || strategy === 'sliding_window';
  if (isWindow || early.length === 0) {
    return withCompressionMetadata(source, { messages: recent, compressed: true, strategy: 'window' });
  }

  try {
    const summaryResult = typeof summarize === 'function'
      ? await summarize(early, formatHistoryText(early))
      : '';
    const summary = typeof summaryResult === 'string'
      ? summaryResult.trim()
      : String(summaryResult?.content ?? summaryResult?.summary ?? '').trim();
    if (!summary) throw new Error('Empty summary');
    return withCompressionMetadata(source, {
      messages: [{ name: 'Conversation summary', role: 'system', isUser: false, content: summary }, ...recent],
      compressed: true,
      strategy: 'auto-summary',
    });
  } catch {
    return withCompressionMetadata(source, {
      messages: recent,
      compressed: true,
      strategy: 'window',
      summaryFallback: true,
    });
  }
}

export function buildPromptMessages(systemPrompt, history = { messages: [] }, values = {}) {
  const historyMessages = Array.isArray(history.messages) ? history.messages : [];
  const historyText = values.history ?? formatHistoryText(historyMessages);
  const expanded = expandPrompt(systemPrompt, { ...values, history: historyText });
  const hasHistoryPlaceholder = /\{\{\s*history\s*\}\}/i.test(String(systemPrompt ?? ''));
  return {
    system: expanded,
    messages: hasHistoryPlaceholder ? [] : historyMessages,
  };
}

const getApiType = config => String(config?.type || 'openai').toLowerCase() === 'anthropic' ? 'anthropic' : String(config?.type || 'openai').toLowerCase();

const getApiKey = config => String(config?.key ?? config?.apiKey ?? '').trim();

const buildProviderHeaders = (config, signal) => {
  const type = getApiType(config);
  const key = getApiKey(config);
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (signal) headers.signal = signal;
  if (type === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
    if (key) headers['x-api-key'] = key;
  } else if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
};

export function buildCompletionRequest(config = {}, promptData = {}, signal) {
  const type = getApiType(config);
  const url = normalizeEndpoint(config.url, type, 'completion');
  const system = String(promptData.system ?? '').trim();
  const historyMessages = Array.isArray(promptData.messages) ? promptData.messages : [];
  const messages = system ? [{ role: 'system', content: system }, ...historyMessages] : historyMessages;
  const common = {
    model: String(config.model ?? '').trim(),
    temperature: Number(config.temperature ?? 0.9),
    top_p: Number(config.topP ?? config.top_p ?? 0.95),
  };
  const body = type === 'anthropic'
    ? {
      ...common,
      max_tokens: Number(config.maxTokens ?? config.max_tokens ?? 80),
      ...(system ? { system } : {}),
      messages: historyMessages,
    }
    : {
      ...common,
      max_tokens: Number(config.maxTokens ?? config.max_tokens ?? 80),
      stream: false,
      messages,
    };
  const headers = buildProviderHeaders(config);
  return {
    url,
    init: {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    },
  };
}

export function buildModelsRequest(config = {}) {
  const type = getApiType(config);
  const url = normalizeEndpoint(config.url, type, 'models');
  const fallbackUrls = type === 'lmstudio'
    ? [`${trimUrl(config.url).replace(/\/v1$/i, '')}/api/v1/models`]
    : [];
  return {
    url,
    fallbackUrls,
    init: {
      method: 'GET',
      headers: buildProviderHeaders(config),
    },
  };
}

export function parseProviderResponse(payload, apiType = 'openai') {
  const type = getApiType({ type: apiType });
  if (typeof payload === 'string') return payload;
  if (type === 'anthropic') {
    const textBlock = Array.isArray(payload?.content)
      ? payload.content.find(block => block?.type === 'text' && typeof block.text === 'string')
      : null;
    if (textBlock) return textBlock.text;
  }
  const choice = payload?.choices?.[0];
  if (typeof choice?.message?.content === 'string') return choice.message.content;
  if (typeof choice?.text === 'string') return choice.text;
  if (typeof payload?.output_text === 'string') return payload.output_text;
  throw new Error('API response did not contain text');
}

export function parseModelList(payload) {
  const entries = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload)
        ? payload
        : [];
  const names = entries
    .map(entry => typeof entry === 'string' ? entry : entry?.id ?? entry?.name ?? entry?.model)
    .map(value => String(value ?? '').trim())
    .filter(Boolean);
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

const createAbortError = message => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

const fetchJson = async (fetchImpl, url, init) => {
  const response = await fetchImpl(url, init);
  if (!response?.ok) throw new Error(`API request failed (${Number(response?.status) || 'unknown'})`);
  return response.json();
};

export async function requestCompletion(config = {}, promptData = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const AbortControllerImpl = dependencies.AbortController ?? globalThis.AbortController;
  const controller = AbortControllerImpl ? new AbortControllerImpl() : null;
  const timeoutMs = Math.max(0, Number(config.timeoutMs ?? 30000));
  const setTimer = dependencies.setTimeout ?? globalThis.setTimeout;
  const clearTimer = dependencies.clearTimeout ?? globalThis.clearTimeout;
  let timedOut = false;
  const timer = controller && timeoutMs > 0 && typeof setTimer === 'function'
    ? setTimer(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs)
    : null;
  const request = buildCompletionRequest(config, promptData, controller?.signal);
  try {
    const payload = await fetchJson(fetchImpl, request.url, request.init);
    return parseProviderResponse(payload, config.type);
  } catch (error) {
    if (timedOut) throw createAbortError('API request timed out');
    if (error?.name === 'AbortError') throw createAbortError('API request was cancelled');
    throw error instanceof Error ? error : new Error('API request failed');
  } finally {
    if (timer !== null && typeof clearTimer === 'function') clearTimer(timer);
  }
}

export async function requestModels(config = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const request = buildModelsRequest(config);
  const urls = [request.url, ...request.fallbackUrls];
  let lastError;
  for (const url of urls) {
    try {
      const payload = await fetchJson(fetchImpl, url, request.init);
      return parseModelList(payload);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Model discovery failed');
}

export function getInputElement(root, settingPath) {
  if (!root || typeof root.querySelectorAll !== 'function') return null;
  return [...root.querySelectorAll('[data-sqr-setting]')]
    .find(element => element.dataset?.sqrSetting === settingPath) ?? null;
}

const getNestedValue = (source, path) => String(path).split('.').reduce((value, key) => value?.[key], source);

const parseSettingValue = element => {
  if (element.type === 'checkbox') return Boolean(element.checked);
  if (element.type === 'number' || element.type === 'range') {
    const value = Number(element.value);
    return Number.isFinite(value) ? value : 0;
  }
  return element.value;
};

export function renderSettings(container, settings = {}, handlers = {}) {
  if (!container || typeof container.querySelectorAll !== 'function') return () => {};
  const listeners = [];
  const listen = (element, event, callback) => {
    if (!element?.addEventListener) return;
    element.addEventListener(event, callback);
    listeners.push(() => element.removeEventListener(event, callback));
  };
  const save = (path, value) => {
    if (typeof handlers.save === 'function') handlers.save(path, value);
  };
  const updateOutput = path => {
    const input = getInputElement(container, path);
    const output = [...container.querySelectorAll('[data-sqr-output]')]
      .find(element => element.dataset?.sqrOutput === path);
    if (input && output) output.value = input.value;
  };

  for (const element of container.querySelectorAll('[data-sqr-setting]')) {
    const path = element.dataset.sqrSetting;
    const value = getNestedValue(settings, path);
    if (element.type === 'checkbox') element.checked = Boolean(value);
    else if (value !== undefined && value !== null) element.value = String(value);
    updateOutput(path);
    const eventName = element.type === 'range' ? 'input' : 'change';
    listen(element, eventName, () => {
      const nextValue = parseSettingValue(element);
      updateOutput(path);
      save(path, nextValue);
    });
  }

  for (const button of container.querySelectorAll('[data-sqr-tab]')) {
    listen(button, 'click', () => {
      const targetId = button.dataset.sqrTab;
      for (const section of container.querySelectorAll('[data-sqr-section]')) section.hidden = section.id !== targetId;
      for (const tab of container.querySelectorAll('[data-sqr-tab]')) tab.classList.toggle('active', tab === button);
    });
  }

  const resetPosition = container.querySelector('#sqr-reset-position');
  listen(resetPosition, 'click', () => handlers.resetPosition?.());
  const resetPrompt = container.querySelector('#sqr-reset-prompt');
  listen(resetPrompt, 'click', () => handlers.resetPrompt?.());
  const fetchModels = container.querySelector('#sqr-fetch-models');
  listen(fetchModels, 'click', () => handlers.fetchModels?.());

  const modelSearch = container.querySelector('#sqr-model-search');
  const modelList = container.querySelector('#sqr-model-list');
  const filterModels = () => {
    const query = String(modelSearch?.value ?? '').trim().toLowerCase();
    for (const option of modelList?.options ?? []) option.hidden = query && !option.textContent.toLowerCase().includes(query);
  };
  listen(modelSearch, 'input', filterModels);
  listen(modelList, 'change', () => {
    const model = modelList.selectedOptions?.[0]?.value ?? '';
    const modelInput = container.querySelector('#sqr-model');
    if (modelInput) modelInput.value = model;
    if (model) save('api.model', model);
  });

  return () => listeners.splice(0).forEach(remove => remove());
}
