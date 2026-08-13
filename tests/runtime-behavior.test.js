import test from 'node:test';
import assert from 'node:assert/strict';
import * as extension from '../index.js';

const createEventTarget = target => {
  const listeners = new Map();
  target.addEventListener = (type, listener) => {
    const entries = listeners.get(type) ?? [];
    entries.push(listener);
    listeners.set(type, entries);
  };
  target.removeEventListener = (type, listener) => {
    const entries = listeners.get(type) ?? [];
    listeners.set(type, entries.filter(entry => entry !== listener));
  };
  target.dispatchEvent = event => {
    event.target ??= target;
    event.currentTarget = target;
    for (const listener of listeners.get(event.type) ?? []) listener.call(target, event);
    return !event.defaultPrevented;
  };
  return target;
};

const createClassList = () => {
  const values = new Set();
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
    toggle(name, force) {
      const next = force === undefined ? !values.has(name) : Boolean(force);
      if (next) values.add(name);
      else values.delete(name);
      return next;
    },
    set(value) {
      values.clear();
      String(value).split(/\s+/).filter(Boolean).forEach(name => values.add(name));
    },
    toString: () => [...values].join(' '),
  };
};

const createFakeDocument = () => {
  const windowTarget = createEventTarget({
    innerWidth: 1000,
    innerHeight: 800,
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    requestIdleCallback() {
      return 1;
    },
    cancelIdleCallback() {},
    Event: class {
      constructor(type, init = {}) {
        this.type = type;
        Object.assign(this, init);
      }
    },
  });
  const documentImpl = createEventTarget({ defaultView: windowTarget });

  const createElement = tagName => {
    const classes = createClassList();
    const attributes = new Map();
    const element = createEventTarget({
      tagName,
      ownerDocument: documentImpl,
      children: [],
      dataset: {},
      hidden: false,
      style: {
        setProperty(name, value) {
          this[name] = String(value);
        },
        removeProperty(name) {
          delete this[name];
        },
      },
      classList: classes,
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      appendChild(child) {
        child.parentNode = this;
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      append(...children) {
        children.forEach(child => this.appendChild(child));
      },
      replaceChildren(...children) {
        this.children = [];
        this.append(...children);
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] ?? null;
      },
      querySelectorAll(selector) {
        const matches = [];
        const match = child => selector.startsWith('#')
          ? child.id === selector.slice(1)
          : selector.startsWith('.')
            ? child.classList?.contains(selector.slice(1))
            : false;
        const visit = child => {
          if (match(child)) matches.push(child);
          child.children?.forEach(visit);
        };
        this.children.forEach(visit);
        return matches;
      },
      contains(target) {
        if (target === this) return true;
        return this.children.some(child => child.contains?.(target));
      },
      getBoundingClientRect() {
        return {
          left: Number.parseFloat(this.style.left) || 0,
          top: Number.parseFloat(this.style.top) || 0,
          width: this.id === 'send_textarea' ? 700 : 600,
          height: this.id === 'send_textarea' ? 80 : 120,
        };
      },
      getContext() {
        return null;
      },
      focus() {},
      remove() {
        if (!this.parentNode) return;
        this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        this.parentNode = null;
        this.parentElement = null;
      },
    });
    Object.defineProperty(element, 'className', {
      get: () => classes.toString(),
      set: value => { classes.set(value); },
    });
    return element;
  };

  documentImpl.createElement = createElement;
  documentImpl.createElementNS = (_namespace, tagName) => createElement(tagName);
  documentImpl.body = createElement('body');
  documentImpl.querySelector = selector => documentImpl.body.querySelector(selector);
  documentImpl.querySelectorAll = selector => documentImpl.body.querySelectorAll(selector);

  const sendArea = createElement('div');
  const sendButton = createElement('button');
  sendButton.id = 'send_but';
  const textarea = createElement('textarea');
  textarea.id = 'send_textarea';
  sendArea.append(sendButton, textarea);
  documentImpl.body.append(sendArea);
  return documentImpl;
};

