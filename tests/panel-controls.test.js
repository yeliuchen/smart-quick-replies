import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPanel } from '../index.js';

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

const createFakeDocument = () => {
  const documentImpl = createEventTarget({
    defaultView: {
      requestAnimationFrame(callback) {
        callback();
        return 1;
      },
    },
    querySelector() {
      return null;
    },
  });

  const createElement = tagName => {
    const classes = new Set();
    const attributes = new Map();
    const element = createEventTarget({
      tagName,
      ownerDocument: documentImpl,
      children: [],
      hidden: false,
      style: {
        setProperty(name, value) {
          this[name] = String(value);
        },
        removeProperty(name) {
          delete this[name];
        },
      },
      classList: {
        add(...values) {
          values.forEach(value => classes.add(value));
        },
        remove(...values) {
          values.forEach(value => classes.delete(value));
        },
        toggle(value, force) {
          if (force === undefined) force = !classes.has(value);
          if (force) classes.add(value);
          else classes.delete(value);
          return force;
        },
        contains(value) {
          return classes.has(value);
        },
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      appendChild(child) {
        child.parentNode = this;
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
        const className = selector.startsWith('.') ? selector.slice(1) : null;
        for (const child of this.children) {
          if (className && child.classList?.contains(className)) return child;
          const nested = child.querySelector?.(selector);
          if (nested) return nested;
        }
        return null;
      },
      getBoundingClientRect() {
        return {
          left: Number.parseFloat(this.style.left) || 0,
          top: Number.parseFloat(this.style.top) || 0,
          width: 600,
          height: 120,
        };
      },
      remove() {
        if (!this.parentNode) return;
        this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        this.parentNode = null;
      },
    });
    Object.defineProperty(element, 'className', {
      get: () => [...classes].join(' '),
      set: value => {
        classes.clear();
        String(value).split(/\s+/).filter(Boolean).forEach(name => classes.add(name));
      },
    });
    return element;
  };

  documentImpl.createElement = createElement;
  documentImpl.createElementNS = (_namespace, tagName) => createElement(tagName);
  documentImpl.body = createElement('body');
  return documentImpl;
};

const createKeyboardEvent = key => ({
  type: 'keydown',
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true;
  },
});

test('drag handle is a native named button', () => {
  const panel = createPanel(createFakeDocument());
  const handle = panel.element.querySelector('.sqr-drag-handle');

  assert.equal(handle.tagName, 'button');
  assert.equal(handle.type, 'button');
  assert.equal(handle.getAttribute('aria-label'), '拖动面板');
  assert.equal(handle.title, '拖动面板');
  panel.destroy();
});

test('drag handle has an explicit focus-visible treatment', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const focusRule = css.match(/#sqr-panel \.sqr-drag-handle:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(focusRule, /outline:\s*2px\s+solid/);
  assert.match(focusRule, /outline-offset:/);
});

test('arrow keys move the panel by eight pixels and notify onMove', () => {
  const moves = [];
  const panel = createPanel(createFakeDocument(), {
    onMove(position) {
      moves.push({ ...position });
    },
  });
  const handle = panel.element.querySelector('.sqr-drag-handle');
  panel.setPosition({ left: 40, top: 50 });

  const cases = [
    ['ArrowLeft', { left: 32, top: 50 }],
    ['ArrowRight', { left: 40, top: 50 }],
    ['ArrowUp', { left: 40, top: 42 }],
    ['ArrowDown', { left: 40, top: 50 }],
  ];
  for (const [key, expected] of cases) {
    const event = createKeyboardEvent(key);
    handle.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true, `${key} should prevent scrolling`);
    assert.deepEqual(panel.getPosition(), expected);
  }

  assert.deepEqual(moves, cases.map(([, expected]) => expected));
  panel.destroy();
});

test('pointer dragging still updates position and notifies onMove', () => {
  const moves = [];
  const documentImpl = createFakeDocument();
  const panel = createPanel(documentImpl, {
    onMove(position) {
      moves.push({ ...position });
    },
  });
  const handle = panel.element.querySelector('.sqr-drag-handle');
  panel.setPosition({ left: 40, top: 50 });

  handle.dispatchEvent({
    type: 'pointerdown',
    pointerId: 1,
    clientX: 10,
    clientY: 20,
    preventDefault() {},
  });
  documentImpl.dispatchEvent({ type: 'pointermove', pointerId: 1, clientX: 18, clientY: 28 });
  documentImpl.dispatchEvent({ type: 'pointerup', pointerId: 1 });

  assert.deepEqual(panel.getPosition(), { left: 48, top: 58 });
  assert.deepEqual(moves, [{ left: 48, top: 58 }]);
  panel.destroy();
});

test('dragging ignores move and release events from unrelated pointers', () => {
  const moves = [];
  const documentImpl = createFakeDocument();
  const panel = createPanel(documentImpl, {
    onMove(position) {
      moves.push({ ...position });
    },
  });
  const handle = panel.element.querySelector('.sqr-drag-handle');
  panel.setPosition({ left: 40, top: 50 });
  handle.dispatchEvent({
    type: 'pointerdown',
    pointerId: 1,
    clientX: 10,
    clientY: 20,
    preventDefault() {},
  });

  documentImpl.dispatchEvent({ type: 'pointermove', pointerId: 2, clientX: 100, clientY: 100 });
  documentImpl.dispatchEvent({ type: 'pointerup', pointerId: 2 });
  documentImpl.dispatchEvent({ type: 'pointermove', pointerId: 1, clientX: 18, clientY: 28 });
  documentImpl.dispatchEvent({ type: 'pointerup', pointerId: 1 });

  assert.deepEqual(panel.getPosition(), { left: 48, top: 58 });
  assert.deepEqual(moves, [{ left: 48, top: 58 }]);
  panel.destroy();
});

test('an error clears the panel candidate state together with hidden buttons', () => {
  const panel = createPanel(createFakeDocument());
  panel.setCandidates(['candidate']);
  assert.equal(panel.hasCandidates(), true);

  panel.setError('request failed');

  assert.equal(panel.hasCandidates(), false);
  assert.equal(panel.element.classList.contains('sqr-error-state'), true);
  panel.destroy();
});
