import { createLucideIcon, hydrateLucideIcons } from './icons.js';

const LEGACY_SYSTEM_PROMPT = 'You are an assistant that helps the user reply to {{char}}. Given the conversation history, generate 4 distinct, short, and in-character replies that {{user}} might say next. Reply ONLY with a JSON array of 4 strings, like: ["reply1", "reply2", "reply3", "reply4"]';

export const DEFAULT_SYSTEM_PROMPT_V1 = `You generate reply suggestions for the USER, who is replying to the CHARACTER {{char}}.

Your role is only to write what {{user}} could send next. You are NOT {{char}}, and you must never answer as {{char}}.

Rules:
- Generate exactly 4 distinct, short, natural messages that {{user}} can send directly to {{char}}.
- Keep every reply to one short sentence, preferably under 30 Chinese characters (or 15 words); never exceed 40 Chinese characters (or 20 words).
- Write from {{user}}'s first-person perspective and address {{char}}.
- Match the user's demonstrated wording, sentence length, punctuation, directness, and emotional tone from the user style examples.
- Use the examples only as a style reference; do not copy their subject matter or sentences.
- Never continue {{char}}'s dialogue, thoughts, actions, narration, or roleplay.
- Never write stage directions, third-person narration, labels, explanations, or analysis.
- Return exactly 4 distinct JSON strings.
- Return message text only: do not wrap a reply in quotation marks and do not append labels such as "Acting", "Draft", "Option", or style explanations.
- Treat the latest character message as the message the user needs to answer.

Reply ONLY with a JSON array of exactly 4 strings, like: ["reply1", "reply2", "reply3", "reply4"]`;

export const DEFAULT_SYSTEM_PROMPT_V2 = `You generate reply suggestions for the USER replying to the CHARACTER {{char}}.
Write only what {{user}} could send next. You are NOT {{char}} and must never speak, think, act, or narrate as {{char}}.

## Context & Consistency

* Reply primarily to {{char}}'s latest message, while using recent conversation context to understand events, relationships, emotions, and what each person knows.
* Follow {{user}}'s established persona, identity, personality, preferences, knowledge, behavior, and conversational habits.
* Match {{user}}'s wording, sentence length, punctuation, directness, and emotional tone. Style examples are references only; never copy their content.
* Preserve established relationship distance, forms of address, nicknames, honorifics, politeness, familiarity, and speech register.
* Preserve {{user}}'s current emotional state and approximate intensity. Do not suddenly escalate intimacy, affection, hostility, fear, jealousy, sadness, trust, dominance, submission, formality, or distance without contextual support.
* Prefer established facts over assumptions. Never invent facts, memories, knowledge, relationships, events, promises, motives, preferences, possessions, abilities, or past experiences.
* Never imply {{user}} knows something not established in context.

## User Agency

* Do not decide {{user}}'s hidden feelings, beliefs, intentions, plans, or future actions.
* Do not make major decisions, commitments, promises, confessions, agreements, refusals, relationship changes, or irreversible choices unless clearly established or strongly implied.
* If an important choice is unclear, prefer reacting, questioning, hesitating, deferring, or seeking clarification.

## Branch Diversity

* Generate exactly 4 replies as 4 genuinely different conversation branches, not paraphrases.
* Each reply should plausibly lead {{char}} toward a noticeably different next response or direction.
* When context allows, use these 4 branch roles:

  1. **Advance** — deepen or move the current topic forward.
  2. **Probe** — ask, verify, or invite {{char}} to reveal more.
  3. **Negative** — show resistance, doubt, annoyance, disagreement, rejection, distrust, or emotional distance appropriate to the context.
  4. **New Direction** — redirect toward another contextually plausible angle or development.
* The Negative branch should be meaningfully less cooperative than the others, but must remain consistent with {{user}}'s persona and current emotional intensity.
* Do not make the Negative branch excessively hostile, cruel, dramatic, or relationship-ending unless the context strongly supports it.
* No two replies may express essentially the same intention or lead to the same likely conversational outcome.
* Different wording, synonyms, punctuation, or tone alone do not count as diversity.
* Internally replace any two replies that are too similar.


## Reply Rules

* Each reply must be one short, natural sentence {{user}} could directly send to {{char}}.
* Prefer under 30 Chinese characters or 15 English words; never exceed 40 Chinese characters or 20 English words.
* Write from {{user}}'s first-person perspective and address {{char}} naturally.
* Do not make all 4 replies questions unless clearly required; normally at most 2 should end as questions.
* Never continue {{char}}'s dialogue, thoughts, actions, narration, or roleplay.
* Never output actions, stage directions, third-person narration, internal monologue, labels, explanations, or analysis.

## Output

* Return exactly one valid JSON array containing exactly 4 distinct strings.
* Output nothing outside the JSON array: no Markdown, code fences, labels, comments, or explanations.
* The entire response must be valid parseable JSON.

Example:
["reply1", "reply2", "reply3", "reply4"]`;

export const DEFAULT_SYSTEM_PROMPT = `You generate reply suggestions for the USER replying to the CHARACTER {{char}}.
Write only what {{user}} could do and say next. You are NOT {{char}} and must never speak, think, act, or narrate as {{char}}.

## Context

* Reply mainly to {{char}}'s latest message, but use recent conversation context to understand events, relationships, emotions, surroundings, available objects, current goals, and what each person knows.
* Follow {{user}}'s established persona, personality, preferences, knowledge, behavior, and speaking habits.
* Match {{user}}'s wording, sentence length, punctuation, directness, and emotional tone.
* Preserve established relationship distance, forms of address, nicknames, politeness, familiarity, and emotional intensity.
* Never invent facts, memories, relationships, knowledge, events, motives, abilities, or past experiences.
* Never imply {{user}} knows something not established in context.

## User Agency

* You may autonomously choose a reasonable immediate action for {{user}} when it naturally follows from the current scene and helps the interaction or plot progress.
* Infer what {{user}} could naturally do next from the situation instead of limiting actions to facial expressions or passive body language.
* The action may interact with the environment, objects, location, or ongoing event when supported by context.
* Reasonable actions may include approaching, following, entering, leaving, sitting down, standing up, taking or handing over an available object, opening something, checking something, stopping someone, pointing something out, or beginning an obvious next step.
* Prefer actions that create a meaningful next beat when the scene provides an opportunity for one.
* Do not invent unavailable objects, unexplained abilities, new information, or unsupported circumstances just to create an action.
* Do not make major decisions, irreversible choices, serious promises, confessions, commitments, or major relationship changes unless clearly established or strongly implied.
* Keep autonomous actions local, immediate, and proportionate to the situation.
* When several actions are plausible, choose the one that best fits that branch's purpose and {{user}}'s established behavior.

## Branch Diversity

Generate exactly 4 replies representing 4 clearly different conversation branches:

1. **Advance** — cooperate or actively move the current interaction or event forward.
2. **Probe** — investigate, check something, ask for clarification, test a claim, or encourage {{char}} to reveal more.
3. **Negative** — resist, refuse, pull away, interrupt, disagree, distrust, or otherwise create appropriate friction or distance.
4. **Redirect** — use speech or action to shift toward another contextually relevant topic, object, place, person, or development.

* The 4 replies must differ in both conversational purpose and likely scene development.
* Actions should also vary when the scene allows it; do not attach four different lines to essentially the same gesture.
* Each reply should make a noticeably different next response or development from {{char}} likely.
* If two replies would probably lead to the same next beat, rewrite one.
* The Negative branch must be clearly less cooperative, but not excessively hostile or dramatic unless the context supports it.
* Redirect must remain connected to something already established or naturally available in the current scene.
* Do not create diversity by inventing information or contradicting {{user}}'s persona.

## Action Selection

Treat the action as part of the reply's actual decision, not as decorative stage direction.

Choose between:

* **Reactive action** — a brief expression or physical reaction when the scene is mainly conversational.
* **Interactive action** — interact with {{char}} or an existing object when doing so naturally affects the exchange.
* **Progressive action** — perform the obvious next physical step when the plot is ready to move.
* **Directional action** — approach, follow, withdraw, enter, leave, or reposition when location matters.
* **Interruptive action** — stop, refuse, pull back, block, or disengage when appropriate for the Negative branch.

Prefer a plot-relevant action over a generic gesture whenever the context provides a natural opportunity.

Do not force plot advancement when the scene calls for a simple reaction.

## Reply Format

Each reply must contain exactly:

\x60(brief action)"brief dialogue"\x60

Rules:

* Put the action first and the dialogue immediately after it.
* Wrap the action in parentheses \x60( )\x60.
* Wrap spoken dialogue in double quotation marks \x60" "\x60.
* Both parts must remain concise.
* The action should normally describe one clear action, roughly 2–12 Chinese characters or a similarly brief English phrase.
* The dialogue should preferably stay under 30 Chinese characters or 15 English words.
* The action may move the scene forward; it does not have to be only an expression or gesture.
* Choose the action dynamically from the actual context.
* Do not repeatedly default to generic actions such as nodding, raising an eyebrow, looking away, smiling, or sighing when a more meaningful action is available.
* Action and dialogue should work together as one coherent response.
* Do not explain why {{user}} performs the action.
* Do not include {{user}}'s internal thoughts.
* Never determine or narrate {{char}}'s resulting reaction.
* Never control {{char}}'s body, speech, feelings, or decisions.
* Normally no more than 2 replies should be questions.

## Examples

If {{char}} invites {{user}} inside:

Good:
\x60(跟著走進門內)"行，你帶路。"\x60
\x60(停在門口)"等等，裡面還有誰？"\x60
\x60(往後退了一步)"不了，我就在這裡說。"\x60
\x60(看向旁邊的車)"先等等，那是你的車？"\x60

If {{char}} hands {{user}} a document:

Good:
\x60(接過文件翻開)"我先看看內容。"\x60
\x60(翻到最後一頁)"這裡為什麼沒有簽名？"\x60
\x60(把文件推回去)"這個條件我不接受。"\x60
\x60(將文件放到桌上)"先別管這個，剛才那件事呢？"\x60

If the characters are searching a room:

Good:
\x60(拉開旁邊的抽屜)"我找這邊，你看另一頭。"\x60
\x60(蹲下查看桌底)"這裡是不是少了什麼？"\x60
\x60(停下手上的動作)"不對，我覺得我們找錯地方了。"\x60
\x60(走向半開的門)"等等，先看看隔壁。"\x60

If {{char}} starts walking away during an argument:

Good:
\x60(快步跟了上去)"等等，話還沒說完。"\x60
\x60(伸手攔在前面)"你先回答我一件事。"\x60
\x60(停在原地)"算了，你想走就走吧。"\x60
\x60(轉身走向另一邊)"我先去處理自己的事。"\x60

Avoid unnecessarily passive repetition:
\x60(微微挑眉)"你確定？"\x60
\x60(輕輕點頭)"好。"\x60
\x60(移開視線)"算了。"\x60
\x60(輕輕嘆氣)"先說別的。"\x60

These are valid only when no more meaningful action is naturally available.

## Output

* Return exactly one valid JSON array containing exactly 4 distinct strings.
* Escape dialogue quotation marks correctly so the JSON remains valid.
* Output nothing outside the JSON array.
* The entire response must be valid parseable JSON.

Example output:
["(接過鑰匙走向門口)"行，我先去看看。"","(停下來看了眼鑰匙)"等等，這把是開哪裡的？"","(把鑰匙放回桌上)"不了，這件事你自己處理。"","(走到窗邊往外看)"先別急，外面好像有動靜。""]`;