const createEventSource = () => {
  const listeners = new Map();
  return {
    on(name, listener) {
      const entries = listeners.get(name) ?? [];
      entries.push(listener);
      listeners.set(name, entries);
    },
    off(name, listener) {
      listeners.set(name, (listeners.get(name) ?? []).filter(entry => entry !== listener));
    },
    emit(name) {
      for (const listener of listeners.get(name) ?? []) listener();
    },
  };
};

test('loading-independent settings changes stay live in the panel runtime', async () => {
  const sharedSettings = extension.mergeSettings({ triggerMode: 'manual', outsideClickDismiss: false });
  const control = createEventTarget({
    type: 'select-one',
    value: '',
    dataset: { sqrSetting: 'triggerMode' },
  });
  const root = {
    ownerDocument: null,
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '[data-sqr-setting]') return [control];
      return [];
    },
  };
  const runtimeContext = { settings: sharedSettings };
  const uiContext = { ...runtimeContext, root };
  const cleanup = await extension.initSettingsUI(uiContext);

  control.value = 'auto';
  control.dispatchEvent({ type: 'change' });

  assert.equal(sharedSettings.triggerMode, 'auto');
  assert.equal(extension.resolveRuntimeSettings(runtimeContext).triggerMode, 'auto');
  cleanup();
});

test('scaled range settings render and persist in their documented display unit', () => {
  const control = createEventTarget({
    type: 'range',
    value: '',
    dataset: { sqrSetting: 'api.timeoutMs', sqrScale: '1000' },
  });
  const output = { dataset: { sqrOutput: 'api.timeoutMs' }, value: '' };
  const root = {
    ownerDocument: null,
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '[data-sqr-setting]') return [control];
      if (selector === '[data-sqr-output]') return [output];
      return [];
    },
  };
  const saves = [];
  const cleanup = extension.renderSettings(root, { api: { timeoutMs: 120000 } }, {
    save: (path, value) => saves.push([path, value]),
  });

  assert.equal(control.value, '120');
  assert.equal(output.value, '120');
  control.value = '45';
  control.dispatchEvent({ type: 'input' });
  assert.deepEqual(saves, [['api.timeoutMs', 45000]]);
  cleanup();
});

test('outside dismissal treats Lucide and label descendants of the manual trigger as internal clicks', () => {
  assert.equal(typeof extension.shouldDismissForOutsideClick, 'function');
  const icon = {};
  const manualButton = { contains: target => target === icon };
  const panelElement = { contains: () => false };

  assert.equal(extension.shouldDismissForOutsideClick(
    { outsideClickDismiss: true },
    { panelVisible: true, panelElement, manualButton, target: icon },
  ), false);
  assert.equal(extension.shouldDismissForOutsideClick(
    { outsideClickDismiss: true },
    { panelVisible: true, panelElement, manualButton, target: {} },
  ), true);
});

test('auto trigger waits for the completed character message to enter chat', () => {
  const documentImpl = createFakeDocument();
  const eventSource = createEventSource();
  const live = { chat: [{ is_user: true, mes: 'Hello' }] };
  const timers = new Map();
  let timerId = 0;
  const cleanup = extension.bootstrap({
    document: documentImpl,
    window: documentImpl.defaultView,
    eventSource,
    settings: extension.mergeSettings({ triggerMode: 'auto' }),
    getContext: () => live,
    setTimeout(callback) {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '["a","b","c","d"]' } }] }),
    }),
  });

  eventSource.emit('GENERATION_ENDED');
  assert.equal(timers.size, 1);

  live.chat.push({ is_user: false, mes: 'Character reply' });
  const callback = [...timers.values()][0];
  timers.clear();
  callback();

  const panel = documentImpl.querySelector('#sqr-panel');
  assert.equal(panel.hidden, false);
  assert.equal(panel.classList.contains('sqr-loading'), true);
  cleanup();
});

