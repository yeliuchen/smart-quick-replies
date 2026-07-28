import test from 'node:test';
import assert from 'node:assert/strict';
import { createLucideIcon, hydrateLucideIcons } from '../icons.js';

const createFakeDocument = () => ({
  createElementNS(_namespace, tagName) {
    return {
      tagName,
      attributes: new Map(),
      children: [],
      classList: { values: [], add(...values) { this.values.push(...values); } },
      setAttribute(name, value) { this.attributes.set(name, String(value)); },
      appendChild(child) { this.children.push(child); return child; },
    };
  },
});

test('Lucide factory creates an accessible decorative SVG with official geometry', () => {
  const svg = createLucideIcon(createFakeDocument(), 'refresh-cw', { className: 'sqr-icon' });
  assert.equal(svg.tagName, 'svg');
  assert.equal(svg.attributes.get('viewBox'), '0 0 24 24');
  assert.equal(svg.attributes.get('fill'), 'none');
  assert.equal(svg.attributes.get('stroke'), 'currentColor');
  assert.equal(svg.attributes.get('stroke-width'), '2');
  assert.equal(svg.attributes.get('aria-hidden'), 'true');
  assert.deepEqual(svg.classList.values, ['lucide', 'lucide-refresh-cw', 'sqr-icon']);
  assert.deepEqual(svg.children.map(node => node.attributes.get('d')), [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M8 16H3v5',
  ]);
});

test('Lucide hydration replaces every named placeholder once', () => {
  const replacements = [];
  const placeholders = ['chevron-down', 'trash-2'].map(name => ({
    dataset: { lucide: name },
    replaceChildren(icon) { replacements.push([name, icon]); },
    removeAttribute(attribute) { delete this.dataset[attribute === 'data-lucide' ? 'lucide' : attribute]; },
  }));
  const root = { ownerDocument: createFakeDocument(), querySelectorAll: () => placeholders };
  assert.equal(hydrateLucideIcons(root), 2);
  assert.deepEqual(replacements.map(([name, icon]) => [name, icon.attributes.get('aria-hidden')]), [
    ['chevron-down', 'true'],
    ['trash-2', 'true'],
  ]);
  assert.equal(hydrateLucideIcons(root), 0);
});