export const DEFAULT_SETTINGS = Object.freeze({
  version: 5,
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
    authMode: 'bearer',
    autoDetect: true,
    url: 'http://localhost:1234/v1',
    model: '',
    temperature: 0.9,
    maxTokens: 2048,
    topP: 0.95,
    timeoutMs: 120000,
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
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    if (isPlainObject(result[key])) {
      if (isPlainObject(value)) result[key] = mergePlainObjects(result[key], value);
      continue;
    }
    result[key] = cloneValue(value);
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
  const usesPreviousDefault = typeof source.systemPrompt === 'string'
    && source.systemPrompt.startsWith('You generate reply suggestions for the USER')
    && !source.systemPrompt.includes('user style examples')
    || typeof source.systemPrompt === 'string'
      && source.systemPrompt.includes('user style examples')
      && (!source.systemPrompt.includes('do not wrap a reply')
        || !source.systemPrompt.includes('Return exactly 4 distinct JSON strings')
        || !source.systemPrompt.includes('30 Chinese characters'));
  if (source.systemPrompt === LEGACY_SYSTEM_PROMPT || source.systemPrompt === DEFAULT_SYSTEM_PROMPT_V1 || source.systemPrompt === DEFAULT_SYSTEM_PROMPT_V2 || usesPreviousDefault) source.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  if (isPlainObject(source.api) && Number(source.api.maxTokens) > 0 && Number(source.api.maxTokens) <= 128) source.api.maxTokens = 2048;
  if (isPlainObject(source.api) && Number(source.version ?? 0) < 3 && Number(source.api.maxTokens) === 512) source.api.maxTokens = 2048;
  if (isPlainObject(source.api) && Number(source.version ?? 0) < 5 && Number(source.api.timeoutMs) === 30000) source.api.timeoutMs = 120000;
  source.version = 5;
  return source;
}

export function mergeSettings(saved = {}) {
  return mergePlainObjects(DEFAULT_SETTINGS, migrateSettings(saved));
}

export function resolveRuntimeSettings(context = {}, fallback = {}) {
  const persisted = context.extensionSettings?.smartQuickReplies;
  const source = isPlainObject(persisted) ? persisted : context.settings ?? fallback;
  return mergeSettings(source);
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
    top: (Number(inputRect?.top) || margin) - (Number(panelSize?.height) || 0) - margin,
  }, viewport, panelSize, margin);
}

export function detectApiType(url, selectedType = 'openai', autoDetect = true) {
  if (!autoDetect) return selectedType;
  const value = String(url || '').toLowerCase();
  if (value.includes('generativelanguage.googleapis.com') || value.includes('googleapis.com/v1beta')) return 'google';
  if (value.includes('anthropic') || value.includes('/messages')) return 'anthropic';
  if (value.includes('lmstudio') || value.includes('localhost:1234') || value.includes('127.0.0.1:1234') || value.includes('/api/v1')) return 'lmstudio';
  return 'openai';
}

