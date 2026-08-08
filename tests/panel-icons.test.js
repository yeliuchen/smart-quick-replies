import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRoundedLineInset,
  getRoundedLineAvailableWidth,
  layoutCandidateButtonText,
  renderCandidateButton,
  wrapTextToRoundedButton,
} from '../index.js';

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
  assert.equal(button.querySelector('.sqr-candidate-line').textContent, '一起去看看吧');
  assert.equal(button.querySelector('.sqr-candidate-icon'), null);
  assert.equal(button.classList.contains('sqr-progression'), false);

  renderCandidateButton(button, { text: '那就先休息一下', progression: false }, documentImpl);
  assert.equal(button.querySelector('.sqr-candidate-line').textContent, '那就先休息一下');
  assert.equal(button.classList.contains('sqr-progression'), false);
});

test('empty candidates hide their button', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  renderCandidateButton(button, '', documentImpl);
  assert.equal(button.hidden, true);
});

test('rounded button geometry narrows cap lines while keeping middle lines wide', () => {
  const top = getRoundedLineAvailableWidth(240, 96, 48, 6, 4);
  const middle = getRoundedLineAvailableWidth(240, 96, 48, 48, 4);
  const bottom = getRoundedLineAvailableWidth(240, 96, 48, 90, 4);

  assert.ok(top < middle);
  assert.equal(top, bottom);
  assert.equal(middle, 232);
  assert.ok(getRoundedLineInset(240, 96, 48, 6) > 0);
  assert.equal(getRoundedLineInset(240, 96, 48, 48), 0);
});

test('rounded text wrapping preserves graphemes and expands beyond three lines', () => {
  const value = '中文🙂English網址https://example.test/very-long-path';
  const result = wrapTextToRoundedButton(value, {
    width: 120,
    radius: 32,
    lineHeight: 20,
    verticalPadding: 8,
    safety: 4,
    measure: text => [...String(text)].length * 10,
  });

  assert.ok(result.lines.length > 3);
  assert.equal(result.lines.join(''), value);
  assert.ok(result.lineWidths[0] < 120);
  assert.ok(result.lineWidths.at(-1) < 120);
  assert.ok(result.lineWidths.some(width => width === 112));
});

test('candidate rendering materializes rounded-boundary lines without losing the full reply', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  const value = '这是一个需要根据圆角边界重新排版的较长候选回复';
  renderCandidateButton(button, value, documentImpl);
  const result = layoutCandidateButtonText(button, {
    document: documentImpl,
    width: 100,
    radius: 24,
    lineHeight: 20,
    verticalPadding: 8,
    safety: 4,
    measure: text => [...String(text)].length * 10,
  });
  const textElement = button.querySelector('.sqr-candidate-text');
  const lineElements = [...textElement.children];
  const lines = lineElements.map(line => line.textContent);

  assert.ok(result.lines.length > 1);
  assert.deepEqual(lines, result.lines);
  assert.equal(lines.join(''), value);
  assert.equal(button.title, value);
  assert.match(lineElements[0].style.marginInlineStart, /px$/);
  assert.match(lineElements.at(-1).style.marginInlineEnd, /px$/);
});
