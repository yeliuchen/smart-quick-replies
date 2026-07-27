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