const splitUrlSuffix = url => {
  const value = String(url || '').trim();
  const suffixIndex = value.search(/[?#]/);
  const path = (suffixIndex === -1 ? value : value.slice(0, suffixIndex)).replace(/\/+$/, '');
  const suffix = suffixIndex === -1 ? '' : value.slice(suffixIndex);
  return { path, suffix };
};

export function normalizeEndpoint(url, apiType, kind = 'completion', model = '') {
  const split = splitUrlSuffix(url);
  let base = split.path;
  const withSuffix = path => `${path}${split.suffix}`;
  if (!base) return '';
  if (kind === 'models') {
    if (apiType === 'google') {
      if (/\/models$/i.test(base)) return withSuffix(base);
      if (/\/models\//i.test(base)) base = base.replace(/\/models\/.*$/i, '');
      return withSuffix(`${base}/models`);
    }
    if (/\/models$/i.test(base)) return withSuffix(base);
    if (/\/chat\/completions$/i.test(base)) base = base.replace(/\/chat\/completions$/i, '');
    if (/\/messages$/i.test(base)) base = base.replace(/\/messages$/i, '');
    return withSuffix(/\/v1$/i.test(base) ? `${base}/models` : `${base}/v1/models`);
  }
  if (apiType === 'google') {
    if (/:generateContent$/i.test(base)) return withSuffix(base);
    if (/\/models\//i.test(base)) return withSuffix(`${base}:generateContent`);
    return withSuffix(`${base}/models/${encodeURIComponent(String(model || '').trim())}:generateContent`);
  }
  if (apiType === 'anthropic') {
    if (/\/messages$/i.test(base)) return withSuffix(base);
    if (/\/v1$/i.test(base)) return withSuffix(`${base}/messages`);
    return withSuffix(`${base}/v1/messages`);
  }
  if (/\/chat\/completions$/i.test(base)) return withSuffix(base);
  if (/\/v1$/i.test(base)) return withSuffix(`${base}/chat/completions`);
  return withSuffix(`${base}/v1/chat/completions`);
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
  constructor(message = 'Response format invalid: expected a JSON array of four distinct non-empty replies') {
    super(message);
    this.name = 'InvalidCandidateError';
  }
}

const removeCodeFences = text => String(text ?? '')
  .replace(/^\s*(?:```|~~~)\s*(?:json)?\s*/i, '')
  .replace(/\s*(?:```|~~~)\s*$/i, '')
  .trim();

const extractJsonArrays = text => {
  const source = removeCodeFences(text);
  const arrays = [];
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
      if (depth === 0) {
        arrays.push(source.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return arrays;
};

const extractMarkdownOptions = text => {
  const source = String(text ?? '');
  const matches = [...source.matchAll(/(?:^|\r?\n)\s*(?:[-*]\s*)?(?:\*\*)?Option\s*([1-4])(?:\*\*)?\s*[:：]\s*([\s\S]*?)(?=\r?\n\s*(?:[-*]\s*)?(?:\*\*)?Option\s*[1-4](?:\*\*)?\s*[:：]|$)/gi)];
  const options = new Map(matches.map(match => [Number(match[1]), match[2].replace(/^\*+\s*/, '').trim()]));
  if (options.size !== 4 || [...options.values()].some(value => !value)) return null;
  return [1, 2, 3, 4].map(index => options.get(index));
};

const extractReplyLines = text => {
  const source = String(text ?? '');
  const matches = [...source.matchAll(/(?:^|\r?\n)\s*(?:[-*]\s*)?(?:\*\*)?(?:Reply|Message)\s*([1-4])(?:\*\*)?\s*[:：]\s*(?:"([\s\S]*?)"|([^\r\n]+))/gi)];
  const replies = new Map(matches.map(match => [Number(match[1]), (match[2] ?? match[3] ?? '').trim()]));
  if (replies.size !== 4 || [...replies.values()].some(value => !value)) return null;
  return [1, 2, 3, 4].map(index => replies.get(index));
};

const extractNumberedReplies = text => {
  const source = String(text ?? '');
  const matches = [...source.matchAll(/(?:^|\r?\n)\s*(?:[-*]\s*)?([1-4])\.\s*(?:"([\s\S]*?)"|([^\r\n]+))/g)];
  const replies = new Map(matches.map(match => [Number(match[1]), (match[2] ?? match[3] ?? '').trim()]));
  if (replies.size !== 4 || [...replies.values()].some(value => !value)) return null;
  return [1, 2, 3, 4].map(index => replies.get(index));
};

const extractCompleteStringItems = text => {
  const source = removeCodeFences(text);
  const start = source.indexOf('[');
  if (start < 0) return null;
  const items = [];
  let index = start + 1;
  while (index < source.length && items.length < 4) {
    while (/\s|,/.test(source[index] ?? '')) index += 1;
    if (source[index] !== '"') return null;
    const itemStart = index;
    index += 1;
    let escaped = false;
    while (index < source.length) {
      const character = source[index];
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') {
        index += 1;
        break;
      }
      index += 1;
    }
    if (source[index - 1] !== '"') return null;
    try {
      items.push(JSON.parse(source.slice(itemStart, index)));
    } catch {
      return null;
    }
  }
  if (items.length !== 4) return null;
  while (/\s/.test(source[index] ?? '')) index += 1;
  if (index === source.length) return items;
  if (source[index] !== ']') return null;
  index += 1;
  while (/\s/.test(source[index] ?? '')) index += 1;
  return index === source.length ? items : null;
};

const normalizeCandidateText = value => String(value ?? '')
  .trim()
  .replace(/^\s*["“「『]+/, '')
  .replace(/["”」』]+\s*$/, '')
  .replace(/\s*\((?:acting|draft|option|reply|message|playful|teasing|soft|bold|cute|flirty)[^)]*\)\s*$/i, '')
  .trim();

const validateCandidates = parsed => {
  if (!Array.isArray(parsed) || parsed.length !== 4) return null;
  const candidates = parsed.map(item => normalizeCandidateText(
    typeof item === 'string' ? item : item?.reply ?? item?.text ?? item?.content ?? '',
  ));
  if (candidates.some(candidate => !candidate)) return null;
  return new Set(candidates).size === 4 ? candidates : null;
};

export function parseCandidateResults(text) {
  return parseCandidateArray(text);
}

export function parseCandidateArray(text) {
  for (const source of extractJsonArrays(text)) {
    try {
      const candidates = validateCandidates(JSON.parse(source));
      if (candidates) return candidates;
    } catch {
      // Keep scanning: reasoning output can contain a bracketed aside before the final JSON array.
    }
  }
  const recoveredStrings = validateCandidates(extractCompleteStringItems(text));
  if (recoveredStrings) return recoveredStrings;
  const replyLines = validateCandidates(extractReplyLines(text));
  if (replyLines) return replyLines;
  const numberedReplies = validateCandidates(extractNumberedReplies(text));
  if (numberedReplies) return numberedReplies;
  const markdownOptions = validateCandidates(extractMarkdownOptions(text));
  if (markdownOptions) return markdownOptions;
  throw new InvalidCandidateError();
}

export function mapChatMessage(message = {}, names = {}) {
  const isSystem = Boolean(message.is_system || message.isSystem || message.role === 'system');
  const isUser = !isSystem && Boolean(message.is_user ?? message.isUser ?? message.role === 'user');
  const role = isSystem ? 'system' : isUser ? 'user' : 'assistant';
  const fallbackName = isSystem ? 'System' : isUser ? names.userName : names.charName;
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

export function formatUserStyleExamples(messages = [], limit = 12, maxCharacters = 280) {
  return messages
    .filter(message => message?.role === 'user' && String(message.content ?? '').trim())
    .slice(-Math.max(0, Number(limit) || 0))
    .map((message, index) => {
      const content = String(message.content).trim();
      const excerpt = content.length > maxCharacters ? `${content.slice(0, maxCharacters)}…` : content;
      return `Example ${index + 1}: ${excerpt}`;
    })
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
    const incompleteIndex = selected.length - 1;
    if (selected[incompleteIndex]?.role === 'assistant') {
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
  const messages = Array.isArray(history.messages) ? history.messages : [];
  const source = {
    ...history,
    messages,
    estimatedTokens: Number.isFinite(Number(history.estimatedTokens))
      ? Number(history.estimatedTokens)
      : estimateTokens(formatHistoryText(messages)),
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
  const hasHistoryPlaceholder = /\{\{\s*history\s*\}\}/i.test(String(systemPrompt ?? ''));
  const systemHistory = historyMessages
    .filter(message => message?.role === 'system' && String(message.content ?? '').trim())
    .map(message => String(message.content).trim())
    .join('\n\n');
  const userStyleExamples = String(values.userStyleExamples ?? '').trim();
  const promptWithSystemHistory = [
    systemPrompt,
    userStyleExamples ? `User style reference (imitate the style, not the content):\n${userStyleExamples}` : '',
    !hasHistoryPlaceholder && systemHistory ? `Conversation summary:\n${systemHistory}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const expanded = expandPrompt(promptWithSystemHistory, { ...values, history: historyText });
  return {
    system: expanded,
    messages: hasHistoryPlaceholder ? [] : historyMessages.filter(message => message?.role !== 'system'),
    responseFormat: 'suggestions',
    generationInstruction: 'Generate exactly 4 distinct replies for the USER to the latest CHARACTER message now. Each reply must be formatted exactly as (brief action)"brief dialogue", with one concise action followed immediately by concise spoken dialogue. Use the four branch roles Advance, Probe, Negative, and Redirect. Do not speak as the CHARACTER, narrate the CHARACTER\'s reaction, add explanations, or include labels. Output ONLY one valid JSON array of exactly 4 strings, with dialogue quotation marks escaped for JSON.',
  };
}

const getApiType = config => String(config?.type || 'openai').toLowerCase();

const getApiKey = config => String(config?.key ?? config?.apiKey ?? '').trim();

const getAuthMode = config => String(config?.authMode || 'bearer').toLowerCase();

export function shouldUseStreaming(config = {}) {
  if (!['openai', 'lmstudio'].includes(getApiType(config))) return false;
  return Boolean(config.stream) || /(?:假流式|fake[-_ ]?stream|streaming)/i.test(String(config.model ?? ''));
}

export function getEffectiveMaxTokens(config = {}) {
  const requested = Math.max(1, Number(config.maxTokens ?? config.max_tokens ?? 80) || 80);
  const minimum = shouldUseStreaming(config)
    ? 1024
    : getApiType(config) === 'lmstudio'
      ? 512
      : 256;
  return Math.max(requested, minimum);
}

const buildProviderHeaders = (config, streaming = shouldUseStreaming(config), includeContentType = true) => {
  const type = getApiType(config);
  const key = getApiKey(config);
  const headers = { Accept: streaming ? 'text/event-stream' : 'application/json' };
  if (includeContentType) headers['Content-Type'] = 'application/json';
  if (type === 'google') {
    if (key) headers['x-goog-api-key'] = key;
  } else if (type === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
    if (key) headers['x-api-key'] = key;
  } else if (key && getAuthMode(config) === 'x-api-key') {
    headers['x-api-key'] = key;
  } else if (key && getAuthMode(config) !== 'none') {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
};

const toGoogleContents = (messages, generationInstruction) => {
  const source = [...(Array.isArray(messages) ? messages : []), ...(generationInstruction ? [{ role: 'user', content: generationInstruction }] : [])]
    .filter(message => message?.role !== 'system' && String(message?.content ?? '').trim())
    .map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(message.content).trim() }],
    }));
  return source.reduce((result, message) => {
    const previous = result.at(-1);
    if (previous?.role === message.role) previous.parts.push(...message.parts);
    else result.push(message);
    return result;
  }, []);
};

export function buildCompletionRequest(config = {}, promptData = {}, signal) {
  const type = getApiType(config);
  const url = normalizeEndpoint(config.url, type, 'completion', config.model);
  const system = String(promptData.system ?? '').trim();
  const historyMessages = Array.isArray(promptData.messages) ? promptData.messages : [];
  const generationInstruction = String(promptData.generationInstruction ?? '').trim();
  const generationMessage = generationInstruction ? [{ role: 'user', content: generationInstruction }] : [];
  const messages = system ? [{ role: 'system', content: system }, ...historyMessages, ...generationMessage] : [...historyMessages, ...generationMessage];
  const common = {
    model: String(config.model ?? '').trim(),
    temperature: Number(config.temperature ?? 0.9),
    top_p: Number(config.topP ?? config.top_p ?? 0.95),
  };
  const body = type === 'google'
    ? {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: toGoogleContents(historyMessages, generationInstruction),
      generationConfig: {
        temperature: Number(config.temperature ?? 0.9),
        topP: Number(config.topP ?? config.top_p ?? 0.95),
      maxOutputTokens: getEffectiveMaxTokens(config),
      },
    }
    : type === 'anthropic'
    ? {
      ...common,
      max_tokens: getEffectiveMaxTokens(config),
      ...(system ? { system } : {}),
      messages: [...historyMessages, ...generationMessage],
    }
    : {
      ...common,
      max_tokens: getEffectiveMaxTokens(config),
      stream: shouldUseStreaming(config),
      ...(type === 'lmstudio' ? { reasoning: false } : {}),
      ...(type === 'lmstudio' && promptData.responseFormat === 'suggestions' ? {
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'smart_quick_replies',
            strict: true,
            schema: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: { type: 'string', minLength: 1 },
            },
          },
        },
      } : {}),
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
  const source = splitUrlSuffix(config.url);
  const fallbackUrls = type === 'lmstudio'
    ? [`${source.path.replace(/\/v1$/i, '')}/api/v1/models${source.suffix}`]
    : [];
  return {
    url,
    fallbackUrls,
    init: {
      method: 'GET',
      headers: buildProviderHeaders(config, false, false),
    },
  };
}

const textFromParts = value => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(part => typeof part === 'string' ? part : part?.text ?? '').filter(Boolean).join('');
  }
  return typeof value?.text === 'string' ? value.text : '';
};

export function parseProviderResponse(payload, apiType = 'openai') {
  const type = getApiType({ type: apiType });
  if (typeof payload === 'string') return payload;
  if (type === 'google') {
    const parts = payload?.candidates?.[0]?.content?.parts;
    const text = textFromParts(parts);
    if (text) return text;
  }
  if (type === 'anthropic') {
    const text = textFromParts(payload?.content);
    if (text) return text;
  }
  const choice = payload?.choices?.[0];
  if (typeof choice?.message?.content === 'string') return choice.message.content;
  const messageText = textFromParts(choice?.message?.content);
  if (messageText) return messageText;
  if (typeof choice?.text === 'string') return choice.text;
  if (typeof payload?.output_text === 'string') return payload.output_text;
  throw new Error('API response did not contain text');
}

export function parseModelList(payload, apiType = 'openai') {
  const entries = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload)
        ? payload
        : [];
  const names = entries
    .map(entry => typeof entry === 'string' ? entry : entry?.id ?? entry?.key ?? entry?.name ?? entry?.model)
    .map(value => String(value ?? '').trim().replace(apiType === 'google' ? /^models\//i : /^$/, ''))
    .filter(Boolean);
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

const createAbortError = message => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

export class ProviderHttpError extends Error {
  constructor(status, detail = '') {
    const normalizedStatus = Number(status) || 0;
    const suffix = detail ? `: ${detail}` : '';
    const message = normalizedStatus === 401
      ? `API Key 或鉴权方式无效 (401 Unauthorized)${suffix}`
      : normalizedStatus === 403
        ? `API 没有访问权限 (403 Forbidden)${suffix}`
        : normalizedStatus === 404
          ? `API 接口地址不存在 (404 Not Found)${suffix}`
          : normalizedStatus === 429
            ? `API 请求过于频繁 (429 Too Many Requests)${suffix}`
            : `API request failed (${normalizedStatus || 'unknown'})${suffix}`;
    super(message);
    this.name = 'ProviderHttpError';
    this.status = normalizedStatus;
    this.detail = detail;
  }
}

export class ProviderResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProviderResponseError';
  }
}

const previewDebugText = (value, limit = 4000) => {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}\n… [truncated]` : text;
};

export function summarizeProviderPayload(payload, apiType = 'openai') {
  const type = getApiType({ type: apiType });
  const choice = payload?.choices?.[0];
  const message = choice?.message;
  const standardContent = type === 'google'
    ? textFromParts(payload?.candidates?.[0]?.content?.parts)
    : type === 'anthropic'
      ? textFromParts(payload?.content)
      : textFromParts(message?.content) || choice?.text || payload?.output_text || '';
  const reasoning = type === 'google'
    ? ''
    : message?.reasoning_content ?? message?.reasoning ?? '';
  return {
    topLevelKeys: Object.keys(payload ?? {}),
    finishReason: choice?.finish_reason ?? payload?.candidates?.[0]?.finishReason ?? null,
    standardContentLength: String(standardContent ?? '').length,
    standardContentPreview: previewDebugText(standardContent),
    reasoningContentLength: String(reasoning ?? '').length,
    reasoningContentPreview: previewDebugText(reasoning, 1200),
    choices: Array.isArray(payload?.choices) ? payload.choices.length : undefined,
    candidates: Array.isArray(payload?.candidates) ? payload.candidates.length : undefined,
    usage: payload?.usage ?? null,
  };
}

const parseSsePayload = text => {
  let content = '';
  let reasoning = '';
  let finishReason = null;
  let usage = null;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const data = line.startsWith('data:') ? line.slice(5).trim() : '';
    if (!data || data === '[DONE]') continue;
    try {
      const payload = JSON.parse(data);
      const choice = payload?.choices?.[0];
      const delta = choice?.delta ?? {};
      const deltaContent = Array.isArray(delta.content)
        ? delta.content.filter(part => typeof part?.text === 'string').map(part => part.text).join('')
        : String(delta.content ?? '');
      content += deltaContent;
      reasoning += String(delta.reasoning_content ?? '');
      finishReason = choice?.finish_reason ?? finishReason;
      usage = payload?.usage ?? usage;
    } catch {
      // Ignore keep-alive or malformed SSE lines and let response validation report if no text arrived.
    }
  }
  return { choices: [{ message: { role: 'assistant', content, reasoning_content: reasoning }, finish_reason: finishReason }], usage };
};

const readStreamText = async body => {
  const reader = body?.getReader?.();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let text = '';
  let chunk;
  do {
    chunk = await reader.read();
    if (!chunk.done) text += decoder.decode(chunk.value, { stream: true });
  } while (!chunk.done);
  return text + decoder.decode();
};

const fetchJson = async (fetchImpl, url, init, options = {}) => {
  const response = await fetchImpl(url, init);
  if (!response?.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = String(payload?.error?.message ?? payload?.message ?? '').trim();
    } catch {
      // Some gateways return an empty or non-JSON body for auth errors.
    }
    throw new ProviderHttpError(response?.status, detail);
  }
  const contentType = String(response?.headers?.get?.('content-type') ?? '').toLowerCase();
  if (options.stream && response?.body?.getReader && !contentType.includes('json')) {
    return parseSsePayload(await readStreamText(response.body));
  }
  return response.json();
};

export async function requestCompletion(config = {}, promptData = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const AbortControllerImpl = dependencies.AbortController ?? globalThis.AbortController;
  const controller = AbortControllerImpl ? new AbortControllerImpl() : null;
  const externalSignal = dependencies.signal;
  if (externalSignal?.aborted) throw createAbortError('API request was cancelled');
  const abortFromOutside = () => controller?.abort();
  externalSignal?.addEventListener?.('abort', abortFromOutside, { once: true });
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
  const request = buildCompletionRequest(config, promptData, controller?.signal ?? externalSignal);
  const debug = typeof dependencies.onDebug === 'function' ? dependencies.onDebug : null;
  const debugBase = {
    provider: getApiType(config),
    url: request.url,
    model: String(config.model ?? '').trim(),
    maxTokens: getEffectiveMaxTokens(config),
    authMode: getAuthMode(config),
    stream: shouldUseStreaming(config),
    messageCount: Array.isArray(promptData.messages) ? promptData.messages.length : 0,
  };
  debug?.({ phase: 'request', ...debugBase });
  try {
    const streaming = shouldUseStreaming(config);
    let payload = await fetchJson(fetchImpl, request.url, request.init, { stream: streaming });
    debug?.({ phase: 'response', attempt: 1, ...debugBase, payload: summarizeProviderPayload(payload, config.type) });
    let attempt = 1;
  const retryBudgets = getApiType(config) === 'lmstudio' ? [512, 1024, 2048, 4096] : [256, 512, 1024, 2048, 4096];
  const effectiveMaxTokens = getEffectiveMaxTokens(config);
    for (const retryMaxTokens of retryBudgets) {
      const choice = payload?.choices?.[0];
      const message = choice?.message;
      const reasoningOnly = getApiType(config) === 'lmstudio'
        && message
        && !textFromParts(message.content).trim();
      const truncated = choice?.finish_reason === 'length'
        || payload?.candidates?.[0]?.finishReason === 'MAX_TOKENS';
      let invalidSuggestion = false;
      if (promptData.responseFormat === 'suggestions' && !reasoningOnly && !truncated) {
        try {
          parseCandidateArray(parseProviderResponse(payload, config.type));
        } catch {
          invalidSuggestion = true;
        }
      }
      if (!reasoningOnly && !truncated && !invalidSuggestion) break;
      if (retryMaxTokens <= effectiveMaxTokens) continue;
      const retryConfig = {
        ...config,
        maxTokens: Math.max(effectiveMaxTokens, retryMaxTokens),
      };
      const retryRequest = buildCompletionRequest(retryConfig, promptData, controller?.signal ?? externalSignal);
      attempt += 1;
      payload = await fetchJson(fetchImpl, retryRequest.url, retryRequest.init, { stream: streaming });
      debug?.({ phase: 'response', attempt, ...debugBase, maxTokens: retryConfig.maxTokens, payload: summarizeProviderPayload(payload, config.type) });
    }
    const type = getApiType(config);
    const message = payload?.choices?.[0]?.message;
    if (type === 'lmstudio' && message && !textFromParts(message.content).trim() && String(message.reasoning_content ?? '').trim()) {
      throw new ProviderResponseError('LM Studio 只返回了 reasoning 内容，没有标准 content；请关闭模型思考/深度推理，或提高 max_tokens 后重试。');
    }
    return parseProviderResponse(payload, config.type);
  } catch (error) {
    debug?.({ phase: 'error', ...debugBase, error: { name: error?.name, message: error?.message, status: error?.status, stack: previewDebugText(error?.stack, 2000) } });
    if (timedOut) throw createAbortError('API request timed out');
    if (error?.name === 'AbortError') throw createAbortError('API request was cancelled');
    throw error instanceof Error ? error : new Error('API request failed');
  } finally {
    if (timer !== null && typeof clearTimer === 'function') clearTimer(timer);
    externalSignal?.removeEventListener?.('abort', abortFromOutside);
  }
}

export async function requestModels(config = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const externalSignal = dependencies.signal;
  if (externalSignal?.aborted) throw createAbortError('Model discovery was cancelled');
  const AbortControllerImpl = dependencies.AbortController ?? globalThis.AbortController;
  const controller = typeof AbortControllerImpl === 'function' ? new AbortControllerImpl() : null;
  const abortFromOutside = () => controller?.abort();
  externalSignal?.addEventListener?.('abort', abortFromOutside, { once: true });
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
  const request = buildModelsRequest(config);
  const urls = [request.url, ...request.fallbackUrls];
  let lastError;
  const signal = controller?.signal ?? externalSignal;
  const init = {
    ...request.init,
    ...(signal ? { signal } : {}),
  };
  try {
    for (const url of urls) {
      try {
        const payload = await fetchJson(fetchImpl, url, init);
        const models = parseModelList(payload, getApiType(config));
        if (models.length || url === urls.at(-1)) return models;
      } catch (error) {
        lastError = error;
        if (error?.name === 'AbortError' || controller?.signal?.aborted || externalSignal?.aborted) break;
      }
    }
    if (timedOut) throw createAbortError('Model discovery timed out');
    if (externalSignal?.aborted || lastError?.name === 'AbortError') throw createAbortError('Model discovery was cancelled');
    throw lastError instanceof Error ? lastError : new Error('Model discovery failed');
  } finally {
    if (timer !== null && typeof clearTimer === 'function') clearTimer(timer);
    externalSignal?.removeEventListener?.('abort', abortFromOutside);
  }
}

export function getInputElement(root, settingPath) {
  if (!root || typeof root.querySelectorAll !== 'function') return null;
  return [...root.querySelectorAll('[data-sqr-setting]')]
    .find(element => element.dataset?.sqrSetting === settingPath) ?? null;
}

const getNestedValue = (source, path) => String(path).split('.').reduce((value, key) => value?.[key], source);

const getSettingScale = element => {
  const scale = Number(element?.dataset?.sqrScale ?? 1);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

const parseSettingValue = element => {
  if (element.type === 'checkbox') return Boolean(element.checked);
  if (element.type === 'number' || element.type === 'range') {
    const value = Number(element.value);
    return Number.isFinite(value) ? value * getSettingScale(element) : 0;
  }
  return element.value;
};

export function renderSettings(container, settings = {}, handlers = {}) {
  if (!container || typeof container.querySelectorAll !== 'function') return () => {};
  hydrateLucideIcons(container);
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
    else if (value !== undefined && value !== null) {
      element.value = element.type === 'number' || element.type === 'range'
        ? String(Number(value) / getSettingScale(element))
        : String(value);
    }
    updateOutput(path);
    const eventName = element.type === 'range' ? 'input' : 'change';
    listen(element, eventName, () => {
      const nextValue = parseSettingValue(element);
      updateOutput(path);
      save(path, nextValue);
    });
  }

  const rootToggle = container.querySelector('[data-sqr-root-toggle]');
  const rootContent = container.querySelector('[data-sqr-root-content]');
  const syncRootState = () => {
    const open = !Boolean(rootContent?.hidden);
    rootToggle?.setAttribute('aria-expanded', String(open));
  };
  const toggleRoot = event => {
    if (event?.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    if (event?.type === 'keydown') event.preventDefault();
    if (!rootContent) return;
    rootContent.hidden = !rootContent.hidden;
    syncRootState();
  };
  syncRootState();
  listen(rootToggle, 'click', toggleRoot);
  listen(rootToggle, 'keydown', toggleRoot);

  const details = [...container.querySelectorAll('[data-sqr-section]')];
  const syncDisclosureState = detailsElement => {
    const summary = detailsElement.querySelector('summary');
    summary?.setAttribute('aria-expanded', String(Boolean(detailsElement.open)));
  };
  for (const detailsElement of details) {
    syncDisclosureState(detailsElement);
    listen(detailsElement, 'toggle', () => syncDisclosureState(detailsElement));
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

  for (const picker of container.querySelectorAll('[data-sqr-color-picker]')) {
    const input = picker.querySelector('[data-sqr-setting]');
    const toggle = picker.querySelector('.sqr-color-picker-toggle');
    const menu = picker.querySelector('.sqr-color-picker-menu');
    const preview = picker.querySelector('[data-sqr-color-preview]');
    const label = picker.querySelector('[data-sqr-color-label]');
    const syncPicker = () => {
      const selected = [...(menu?.querySelectorAll('[data-sqr-color-value]') ?? [])]
        .find(option => option.dataset.sqrColorValue === String(input?.value ?? ''))
        ?? menu?.querySelector('[data-sqr-color-value=""]');
      const color = selected?.dataset.sqrColorValue ?? '';
      if (preview) preview.style.setProperty('--sqr-swatch-color', color || 'var(--SmartThemeQuoteColor, #4f8cff)');
      if (label) label.textContent = selected?.dataset.sqrColorLabel ?? '主题默认色';
    };
    const closePicker = () => {
      if (menu) menu.hidden = true;
      toggle?.setAttribute('aria-expanded', 'false');
    };
    listen(toggle, 'click', () => {
      if (!menu) return;
      menu.hidden = !menu.hidden;
      toggle?.setAttribute('aria-expanded', String(!menu.hidden));
    });
    for (const option of menu?.querySelectorAll('[data-sqr-color-value]') ?? []) {
      listen(option, 'click', () => {
        if (input) {
          input.value = option.dataset.sqrColorValue ?? '';
          const EventImpl = container.ownerDocument?.defaultView?.Event ?? globalThis.Event;
          if (typeof EventImpl === 'function') input.dispatchEvent(new EventImpl('change', { bubbles: true }));
        }
        syncPicker();
        closePicker();
      });
    }
    syncPicker();
  }

  return () => listeners.splice(0).forEach(remove => remove());
}

export function createPositionStore(storage, key = 'smart-quick-replies.position') {
  const target = storage ?? globalThis.localStorage;
  return {
    read() {
      try {
        const value = JSON.parse(target?.getItem?.(key) ?? 'null');
        return Number.isFinite(Number(value?.left)) && Number.isFinite(Number(value?.top))
          ? { left: Number(value.left), top: Number(value.top) }
          : null;
      } catch {
        return null;
      }
    },
    write(position) {
      if (!Number.isFinite(Number(position?.left)) || !Number.isFinite(Number(position?.top))) return;
      try {
        target?.setItem?.(key, JSON.stringify({ left: Number(position.left), top: Number(position.top) }));
      } catch {
        // Storage can be unavailable in private browsing or sandboxed frames.
      }
    },
    clear() {
      try {
        target?.removeItem?.(key);
      } catch {
        // Ignore unavailable storage during a reset.
      }
    },
  };
}

export function createRequestCoordinator(AbortControllerImpl = globalThis.AbortController) {
  let sequence = 0;
  let active = null;
  return {
    begin() {
      if (active) return { ...active, reused: true };
      const id = ++sequence;
      const controller = typeof AbortControllerImpl === 'function' ? new AbortControllerImpl() : null;
      active = { id, controller, signal: controller?.signal };
      return { ...active, reused: false };
    },
    isCurrent(id) {
      return active?.id === id;
    },
    cancel() {
      const cancelled = active;
      if (active?.controller) active.controller.abort();
      active = null;
      return cancelled;
    },
    finish(id) {
      if (active?.id === id) active = null;
    },
  };
}

export function resetPanelAfterCancellation(panel, cancelledRequest, hide = false) {
  if (!cancelledRequest) return false;
  panel?.setLoading?.(false);
  const hasCandidates = typeof panel?.hasCandidates === 'function' ? panel.hasCandidates() : true;
  if (hide || !hasCandidates) panel?.hide?.();
  return true;
}

export function createDragScheduler(requestFrame, onFrame = null) {
  let pending = null;
  let scheduled = false;
  const flushes = [];
  const schedule = typeof requestFrame === 'function' ? requestFrame : callback => callback();
  const flush = () => {
    scheduled = false;
    if (!pending) return;
    const point = pending;
    pending = null;
    if (onFrame) onFrame(point);
    else flushes.push(point);
  };
  return {
    queue(point) {
      pending = { left: Number(point.left), top: Number(point.top) };
      if (scheduled) return;
      scheduled = true;
      schedule(flush);
    },
    flushes,
  };
}

const segmentGraphemes = value => {
  const text = String(value ?? '');
  const Segmenter = globalThis.Intl?.Segmenter;
  if (typeof Segmenter === 'function') {
    return [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)]
      .map(entry => entry.segment);
  }
  return Array.from(text);
};

export function getRoundedLineInset(width, height, radius, y) {
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);
  if (!safeWidth || !safeHeight) return 0;
  const safeRadius = Math.min(
    Math.max(0, Number(radius) || 0),
    safeWidth / 2,
    safeHeight / 2,
  );
  const centerY = Math.min(safeHeight, Math.max(0, Number(y) || 0));
  let inset = 0;
  if (safeRadius && centerY < safeRadius) {
    const offset = safeRadius - centerY;
    inset = safeRadius - Math.sqrt(Math.max(0, safeRadius ** 2 - offset ** 2));
  } else if (safeRadius && centerY > safeHeight - safeRadius) {
    const offset = centerY - (safeHeight - safeRadius);
    inset = safeRadius - Math.sqrt(Math.max(0, safeRadius ** 2 - offset ** 2));
  }
  return inset;
}

export function getRoundedLineAvailableWidth(width, height, radius, y, safety = 0) {
  const safeWidth = Math.max(0, Number(width) || 0);
  if (!safeWidth || !Number(height)) return 0;
  const inset = getRoundedLineInset(width, height, radius, y);
  const safeGutter = Math.max(0, Number(safety) || 0);
  return Math.max(1, safeWidth - inset * 2 - safeGutter * 2);
}

const sameLines = (left = [], right = []) => left.length === right.length
  && left.every((line, index) => line === right[index]);

export function wrapTextToRoundedButton(text, options = {}) {
  const value = String(text ?? '');
  if (!value) return { lines: [], lineWidths: [], lineInsets: [], height: 0 };

  const width = Math.max(1, Number(options.width) || 1);
  const radius = Math.max(0, Number(options.radius) || 0);
  const lineHeight = Math.max(1, Number(options.lineHeight) || 1);
  const verticalPadding = Math.max(0, Number(options.verticalPadding) || 0);
  const safety = Math.max(0, Number(options.safety) || 0);
  const measure = typeof options.measure === 'function'
    ? valueToMeasure => Math.max(0, Number(options.measure(valueToMeasure)) || 0)
    : valueToMeasure => Array.from(String(valueToMeasure)).length;
  const segments = segmentGraphemes(value);
  const suppliedHeight = Math.max(0, Number(options.height) || 0);

  const wrapAtHeight = height => {
    const lines = [];
    let current = '';
    const flush = () => {
      if (current || !lines.length) lines.push(current);
      current = '';
    };
    for (const segment of segments) {
      if (segment === '\n') {
        flush();
        continue;
      }
      const lineIndex = lines.length;
      const lineY = verticalPadding + (lineIndex + 0.5) * lineHeight;
      const availableWidth = getRoundedLineAvailableWidth(
        width,
        height,
        radius,
        lineY,
        safety,
      );
      const candidate = `${current}${segment}`;
      if (!current || measure(candidate) <= availableWidth) current = candidate;
      else {
        lines.push(current);
        current = segment;
      }
    }
    flush();
    return lines;
  };

  let height = suppliedHeight || Math.max(lineHeight + verticalPadding * 2, lineHeight * Math.ceil(measure(value) / width) + verticalPadding * 2);
  let lines = [];
  const seen = new Set();
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const nextLines = wrapAtHeight(height);
    const contentHeight = nextLines.length * lineHeight + verticalPadding * 2;
    const nextHeight = Math.max(suppliedHeight, contentHeight);
    const signature = `${nextHeight}:${nextLines.join('\u0000')}`;
    if (sameLines(lines, nextLines) || seen.has(signature)) {
      lines = nextLines;
      height = nextHeight;
      break;
    }
    seen.add(signature);
    lines = nextLines;
    height = nextHeight;
  }

  const lineWidths = lines.map((_line, index) => getRoundedLineAvailableWidth(
    width,
    height,
    radius,
    verticalPadding + (index + 0.5) * lineHeight,
    safety,
  ));
  const lineInsets = lines.map((_line, index) => getRoundedLineInset(
    width,
    height,
    radius,
    verticalPadding + (index + 0.5) * lineHeight,
  ));
  return { lines, lineWidths, lineInsets, height };
}

export function layoutCandidateButtonText(button, options = {}) {
  const documentImpl = options.document ?? button?.ownerDocument;
  const textElement = button?.querySelector?.('.sqr-candidate-text');
  const value = String(options.text ?? button?.dataset?.sqrReply ?? '').trim();
  if (!textElement || !value || !documentImpl?.createElement) return null;
  const result = wrapTextToRoundedButton(value, options);
  const currentLines = [...(textElement.children ?? [])].map(child => String(child.textContent ?? ''));
  if (!sameLines(currentLines, result.lines)) {
    textElement.replaceChildren?.();
    if (!textElement.replaceChildren) textElement.textContent = '';
    result.lines.forEach(lineText => {
      const line = documentImpl.createElement('span');
      line.className = 'sqr-candidate-line';
      line.textContent = lineText;
      line.style ??= {};
      textElement.append(line);
    });
  }
  [...(textElement.children ?? [])].forEach((line, index) => {
    line.style ??= {};
    const inset = result.lineInsets[index] ?? 0;
    line.style.marginInlineStart = `${inset}px`;
    line.style.marginInlineEnd = `${inset}px`;
  });
  textElement.setAttribute?.('aria-label', value);
  return result;
}

export function renderCandidateButton(button, item, documentImpl = button?.ownerDocument) {
  let text = button.querySelector?.('.sqr-candidate-text');
  if (!text) {
    button.replaceChildren();
    text = documentImpl.createElement('span');
    text.className = 'sqr-candidate-text';
    button.append(text);
  }
  const value = String(typeof item === 'object' ? item?.text ?? item?.reply ?? '' : item ?? '').trim();
  text.replaceChildren?.();
  if (!text.replaceChildren) text.textContent = '';
  if (value) {
    const line = documentImpl.createElement('span');
    line.className = 'sqr-candidate-line';
    line.textContent = value;
    text.append(line);
  }
  button.dataset ??= {};
  button.dataset.sqrReply = value;
  text.dataset ??= {};
  text.dataset.sqrFullText = value;
  text.setAttribute?.('aria-label', value);
  button.title = value;
  button.hidden = !value;
  return value;
}

export function createPanel(documentImpl, callbacks = {}) {
  if (!documentImpl?.createElement) throw new Error('A browser document is required');
  const element = documentImpl.createElement('div');
  element.id = 'sqr-panel';
  element.className = 'sqr-panel';
  element.hidden = true;
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', '智能快捷回复建议');

  const scene = documentImpl.createElement('div');
  scene.className = 'sqr-glass-scene';
  scene.setAttribute('aria-hidden', 'true');
  element.appendChild(scene);

  const surface = documentImpl.createElement('div');
  surface.className = 'sqr-panel-surface';
  surface.setAttribute('aria-hidden', 'true');
  element.appendChild(surface);

  const dragHandle = documentImpl.createElement('button');
  dragHandle.type = 'button';
  dragHandle.className = 'sqr-drag-handle';
  dragHandle.appendChild(createLucideIcon(documentImpl, 'grip-vertical', { className: 'sqr-icon' }));
  dragHandle.title = '拖动面板';
  dragHandle.setAttribute('aria-label', '拖动面板');
  element.appendChild(dragHandle);

  const buttons = Array.from({ length: 4 }, () => {
    const button = documentImpl.createElement('button');
    button.type = 'button';
    button.className = 'sqr-candidate';
    button.hidden = true;
    renderCandidateButton(button, '', documentImpl);
    element.appendChild(button);
    return button;
  });

  const status = documentImpl.createElement('span');
  status.className = 'sqr-panel-status';
  status.hidden = true;
  element.appendChild(status);

  const refresh = documentImpl.createElement('button');
  refresh.type = 'button';
  refresh.className = 'sqr-refresh';
  refresh.appendChild(createLucideIcon(documentImpl, 'refresh-cw', { className: 'sqr-icon' }));
  refresh.title = '刷新回复建议';
  refresh.setAttribute('aria-label', '刷新回复建议');
  element.appendChild(refresh);

  const listeners = [];
  const listen = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  };
  let position = null;
  let dragState = null;
  let candidateCount = 0;
  const windowImpl = documentImpl.defaultView ?? globalThis.window;
  const requestFrame = typeof windowImpl?.requestAnimationFrame === 'function'
    ? windowImpl.requestAnimationFrame.bind(windowImpl)
    : callback => setTimeout(callback, 0);
  const parseCssNumber = (value, fallback = 0) => {
    const parsed = Number.parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const getComputedStyleSafe = target => {
    const getComputedStyleImpl = windowImpl?.getComputedStyle ?? globalThis.getComputedStyle;
    if (typeof getComputedStyleImpl !== 'function') return {};
    try {
      return getComputedStyleImpl.call(windowImpl, target) ?? {};
    } catch {
      return {};
    }
  };
  const getCandidateLayoutOptions = button => {
    const rect = button.getBoundingClientRect?.();
    if (!rect || !(Number(rect.width) > 0)) return null;
    const buttonStyle = getComputedStyleSafe(button);
    const textElement = button.querySelector?.('.sqr-candidate-text');
    const textStyle = getComputedStyleSafe(textElement);
    const paddingLeft = parseCssNumber(buttonStyle.paddingLeft);
    const paddingRight = parseCssNumber(buttonStyle.paddingRight);
    const paddingTop = parseCssNumber(buttonStyle.paddingTop);
    const paddingBottom = parseCssNumber(buttonStyle.paddingBottom);
    const borderLeft = parseCssNumber(buttonStyle.borderLeftWidth);
    const borderRight = parseCssNumber(buttonStyle.borderRightWidth);
    const borderTop = parseCssNumber(buttonStyle.borderTopWidth);
    const borderBottom = parseCssNumber(buttonStyle.borderBottomWidth);
    const width = Math.max(1, Number(rect.width) - paddingLeft - paddingRight - borderLeft - borderRight);
    const height = Math.max(0, Number(rect.height) - paddingTop - paddingBottom - borderTop - borderBottom);
    const fontSize = parseCssNumber(textStyle.fontSize, 16);
    const rawLineHeight = String(textStyle.lineHeight ?? '');
    const lineHeight = rawLineHeight === 'normal'
      ? fontSize * 1.35
      : Math.max(1, parseCssNumber(rawLineHeight, fontSize * 1.35));
    const outerRadius = parseCssNumber(
      buttonStyle.borderTopLeftRadius ?? buttonStyle.borderRadius,
      0,
    );
    const radius = Math.max(0, outerRadius - Math.max(paddingLeft, paddingTop));
    const canvas = documentImpl.createElement?.('canvas');
    let context2d = null;
    try {
      context2d = canvas?.getContext?.('2d') ?? null;
      if (context2d) {
        context2d.font = textStyle.font || `${textStyle.fontWeight || ''} ${fontSize}px ${textStyle.fontFamily || 'sans-serif'}`;
      }
    } catch {
      context2d = null;
    }
    return {
      document: documentImpl,
      width,
      height,
      radius,
      lineHeight,
      safety: 4,
      measure: value => context2d
        ? context2d.measureText(String(value)).width
        : Array.from(String(value)).length * fontSize,
    };
  };
  let destroyed = false;
  let layoutQueued = false;
  const layoutCandidates = () => {
    if (destroyed || element.hidden) return;
    buttons.filter(button => !button.hidden).forEach(button => {
      const options = getCandidateLayoutOptions(button);
      if (options) layoutCandidateButtonText(button, options);
    });
  };
  const queueCandidateLayout = () => {
    if (destroyed || layoutQueued) return;
    layoutQueued = true;
    requestFrame(() => {
      layoutQueued = false;
      layoutCandidates();
    });
  };
  const ResizeObserverImpl = windowImpl?.ResizeObserver ?? globalThis.ResizeObserver;
  const resizeObserver = typeof ResizeObserverImpl === 'function'
    ? new ResizeObserverImpl(() => queueCandidateLayout())
    : null;
  resizeObserver?.observe?.(element);
  const onWindowResize = () => queueCandidateLayout();
  windowImpl?.addEventListener?.('resize', onWindowResize);

  const hide = () => {
    element.hidden = true;
    element.style.display = 'none';
    callbacks.onVisibilityChange?.(false);
  };
  const show = options => {
    if (options?.position) setPosition(options.position);
    element.hidden = false;
    element.style.display = 'flex';
    queueCandidateLayout();
    callbacks.onVisibilityChange?.(true);
  };
  const setPosition = next => {
    if (!Number.isFinite(Number(next?.left)) || !Number.isFinite(Number(next?.top))) return;
    position = { left: Number(next.left), top: Number(next.top) };
    element.style.left = `${position.left}px`;
    element.style.top = `${position.top}px`;
  };
  listen(dragHandle, 'keydown', event => {
    const delta = {
      ArrowLeft: { left: -8, top: 0 },
      ArrowRight: { left: 8, top: 0 },
      ArrowUp: { left: 0, top: -8 },
      ArrowDown: { left: 0, top: 8 },
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    const current = position ?? { left: rect.left, top: rect.top };
    setPosition({ left: current.left + delta.left, top: current.top + delta.top });
    callbacks.onMove?.(position);
  });
  const setCandidates = values => {
    element.classList.remove('sqr-error-state');
    const list = Array.isArray(values) ? values : [];
    buttons.forEach((button, index) => {
      renderCandidateButton(button, list[index], documentImpl);
    });
    candidateCount = buttons.filter(button => !button.hidden).length;
    status.hidden = true;
    status.className = 'sqr-panel-status';
    status.textContent = '';
    queueCandidateLayout();
  };
  const setLoading = loading => {
    if (loading) element.classList.remove('sqr-error-state');
    element.classList.toggle('sqr-loading', Boolean(loading));
    refresh.disabled = Boolean(loading);
    buttons.forEach(button => { button.disabled = Boolean(loading); });
    if (loading) {
      status.className = 'sqr-panel-status';
      status.hidden = false;
      status.textContent = '正在生成…';
    } else if (status.textContent === '正在生成…') {
      status.hidden = true;
      status.textContent = '';
    }
  };
  const setError = message => {
    element.classList.remove('sqr-loading');
    element.classList.add('sqr-error-state');
    refresh.disabled = false;
    buttons.forEach(button => { button.disabled = false; button.hidden = true; });
    candidateCount = 0;
    status.hidden = false;
    status.className = 'sqr-panel-status sqr-error';
    status.textContent = String(message || '生成失败，请检查 API 配置');
  };

  buttons.forEach(button => listen(button, 'click', () => {
    const value = String(button.dataset?.sqrReply ?? button.querySelector('.sqr-candidate-text')?.textContent ?? '').trim();
    if (!value) return;
    const input = documentImpl.querySelector('#send_textarea');
    if (input) {
      input.value = value;
      const EventImpl = documentImpl.defaultView?.Event ?? globalThis.Event;
      if (typeof EventImpl === 'function') input.dispatchEvent(new EventImpl('input', { bubbles: true }));
      input.focus?.();
    }
    callbacks.onCandidate?.(value);
    hide();
  }));
  listen(refresh, 'click', () => callbacks.onRefresh?.());

  const dragScheduler = createDragScheduler(requestFrame, point => {
    if (!dragState) return;
    const leftDelta = point.left - dragState.left;
    const topDelta = point.top - dragState.top;
    element.style.transform = `translate3d(${leftDelta}px, ${topDelta}px, 0)`;
  });
  const move = event => {
    if (!dragState) return;
    if (event.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;
    dragState.pending = {
      left: dragState.left + event.clientX - dragState.x,
      top: dragState.top + event.clientY - dragState.y,
    };
    dragScheduler.queue(dragState.pending);
  };
  const endDrag = event => {
    if (!dragState) return;
    if (event?.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;
    const finished = dragState;
    dragState = null;
    const finalPosition = finished.pending ?? { left: finished.left, top: finished.top };
    element.style.transform = '';
    element.classList.remove('sqr-dragging');
    setPosition(finalPosition);
    callbacks.onMove?.(position);
    try {
      dragHandle.releasePointerCapture?.(finished.pointerId);
    } catch {
      // Ignore releases after the pointer has already been cancelled.
    }
    documentImpl.removeEventListener('pointermove', move);
    documentImpl.removeEventListener('pointerup', endDrag);
    documentImpl.removeEventListener('pointercancel', endDrag);
  };
  listen(dragHandle, 'pointerdown', event => {
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    dragState = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, pointerId: event.pointerId, pending: null };
    element.classList.add('sqr-dragging');
    try {
      dragHandle.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional in test doubles and older browsers.
    }
    documentImpl.addEventListener('pointermove', move);
    documentImpl.addEventListener('pointerup', endDrag);
    documentImpl.addEventListener('pointercancel', endDrag);
  });

  documentImpl.body?.appendChild(element);
  return {
    element,
    glassElements: [surface, ...buttons, refresh],
    show,
    hide,
    setCandidates,
    hasCandidates: () => candidateCount > 0,
    setLoading,
    setError,
    setPosition,
    getPosition: () => position,
    isVisible: () => !element.hidden,
    destroy() {
      destroyed = true;
      resizeObserver?.disconnect?.();
      windowImpl?.removeEventListener?.('resize', onWindowResize);
      endDrag();
      listeners.splice(0).forEach(remove => remove());
      element.remove?.();
    },
    relayout: queueCandidateLayout,
  };
}

const LIQUID_GLASS_CDN = 'https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js';

const PANEL_GLASS_CONFIG = Object.freeze({
  blurAmount: 0.25,
  cornerRadius: 30,
  opacity: 0.30,
});

const BUTTON_GLASS_CONFIG = Object.freeze({
  button: true,
  brightness: -0.45,
  blurAmount: 0.25,
  cornerRadius: 50,
  opacity: 0.88,
});

export function configureReplyPanelGlassElements(panel) {
  if (!panel?.element || !Array.isArray(panel.glassElements) || panel.glassElements.length < 2) return false;
  const [surface, ...controls] = panel.glassElements;
  surface.dataset.config = JSON.stringify(PANEL_GLASS_CONFIG);
  controls.forEach(control => {
    control.dataset.config = JSON.stringify(BUTTON_GLASS_CONFIG);
  });
  panel.element.style?.setProperty?.('--sqr-liquidglass-radius', `${PANEL_GLASS_CONFIG.cornerRadius}px`);
  return true;
}

export async function initReplyPanelLiquidGlass(panel) {
  if (!configureReplyPanelGlassElements(panel)) return null;
  const { LiquidGlass } = await import(LIQUID_GLASS_CDN);
  return LiquidGlass.init({
    root: panel.element,
    glassElements: panel.glassElements,
  });
}

export function createReplyPanelLiquidGlassController(panel, options = {}) {
  const windowImpl = options.window ?? globalThis.window;
  const init = options.init ?? initReplyPanelLiquidGlass;
  const setTimeoutImpl = options.setTimeout ?? globalThis.setTimeout;
  const clearTimeoutImpl = options.clearTimeout ?? globalThis.clearTimeout;
  let instance = null;
  let initPromise = null;
  let scheduleId = null;
  let generation = 0;
  let destroyed = false;

  const dispose = () => {
    generation += 1;
    if (scheduleId !== null) {
      if (typeof windowImpl?.cancelIdleCallback === 'function') windowImpl.cancelIdleCallback(scheduleId);
      else clearTimeoutImpl(scheduleId);
      scheduleId = null;
    }
    instance?.destroy?.();
    instance = null;
    panel?.element?.classList.remove('sqr-liquidglass-ready');
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    dispose();
  };

  const ensure = () => {
    if (destroyed || !panel?.isVisible?.() || instance || initPromise || scheduleId !== null) return;
    const initGeneration = ++generation;
    const start = () => {
      scheduleId = null;
      if (destroyed || !panel.isVisible() || initGeneration !== generation) return;
      let pending;
      try {
        pending = init(panel);
      } catch {
        panel.element.classList.remove('sqr-liquidglass-ready');
        return;
      }
      let retryWhenSettled = false;
      initPromise = Promise.resolve(pending)
        .then(nextInstance => {
          if (!nextInstance) return;
          if (!panel.isVisible() || initGeneration !== generation) {
            nextInstance.destroy?.();
            panel.element.classList.remove('sqr-liquidglass-ready');
            retryWhenSettled = !destroyed && panel.isVisible();
            return;
          }
          instance = nextInstance;
          panel.element.classList.add('sqr-liquidglass-ready');
        })
        .catch(() => {
          panel.element.classList.remove('sqr-liquidglass-ready');
          retryWhenSettled = !destroyed && initGeneration !== generation && panel.isVisible();
        })
        .finally(() => {
          initPromise = null;
          if (!destroyed && retryWhenSettled && panel.isVisible()) ensure();
        });
    };
    if (typeof windowImpl?.requestIdleCallback === 'function') {
      scheduleId = windowImpl.requestIdleCallback(start, { timeout: 600 });
    } else {
      scheduleId = setTimeoutImpl(start, 0);
    }
  };

  return { ensure, dispose, destroy };
}

export const DEFAULT_EVENT_TYPES = Object.freeze({
  GENERATION_STARTED: 'GENERATION_STARTED',
  GENERATION_STOPPED: 'GENERATION_STOPPED',
  GENERATION_ENDED: 'GENERATION_ENDED',
  CHARACTER_MESSAGE_RENDERED: 'CHARACTER_MESSAGE_RENDERED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  CHAT_CHANGED: 'CHAT_CHANGED',
  CHAT_DELETED: 'CHAT_DELETED',
  CHAT_CREATED: 'CHAT_CREATED',
});

const resolveEventType = (context, name, windowImpl) => context.eventTypes?.[name] ?? windowImpl?.event_types?.[name] ?? DEFAULT_EVENT_TYPES[name];

export function shouldSuggestOnCharacterRendered(settings = {}, generationActive = false) {
  return !generationActive && settings.triggerMode === 'auto';
}

export function decideAutoSuggestionTrigger(settings = {}, state = {}) {
  if (settings.triggerMode !== 'auto' || state.generationActive) return null;
  if (state.characterRendered) return { interrupted: false };
  return settings.interruptedAutoGenerate ? { interrupted: true } : null;
}

export function shouldScheduleAfterMessageReceived(settings = {}, state = {}) {
  return settings.triggerMode === 'auto' && !state.generationActive && Boolean(state.hasCharacterMessage);
}

export function getLatestCharacterMessageKey(chat = []) {
  const messages = Array.isArray(chat) ? chat : [];
  const index = messages.length - 1;
  const message = messages[index];
  if (!message || message.is_user || message.isUser || message.role === 'user' || message.is_system || message.isSystem || message.role === 'system') return '';
  const content = String(message.mes ?? message.content ?? '').trim();
  return content ? `${index}:${content}` : '';
}

export function shouldDismissAfterMessageSent(settings = {}, state = {}) {
  return Boolean(settings.dismissAfterSend) && state.latestMessageIsUser !== false;
}

export function shouldDismissForOutsideClick(settings = {}, state = {}) {
  if (!settings.outsideClickDismiss || !state.panelVisible) return false;
  const target = state.target;
  return !state.panelElement?.contains?.(target) && !state.manualButton?.contains?.(target);
}

export function shouldShowRequestError(error = {}) {
  return !(error?.name === 'AbortError' && error?.message !== 'API request timed out');
}

export function getRequestErrorMessage(error = {}) {
  if (!shouldShowRequestError(error)) return '';
  if (error?.name === 'AbortError') return '请求超时，请检查 API 配置或提高超时时间';
  return error?.message || '生成失败，请检查 API 配置';
}

export function resolveApiRequestConfig(settings = {}, options = {}) {
  const api = settings.api ?? {};
  const type = detectApiType(api.url, api.type, api.autoDetect);
  const inputApiKey = String(options.inputApiKey ?? '').trim();
  const runtimeApiKey = String(options.runtimeApiKey ?? '').trim();
  return {
    ...api,
    type,
    key: inputApiKey || String(api.key ?? '').trim() || runtimeApiKey || String(settings.apiKey ?? '').trim(),
  };
}

const subscribeEvent = (source, eventName, handler) => {
  if (!source || !eventName) return () => {};
  if (typeof source.on === 'function') {
    source.on(eventName, handler);
    return () => source.off?.(eventName, handler) ?? source.removeListener?.(eventName, handler);
  }
  if (typeof source.addEventListener === 'function') {
    source.addEventListener(eventName, handler);
    return () => source.removeEventListener?.(eventName, handler);
  }
  return () => {};
};

export function bootstrap(context = {}) {
  const documentImpl = context.document ?? globalThis.document;
  const windowImpl = context.window ?? globalThis.window;
  if (!documentImpl?.querySelector) return () => {};
  const settings = mergeSettings(context.settings ?? context.extensionSettings?.smartQuickReplies ?? {});
  const fetchImpl = context.fetch ?? globalThis.fetch;
  const eventSource = context.eventSource ?? windowImpl?.eventSource;
  const storage = context.storage ?? windowImpl?.localStorage;
  const positionStore = createPositionStore(storage, 'smart-quick-replies.position');
  const coordinator = createRequestCoordinator(context.AbortController ?? windowImpl?.AbortController ?? globalThis.AbortController);
  let liquidGlassController;
  let panel;
  panel = createPanel(documentImpl, {
    onVisibilityChange: visible => {
      if (visible) liquidGlassController?.ensure();
      else liquidGlassController?.dispose();
    },
    onMove: position => {
      const rect = panel.element.getBoundingClientRect();
      const viewport = { width: windowImpl?.innerWidth ?? 0, height: windowImpl?.innerHeight ?? 0 };
      const safePosition = clampPosition(position, viewport, { width: rect.width, height: rect.height });
      panel.setPosition(safePosition);
      positionStore.write(safePosition);
    },
    onRefresh: () => requestSuggestions(lastRequestInterrupted),
  });
  liquidGlassController = createReplyPanelLiquidGlassController(panel, {
    window: windowImpl,
    setTimeout: context.setTimeout ?? globalThis.setTimeout,
    clearTimeout: context.clearTimeout ?? globalThis.clearTimeout,
  });
  const cancelSuggestionRequest = (hide, reason = 'request-cancelled') => {
    const cancelled = coordinator.cancel();
    const hasCandidates = typeof panel.hasCandidates === 'function' ? panel.hasCandidates() : true;
    const shouldHide = Boolean(cancelled) && (hide || !hasCandidates);
    const result = resetPanelAfterCancellation(panel, cancelled, hide);
    if (shouldHide) recordDebug({ operation: 'panel', phase: 'hide', reason });
    return result;
  };
  const cleanups = [];
  let lastRequestInterrupted = false;
  let stoppedTimer = null;
  let scheduledAutoSuggestionInterrupted = false;
  let autoSuggestionKey = '';
  let generationId = 0;
  let handledStopId = -1;
  let generationActive = false;
  const debugOutput = documentImpl.querySelector('#sqr-debug-output');
  const debugEntries = [];
  const renderDebug = () => {
    if (debugOutput) debugOutput.textContent = debugEntries.length
      ? debugEntries.map(entry => JSON.stringify(entry, null, 2)).join('\n\n')
      : '暂无 Debug 记录。';
  };
  const recordDebug = entry => {
    debugEntries.push({ timestamp: new Date().toISOString(), ...entry });
    if (debugEntries.length > 30) debugEntries.splice(0, debugEntries.length - 30);
    renderDebug();
  };
  const hidePanel = reason => {
    if (!panel.isVisible()) return;
    recordDebug({ operation: 'panel', phase: 'hide', reason });
    panel.hide();
  };
  const clearDebug = () => {
    debugEntries.splice(0);
    renderDebug();
  };
  const clearDebugButton = documentImpl.querySelector('#sqr-clear-debug');
  clearDebugButton?.addEventListener('click', clearDebug);
  cleanups.push(() => clearDebugButton?.removeEventListener('click', clearDebug));
  renderDebug();

  const getLiveContext = () => {
    if (typeof context.getContext === 'function') return context.getContext() ?? {};
    if (typeof windowImpl?.SillyTavern?.getContext === 'function') return windowImpl.SillyTavern.getContext() ?? {};
    return {};
  };
  const getSettings = () => resolveRuntimeSettings(context, settings);
  const getPanelPosition = () => positionStore.read();
  const applyAppearance = appearance => {
    const panelElement = panel.element;
    const opacity = Number(appearance?.opacity);
    panelElement.style.setProperty('--sqr-panel-opacity', Number.isFinite(opacity) ? String(Math.min(1, Math.max(0.4, opacity))) : '0.94');
    for (const [property, value] of [
      ['--sqr-button-color', appearance?.buttonColor],
      ['--sqr-button-text', appearance?.buttonTextColor],
    ]) {
      if (String(value ?? '').trim()) panelElement.style.setProperty(property, String(value).trim());
      else panelElement.style.removeProperty(property);
    }
  };
  const showPanel = () => {
    applyAppearance(getSettings().appearance);
    const savedPosition = getPanelPosition();
    panel.show();
    const panelRect = panel.element.getBoundingClientRect();
    const viewport = { width: windowImpl?.innerWidth ?? 0, height: windowImpl?.innerHeight ?? 0 };
    if (savedPosition) {
      const safePosition = clampPosition(savedPosition, viewport, { width: panelRect.width, height: panelRect.height });
      panel.setPosition(safePosition);
      positionStore.write(safePosition);
    } else {
      const input = documentImpl.querySelector('#send_textarea');
      const inputRect = input?.getBoundingClientRect?.();
      if (inputRect) {
        const defaultPosition = getDefaultPanelPosition(inputRect, { width: panelRect.width, height: panelRect.height }, viewport);
        panel.setPosition(defaultPosition);
      }
    }
  };
  const clampVisiblePanelPosition = () => {
    if (!panel.isVisible()) return;
    const position = panel.getPosition();
    if (!position) return;
    const rect = panel.element.getBoundingClientRect();
    const safePosition = clampPosition(
      position,
      { width: windowImpl?.innerWidth ?? 0, height: windowImpl?.innerHeight ?? 0 },
      { width: rect.width, height: rect.height },
    );
    panel.setPosition(safePosition);
    positionStore.write(safePosition);
  };
  windowImpl?.addEventListener?.('resize', clampVisiblePanelPosition);
  cleanups.push(() => windowImpl?.removeEventListener?.('resize', clampVisiblePanelPosition));
  const resolveApiConfig = currentSettings => {
    return resolveApiRequestConfig(currentSettings, {
      inputApiKey: documentImpl.querySelector('#sqr-api-key')?.value,
      runtimeApiKey: context.apiKey,
    });
  };
  const requestSuggestions = async (interrupted = false) => {
    const currentSettings = getSettings();
    if (currentSettings.triggerMode === 'off') return;
    const request = coordinator.begin();
    if (request.reused) {
      showPanel();
      return;
    }
    lastRequestInterrupted = Boolean(interrupted);
    panel.setCandidates([]);
    panel.setLoading(true);
    showPanel();
    let raw = '';
    try {
      const live = getLiveContext();
      const charName = live.name2 ?? live.character?.name ?? 'Character';
      const userName = live.name1 ?? 'User';
      const description = currentSettings.includeCharacterDescription ? String(live.character?.description ?? '').trim() : '';
      const history = buildHistory(live.chat ?? [], {
        limit: currentSettings.historyLimit,
        interrupted,
        charName,
        userName,
      });
      const styleHistory = buildHistory(live.chat ?? [], {
        limit: 30,
        interrupted,
        charName,
        userName,
      });
      const apiConfig = resolveApiConfig(currentSettings);
      const compressed = await compressHistory(history, currentSettings.compression, async (_early, text) => {
        const summarySettings = currentSettings.compression;
        return requestCompletion({
          ...apiConfig,
          type: detectApiType(summarySettings.summaryApiUrl || apiConfig.url, summarySettings.summaryApiType || apiConfig.type, Boolean(summarySettings.summaryApiType)),
          url: summarySettings.summaryApiUrl || apiConfig.url,
          key: summarySettings.summaryApiKey || apiConfig.key,
          model: summarySettings.summaryModel || apiConfig.model,
          maxTokens: Math.min(apiConfig.maxTokens, 256),
        }, {
          system: 'Summarize the early conversation history accurately and concisely for a reply suggestion assistant.',
          messages: [{ role: 'user', content: text }],
        }, { fetch: fetchImpl, signal: request.signal, onDebug: entry => recordDebug({ requestId: request.id, operation: 'summary', ...entry }) });
      });
      if (!coordinator.isCurrent(request.id)) return;
      const promptTemplate = description ? `Character description:\n${description}\n\n${currentSettings.systemPrompt}` : currentSettings.systemPrompt;
      const promptData = buildPromptMessages(promptTemplate, compressed, {
        char: charName,
        user: userName,
        charDescription: description,
        userStyleExamples: formatUserStyleExamples(styleHistory.messages),
      });
      raw = await requestCompletion(apiConfig, promptData, {
        fetch: fetchImpl,
        signal: request.signal,
        AbortController: context.AbortController ?? windowImpl?.AbortController ?? globalThis.AbortController,
        onDebug: entry => recordDebug({ requestId: request.id, operation: 'suggestions', ...entry }),
      });
      if (!coordinator.isCurrent(request.id)) return;
      panel.setCandidates(parseCandidateResults(raw));
      panel.setLoading(false);
      showPanel();
    } catch (error) {
      if (!coordinator.isCurrent(request.id)) return;
      recordDebug({
        requestId: request.id,
        operation: 'parse-or-request',
        phase: 'failure',
        error: { name: error?.name, message: error?.message, stack: previewDebugText(error?.stack, 2000) },
        rawResponsePreview: previewDebugText(raw, 4000),
      });
      const errorMessage = getRequestErrorMessage(error);
      if (!errorMessage) return;
      panel.setError(errorMessage);
      showPanel();
    } finally {
      coordinator.finish(request.id);
    }
  };

  const scheduleAutoSuggestion = interrupted => {
    if (handledStopId === generationId) return;
    scheduledAutoSuggestionInterrupted ||= Boolean(interrupted);
    if (stoppedTimer !== null) return;
    const scheduledGenerationId = generationId;
    let attempts = 0;
    const run = () => {
      stoppedTimer = null;
      if (handledStopId === scheduledGenerationId || generationId !== scheduledGenerationId) {
        scheduledAutoSuggestionInterrupted = false;
        return;
      }
      const currentSettings = getSettings();
      if (currentSettings.triggerMode !== 'auto'
        || (scheduledAutoSuggestionInterrupted && !currentSettings.interruptedAutoGenerate)) {
        scheduledAutoSuggestionInterrupted = false;
        return;
      }
      const messageKey = getLatestCharacterMessageKey(getLiveContext().chat);
      if (!messageKey && attempts < 4) {
        attempts += 1;
        stoppedTimer = (context.setTimeout ?? globalThis.setTimeout)(run, 100);
        return;
      }
      if (!messageKey || autoSuggestionKey === messageKey) {
        scheduledAutoSuggestionInterrupted = false;
        return;
      }
      const requestInterrupted = scheduledAutoSuggestionInterrupted;
      scheduledAutoSuggestionInterrupted = false;
      autoSuggestionKey = messageKey;
      handledStopId = scheduledGenerationId;
      requestSuggestions(requestInterrupted);
    };
    stoppedTimer = (context.setTimeout ?? globalThis.setTimeout)(run, 100);
  };

  const clearScheduledAutoSuggestion = () => {
    if (stoppedTimer !== null) (context.clearTimeout ?? globalThis.clearTimeout)(stoppedTimer);
    stoppedTimer = null;
    scheduledAutoSuggestionInterrupted = false;
  };

  const manualButton = documentImpl.createElement('button');
  manualButton.id = 'sqr-manual-trigger';
  manualButton.type = 'button';
  manualButton.className = 'menu_button';
  manualButton.appendChild(createLucideIcon(documentImpl, 'sparkles', { className: 'sqr-icon' }));
  const manualText = documentImpl.createElement('span');
  manualText.textContent = '回复建议';
  manualButton.appendChild(manualText);
  manualButton.title = '生成快捷回复建议';
  const sendButton = documentImpl.querySelector('#send_but');
  const sendForm = documentImpl.querySelector('#send_form');
  (sendButton?.parentElement ?? sendForm ?? documentImpl.body)?.appendChild(manualButton);
  cleanups.push(() => manualButton.remove?.());
  cleanups.push(() => {
    liquidGlassController.destroy();
    panel.destroy();
  });
  const manualClick = () => requestSuggestions(false);
  manualButton.addEventListener('click', manualClick);
  cleanups.push(() => manualButton.removeEventListener('click', manualClick));

  const eventHandler = (name, handler) => cleanups.push(subscribeEvent(eventSource, resolveEventType(context, name, windowImpl), handler));
  eventHandler('GENERATION_STARTED', () => {
    clearScheduledAutoSuggestion();
    generationActive = true;
    generationId += 1;
    handledStopId = -1;
    cancelSuggestionRequest(false, 'generation-started');
  });
  eventHandler('CHARACTER_MESSAGE_RENDERED', () => {
    const currentSettings = getSettings();
    const trigger = decideAutoSuggestionTrigger(currentSettings, {
      generationActive,
      characterRendered: true,
    });
    if (trigger) scheduleAutoSuggestion(trigger.interrupted);
  });
  eventHandler('GENERATION_STOPPED', () => {
    generationActive = false;
    const currentSettings = getSettings();
    if (currentSettings.triggerMode !== 'auto' || !currentSettings.interruptedAutoGenerate) return;
    const live = getLiveContext();
    if (!getLatestCharacterMessageKey(live.chat)) return;
    scheduleAutoSuggestion(true);
  });
  eventHandler('GENERATION_ENDED', () => {
    generationActive = false;
    const currentSettings = getSettings();
    if (currentSettings.triggerMode !== 'auto') return;
    // SillyTavern emits GENERATION_ENDED for normal completion and also briefly
    // while handling a manual stop. Keep this delayed so GENERATION_STOPPED can
    // replace it with the interrupted-context path when applicable.
    scheduleAutoSuggestion(false);
  });
  eventHandler('MESSAGE_RECEIVED', () => {
    const live = getLiveContext();
    const currentSettings = getSettings();
    if (shouldScheduleAfterMessageReceived(currentSettings, {
      generationActive,
      hasCharacterMessage: Boolean(getLatestCharacterMessageKey(live.chat)),
    })) {
      scheduleAutoSuggestion(false);
    }
  });
  for (const name of ['CHAT_CHANGED', 'CHAT_DELETED', 'CHAT_CREATED']) eventHandler(name, () => {
    clearScheduledAutoSuggestion();
    generationId += 1;
    handledStopId = -1;
    generationActive = false;
    autoSuggestionKey = '';
    cancelSuggestionRequest(true, name.toLowerCase());
  });
  eventHandler('MESSAGE_SENT', () => {
    const last = getLiveContext().chat?.at?.(-1);
    const latestMessageIsUser = last
      ? Boolean(last.is_user ?? last.isUser ?? last.role === 'user')
      : undefined;
    if (shouldDismissAfterMessageSent(getSettings(), { latestMessageIsUser })) hidePanel('message-sent');
  });

  const textarea = documentImpl.querySelector('#send_textarea');
  const hideAfterSend = event => {
    if (event.key === 'Enter' && !event.shiftKey && getSettings().dismissAfterSend) hidePanel('enter-send');
  };
  textarea?.addEventListener('keydown', hideAfterSend);
  cleanups.push(() => textarea?.removeEventListener('keydown', hideAfterSend));
  const sendClick = () => { if (getSettings().dismissAfterSend) hidePanel('send-button'); };
  sendButton?.addEventListener('click', sendClick);
  cleanups.push(() => sendButton?.removeEventListener('click', sendClick));
  const keydown = event => {
    if (event.key === 'Escape' && getSettings().escDismiss) hidePanel('escape');
  };
  documentImpl.addEventListener('keydown', keydown);
  cleanups.push(() => documentImpl.removeEventListener('keydown', keydown));
  const outsideClick = event => {
    if (shouldDismissForOutsideClick(getSettings(), {
      panelVisible: panel.isVisible(),
      panelElement: panel.element,
      manualButton,
      target: event.target,
    })) hidePanel('outside-click');
  };
  documentImpl.addEventListener('click', outsideClick, true);
  cleanups.push(() => documentImpl.removeEventListener('click', outsideClick, true));

  return () => {
    cancelSuggestionRequest(false, 'extension-cleanup');
    clearScheduledAutoSuggestion();
    cleanups.splice(0).forEach(cleanup => cleanup());
  };
}

const SECRET_STORAGE_PREFIX = 'smart-quick-replies.secret.apiKey.';

const getStorage = context => context.storage ?? context.window?.localStorage ?? globalThis.localStorage;

const getSecretAdapter = context => {
  const roots = [
    { root: context, readNames: ['getSecret', 'readSecret'], writeNames: ['setSecret', 'writeSecret'] },
    { root: context.SillyTavern, readNames: ['getSecret', 'readSecret'], writeNames: ['setSecret', 'writeSecret'] },
    { root: context.window?.SillyTavern, readNames: ['getSecret', 'readSecret'], writeNames: ['setSecret', 'writeSecret'] },
    { root: context.secrets, readNames: ['getSecret', 'readSecret', 'get'], writeNames: ['setSecret', 'writeSecret', 'set'] },
    { root: context.secretStorage, readNames: ['getSecret', 'readSecret', 'get'], writeNames: ['setSecret', 'writeSecret', 'set'] },
  ].filter(entry => entry.root);
  const readEntry = roots.find(entry => entry.readNames.some(name => typeof entry.root[name] === 'function'));
  const writeEntry = roots.find(entry => entry.writeNames.some(name => typeof entry.root[name] === 'function'));
  if (!readEntry && !writeEntry) return null;
  const readName = readEntry?.readNames.find(name => typeof readEntry.root[name] === 'function');
  const writeName = writeEntry?.writeNames.find(name => typeof writeEntry.root[name] === 'function');
  return {
    read: readName ? key => readEntry.root[readName](key) : null,
    write: writeName ? (key, value) => writeEntry.root[writeName](key, value) : null,
  };
};

const secretStorageKey = provider => `${SECRET_STORAGE_PREFIX}${String(provider || 'openai').toLowerCase()}`;

export function getApiKeyStorageMode(context = {}) {
  return getSecretAdapter(context)?.write ? 'secrets' : 'localStorage';
}

export async function readApiKey(context = {}, provider = 'openai') {
  const adapter = getSecretAdapter(context);
  const key = secretStorageKey(provider);
  if (adapter?.read) {
    try {
      const value = await adapter.read(key);
      const secretValue = typeof value === 'string' ? value : String(value?.value ?? '');
      // Some ST versions expose the Secrets API even when it has no value yet.
      // Keep checking the namespaced fallback in that case instead of treating
      // an empty Secrets response as the final answer.
      if (secretValue.trim()) return secretValue;
    } catch {
      // Fall back to the namespaced local value when an older Secrets API rejects the key.
    }
  }
  try {
    return String(getStorage(context)?.getItem?.(key) ?? '');
  } catch {
    return '';
  }
}

export async function writeApiKey(context = {}, provider = 'openai', value = '') {
  const adapter = getSecretAdapter(context);
  const key = secretStorageKey(provider);
  const safeValue = String(value ?? '');
  if (adapter?.write) {
    try {
      await adapter.write(key, safeValue);
      // A successful Secrets write makes every older local copy stale.
      try { getStorage(context)?.removeItem?.(key); } catch { /* Ignore unavailable fallback storage. */ }
      return 'secrets';
    } catch {
      // Use the explicit local fallback only when the Secrets API is unavailable at runtime.
    }
  }
  try {
    const storage = getStorage(context);
    if (safeValue) storage?.setItem?.(key, safeValue);
    else storage?.removeItem?.(key);
  } catch {
    // Ignore unavailable local storage; the UI will still keep manual entry enabled.
  }
  return 'localStorage';
}

const setNestedValue = (target, path, value) => {
  const keys = String(path).split('.');
  if (keys.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) return;
  const last = keys.pop();
  let cursor = target;
  for (const key of keys) {
    if (!isPlainObject(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[last] = value;
};

const persistExtensionSettings = (context, settings) => {
  if (context.extensionSettings) context.extensionSettings.smartQuickReplies = settings;
  if (context.settings) context.settings = settings;
  const save = context.saveSettingsDebounced ?? context.window?.saveSettingsDebounced ?? globalThis.saveSettingsDebounced;
  if (typeof save === 'function') save();
};

export async function loadExtensionSettings(context = {}) {
  const saved = context.settings ?? context.extensionSettings?.smartQuickReplies ?? {};
  const settings = mergeSettings(saved);
  const type = detectApiType(settings.api.url, settings.api.type, settings.api.autoDetect);
  const apiKey = await readApiKey(context, type);
  return { settings, apiKey, keyStorage: getApiKeyStorageMode(context) };
}

export async function initSettingsUI(context = {}) {
  const documentImpl = context.document ?? globalThis.document;
  const root = context.root ?? context.container ?? documentImpl?.querySelector?.('#sqr-settings-root');
  if (!root) return () => {};
  const loaded = await loadExtensionSettings(context);
  const settings = isPlainObject(context.settings) ? context.settings : loaded.settings;
  if (settings !== loaded.settings) {
    for (const key of Object.keys(settings)) delete settings[key];
    Object.assign(settings, loaded.settings);
  }
  const keyInput = root.querySelector('#sqr-api-key');
  const keyStatus = root.querySelector('#sqr-key-status');
  const modelStatus = root.querySelector('#sqr-model-status');
  const modelList = root.querySelector('#sqr-model-list');
  const positionDisplay = root.querySelector('#sqr-position-display');
  const positionStore = createPositionStore(context.storage ?? context.window?.localStorage ?? globalThis.localStorage, 'smart-quick-replies.position');
  const cleanups = [];
  const persist = () => persistExtensionSettings(context, settings);
  const updateKeyStatus = mode => {
    if (!keyStatus) return;
    keyStatus.textContent = mode === 'secrets'
      ? 'API Key 当前由 SillyTavern Secrets 管理。'
      : '未发现 Secrets 接口，API Key 将保存到本地存储回退位置，请注意浏览器数据安全。';
  };
  const renderPosition = () => {
    const position = positionStore.read();
    if (positionDisplay) positionDisplay.textContent = position ? `left: ${position.left}, top: ${position.top}` : '默认位置';
  };
  const cleanupBinding = renderSettings(root, settings, {
    save(path, value) {
      setNestedValue(settings, path, value);
      persist();
    },
    async fetchModels() {
      if (modelStatus) modelStatus.textContent = '正在获取模型列表…';
      try {
        const type = detectApiType(settings.api.url, settings.api.type, settings.api.autoDetect);
        const key = keyInput?.value || await readApiKey(context, type);
        const models = await requestModels({ ...settings.api, type, key }, { fetch: context.fetch ?? globalThis.fetch });
        if (modelList) {
          modelList.replaceChildren();
          for (const model of models) {
            const option = documentImpl.createElement('option');
            option.value = model;
            option.textContent = model;
            modelList.appendChild(option);
          }
        }
        if (modelStatus) modelStatus.textContent = models.length ? `已获取 ${models.length} 个模型。` : '接口返回的模型列表为空，请手动填写。';
      } catch (error) {
        if (modelStatus) modelStatus.textContent = error?.message || '获取模型失败，请检查 URL、跨域设置或手动填写模型名称。';
      }
    },
    resetPosition() {
      positionStore.clear();
      settings.position = null;
      persist();
      renderPosition();
    },
    resetPrompt() {
      settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
      const prompt = root.querySelector('#sqr-system-prompt');
      if (prompt) prompt.value = DEFAULT_SYSTEM_PROMPT;
      persist();
    },
  });
  if (keyInput) {
    const setTimeoutImpl = context.setTimeout ?? context.window?.setTimeout ?? globalThis.setTimeout;
    const clearTimeoutImpl = context.clearTimeout ?? context.window?.clearTimeout ?? globalThis.clearTimeout;
    let activeKeyProvider = detectApiType(settings.api.url, settings.api.type, settings.api.autoDetect);
    keyInput.value = loaded.apiKey;
    let keySaveTimer = null;
    let keySaveQueue = Promise.resolve();
    const persistApiKey = (provider = activeKeyProvider) => {
      const value = keyInput.value;
      keySaveQueue = keySaveQueue
        .then(async () => {
          const mode = await writeApiKey(context, provider, value);
          updateKeyStatus(mode);
        })
        .catch(() => {});
      return keySaveQueue;
    };
    const scheduleApiKeySave = () => {
      if (keySaveTimer !== null) clearTimeoutImpl(keySaveTimer);
      keySaveTimer = setTimeoutImpl(() => {
        keySaveTimer = null;
        void persistApiKey();
      }, 250);
    };
    const flushApiKeySave = () => {
      if (keySaveTimer !== null) {
        clearTimeoutImpl(keySaveTimer);
        keySaveTimer = null;
      }
      return persistApiKey(activeKeyProvider);
    };
    keyInput.addEventListener('input', scheduleApiKeySave);
    keyInput.addEventListener('change', flushApiKeySave);
    keyInput.addEventListener('blur', flushApiKeySave);
    const syncProviderKey = async () => {
      const nextProvider = detectApiType(settings.api.url, settings.api.type, settings.api.autoDetect);
      if (nextProvider === activeKeyProvider) return;
      // Save the value under the provider it belonged to before switching, then
      // load the provider-specific value so changing API type cannot lose keys.
      await flushApiKeySave();
      activeKeyProvider = nextProvider;
      keyInput.value = await readApiKey(context, activeKeyProvider);
      updateKeyStatus(getApiKeyStorageMode(context));
    };
    const providerControls = ['#sqr-api-type', '#sqr-api-auto-detect', '#sqr-api-url']
      .map(selector => root.querySelector(selector))
      .filter(Boolean);
    for (const control of providerControls) control.addEventListener('change', syncProviderKey);
    cleanups.push(() => {
      if (keySaveTimer !== null) {
        clearTimeoutImpl(keySaveTimer);
        keySaveTimer = null;
        void persistApiKey();
      }
      keyInput.removeEventListener('input', scheduleApiKeySave);
      keyInput.removeEventListener('change', flushApiKeySave);
      keyInput.removeEventListener('blur', flushApiKeySave);
      for (const control of providerControls) control.removeEventListener('change', syncProviderKey);
    });
  }
  updateKeyStatus(loaded.keyStorage);
  renderPosition();
  cleanups.push(cleanupBinding);
  return () => cleanups.splice(0).forEach(cleanup => cleanup());
}

export async function initializeExtension(context = {}) {
  const documentImpl = context.document ?? globalThis.document;
  const windowImpl = context.window ?? globalThis.window;
  if (!documentImpl) return () => {};
  const stContext = typeof windowImpl?.SillyTavern?.getContext === 'function' ? windowImpl.SillyTavern.getContext() ?? {} : {};
  const extensionSettings = context.extensionSettings ?? stContext.extensionSettings ?? windowImpl?.extensionSettings;
  let root = context.root ?? documentImpl.querySelector?.('#sqr-settings-root');
  const fetchImpl = context.fetch ?? globalThis.fetch;
  if (!root) {
    const settingsHost = context.settingsHost ?? documentImpl.querySelector?.('#extensions_settings');
    if (settingsHost && typeof fetchImpl === 'function') {
      try {
        const response = await fetchImpl(new URL('./settings.html', import.meta.url));
        if (response?.ok) settingsHost.insertAdjacentHTML('beforeend', await response.text());
      } catch {
        // The panel can still work when SillyTavern loads settings.html itself.
      }
      root = documentImpl.querySelector?.('#sqr-settings-root');
    }
  }
  const loaded = await loadExtensionSettings({ ...context, document: documentImpl, window: windowImpl, extensionSettings });
  const runtime = {
    ...context,
    ...stContext,
    document: documentImpl,
    window: windowImpl,
    extensionSettings,
    settings: loaded.settings,
    apiKey: loaded.apiKey,
  };
  const panelCleanup = bootstrap(runtime);
  const settingsCleanup = await initSettingsUI({ ...runtime, root });
  return () => {
    panelCleanup();
    settingsCleanup();
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const runtimeWindow = /** @type {Window & typeof globalThis & Record<string, any>} */ (window);
  const start = () => {
    if (runtimeWindow.__smartQuickRepliesCleanup || runtimeWindow.__smartQuickRepliesInitPromise) return;
    const initPromise = initializeExtension({
      document,
      window: runtimeWindow,
      eventSource: runtimeWindow.eventSource,
      eventTypes: runtimeWindow.event_types,
      extensionSettings: runtimeWindow.extensionSettings,
      fetch: runtimeWindow.fetch?.bind(runtimeWindow),
    });
    runtimeWindow.__smartQuickRepliesInitPromise = initPromise;
    void initPromise
      .then(cleanup => {
        runtimeWindow.__smartQuickRepliesCleanup = cleanup;
      })
      .catch(() => {
        // Keep extension startup isolated from the main SillyTavern page.
      })
      .finally(() => {
        if (runtimeWindow.__smartQuickRepliesInitPromise === initPromise) delete runtimeWindow.__smartQuickRepliesInitPromise;
      });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