test('a queued automatic suggestion respects a later switch to manual mode', () => {
  const documentImpl = createFakeDocument();
  const eventSource = createEventSource();
  const live = { chat: [{ is_user: false, mes: 'Character reply' }] };
  const settings = extension.mergeSettings({ triggerMode: 'auto' });
  const timers = new Map();
  let timerId = 0;
  const cleanup = extension.bootstrap({
    document: documentImpl,
    window: documentImpl.defaultView,
    eventSource,
    settings,
    getContext: () => live,
    setTimeout(callback) {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch: () => new Promise(() => {}),
  });

  eventSource.emit('GENERATION_ENDED');
  const callback = [...timers.values()][0];
  settings.triggerMode = 'manual';
  timers.clear();
  callback();

  const panel = documentImpl.querySelector('#sqr-panel');
  assert.equal(panel.hidden, true);
  assert.equal(panel.classList.contains('sqr-loading'), false);
  cleanup();
});

test('chat lifecycle events invalidate queued suggestions from the previous chat', () => {
  const documentImpl = createFakeDocument();
  const eventSource = createEventSource();
  const live = { chat: [{ is_user: false, mes: 'Old chat reply' }] };
  const timers = new Map();
  let timerId = 0;
  const cleanup = extension.bootstrap({
    document: documentImpl,
    window: documentImpl.defaultView,
    eventSource,
    settings: extension.mergeSettings({ triggerMode: 'auto' }),
    getContext: () => live,
    setTimeout(callback) {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch: () => new Promise(() => {}),
  });

  eventSource.emit('GENERATION_ENDED');
  const staleCallback = [...timers.values()][0];
  live.chat = [{ is_user: false, mes: 'New chat reply' }];
  eventSource.emit('CHAT_CHANGED');

  assert.equal(timers.size, 0);
  staleCallback();
  assert.equal(documentImpl.querySelector('#sqr-panel').hidden, true);
  cleanup();
});

test('saved panel positions are clamped before a panel becomes visible', () => {
  const documentImpl = createFakeDocument();
  const eventSource = createEventSource();
  const values = new Map([['smart-quick-replies.position', JSON.stringify({ left: 900, top: 700 })]]);
  const cleanup = extension.bootstrap({
    document: documentImpl,
    window: documentImpl.defaultView,
    eventSource,
    settings: extension.mergeSettings({ triggerMode: 'manual' }),
    getContext: () => ({ chat: [] }),
    storage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '["a","b","c","d"]' } }] }),
    }),
  });

  documentImpl.querySelector('#sqr-manual-trigger').dispatchEvent({ type: 'click' });

  const panel = documentImpl.querySelector('#sqr-panel');
  assert.equal(panel.style.left, '392px');
  assert.equal(panel.style.top, '672px');
  assert.deepEqual(JSON.parse(values.get('smart-quick-replies.position')), { left: 392, top: 672 });
  cleanup();
});

test('a visible panel is re-clamped when the viewport shrinks', () => {
  const documentImpl = createFakeDocument();
  const eventSource = createEventSource();
  const values = new Map([['smart-quick-replies.position', JSON.stringify({ left: 392, top: 672 })]]);
  const cleanup = extension.bootstrap({
    document: documentImpl,
    window: documentImpl.defaultView,
    eventSource,
    settings: extension.mergeSettings({ triggerMode: 'manual' }),
    getContext: () => ({ chat: [] }),
    storage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '["a","b","c","d"]' } }] }),
    }),
  });
  documentImpl.querySelector('#sqr-manual-trigger').dispatchEvent({ type: 'click' });
  documentImpl.defaultView.innerWidth = 700;
  documentImpl.defaultView.innerHeight = 500;

  documentImpl.defaultView.dispatchEvent({ type: 'resize' });

  const panel = documentImpl.querySelector('#sqr-panel');
  assert.equal(panel.style.left, '92px');
  assert.equal(panel.style.top, '372px');
  assert.deepEqual(JSON.parse(values.get('smart-quick-replies.position')), { left: 92, top: 372 });
  cleanup();
});
