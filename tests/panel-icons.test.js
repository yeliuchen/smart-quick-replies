import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCandidateButton } from '../index.js';

const createFakeHtmlDocument = () => {
  const createElement = tagName => {
    const classes = new Set();
    const element = {
      tagName,
      ownerDocument: null,
      children: [],
      hidden: false,
      title: '',
      _textContent: '',
      classList: {
        add(...values) { values.forEach(value => classes.add(value)); },
        toggle(value, force) {
          if (force === undefined) force = !classes.has(value);
          if (force) classes.add(value);
          else classes.delete(value);
          return force;
        },
        contains: value => classes.has(value),
      },
      setAttribute() {},
      appendChild(child) { this.children.push(child); return child; },
      append(...children) { children.forEach(child => this.appendChild(child)); },
      replaceChildren(...children) { this.children = children; },
      querySelector(selector) {
        const className = selector.startsWith('.') ? selector.slice(1) : null;
        for (const child of this.children) {
          if (className && child.classList?.contains(className)) return child;
          const nested = child.querySelector?.(selector);
          if (nested) return nested;
        }
        return null;
      },
    };
    Object.defineProperty(element, 'className', {
      get: () => [...classes].join(' '),
      set: value => {
        classes.clear();
        String(value).split(/\s+/).filter(Boolean).forEach(name => classes.add(name));
      },
    });
    Object.defineProperty(element, 'textContent', {
      get: () => element._textContent,
      set: value => { element._textContent = String(value); },
    });
    return element;
  };
  const documentImpl = {
    createElement,
    createElementNS(_namespace, tagName) { return createElement(tagName); },
  };
  const create = documentImpl.createElement;
  documentImpl.createElement = tagName => {
    const element = create(tagName);
    element.ownerDocument = documentImpl;
    return element;
  };
  return documentImpl;
};

test('candidate updates render plain reply text without progression metadata', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  const value = renderCandidateButton(button, { text: '一起去看看吧', progression: true }, documentImpl);
  assert.equal(value, '一起去看看吧');
  assert.equal(button.querySelector('.sqr-candidate-text').textContent, '一起去看看吧');
  assert.equal(button.querySelector('.sqr-candidate-icon'), null);
  assert.equal(button.classList.contains('sqr-progression'), false);

  renderCandidateButton(button, { text: '那就先休息一下', progression: false }, documentImpl);
  assert.equal(button.querySelector('.sqr-candidate-text').textContent, '那就先休息一下');
  assert.equal(button.classList.contains('sqr-progression'), false);
});

test('empty candidates hide their button', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  renderCandidateButton(button, '', documentImpl);
  assert.equal(button.hidden, true);
});
