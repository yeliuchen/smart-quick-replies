# LiquidGlass Lucide UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the reply panel background transparent LiquidGlass, make reply controls dark LiquidGlass, and replace every plugin-owned symbol, Emoji, and Font Awesome icon with Lucide Icons.

**Architecture:** Add a small local Lucide SVG factory so the extension has no icon CDN or build-time dependency. Keep the current single `LiquidGlass.init()` lifecycle and assign distinct official per-element configs to the panel surface and controls. Programmatic panel controls and hydrated settings placeholders share the same icon factory.

**Tech Stack:** Browser ES modules, DOM SVG APIs, CSS, `@ybouane/liquidglass@1.0.3`, Node.js built-in test runner.

## Global Constraints

- Keep exactly one `LiquidGlass.init()` call and one WebGL context for the reply panel.
- Use only options documented by `@ybouane/liquidglass`: `blurAmount`, `cornerRadius`, `opacity`, `button`, and `brightness`.
- Do not add a Lucide CDN, icon font, UI framework, bundler, or runtime dependency.
- Remove plugin-owned Emoji, text-arrow, and Font Awesome icons from both the panel and settings UI.
- Preserve Chinese `aria-label` and `title` text for icon-only controls.
- Do not modify API, prompt generation, parsing, or trigger behavior.

---

### Task 1: Local Lucide SVG Factory

**Files:**
- Create: `icons.js`
- Create: `tests/icons.test.js`

**Interfaces:**
- Consumes: standard `Document.createElementNS()` and elements exposing `querySelectorAll()`.
- Produces: `createLucideIcon(documentImpl, name, options?) -> SVGElement` and `hydrateLucideIcons(root, documentImpl?) -> number`.

- [ ] **Step 1: Write the failing SVG factory tests**

Create `tests/icons.test.js` with a small SVG-capable fake document and tests that independently assert the generated element contract:

```js
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
```

- [ ] **Step 2: Run the icon tests and verify RED**

Run: `node --test tests/icons.test.js`

Expected: FAIL because `../icons.js` does not exist.

- [ ] **Step 3: Implement the minimal local Lucide factory**

Create `icons.js`. Define the nine approved icons as immutable element descriptions using the official Lucide SVG geometry:

```js
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const ICON_NODES = Object.freeze({
  'grip-vertical': [
    ['circle', { cx: 9, cy: 12, r: 1 }],
    ['circle', { cx: 9, cy: 5, r: 1 }],
    ['circle', { cx: 9, cy: 19, r: 1 }],
    ['circle', { cx: 15, cy: 12, r: 1 }],
    ['circle', { cx: 15, cy: 5, r: 1 }],
    ['circle', { cx: 15, cy: 19, r: 1 }],
  ],
  'refresh-cw': [
    ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
    ['path', { d: 'M21 3v5h-5' }],
    ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
    ['path', { d: 'M8 16H3v5' }],
  ],
  'trending-up': [
    ['path', { d: 'M16 7h6v6' }],
    ['path', { d: 'm22 7-8.5 8.5-5-5L2 17' }],
  ],
  'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
  sparkles: [
    ['path', { d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' }],
    ['path', { d: 'M20 2v4' }],
    ['path', { d: 'M22 4h-4' }],
    ['circle', { cx: 4, cy: 20, r: 2 }],
  ],
  'map-pin-off': [
    ['path', { d: 'M12.75 7.09a3 3 0 0 1 2.16 2.16' }],
    ['path', { d: 'M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568' }],
    ['path', { d: 'm2 2 20 20' }],
    ['path', { d: 'M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533' }],
    ['path', { d: 'M9.13 9.13a3 3 0 0 0 3.74 3.74' }],
  ],
  'list-restart': [
    ['path', { d: 'M21 5H3' }],
    ['path', { d: 'M7 12H3' }],
    ['path', { d: 'M7 19H3' }],
    ['path', { d: 'M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14' }],
    ['path', { d: 'M11 10v4h4' }],
  ],
  'undo-2': [
    ['path', { d: 'M9 14 4 9l5-5' }],
    ['path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11' }],
  ],
  'trash-2': [
    ['path', { d: 'M10 11v6' }],
    ['path', { d: 'M14 11v6' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
    ['path', { d: 'M3 6h18' }],
    ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
  ],
});
```

`createLucideIcon()` must reject unknown names, create every SVG child with `createElementNS`, apply the common Lucide attributes, add `lucide`, `lucide-${name}`, and the optional class. `hydrateLucideIcons()` must hydrate `[data-lucide]`, remove the marker, and return the count.

- [ ] **Step 4: Run the icon tests and verify GREEN**

Run: `node --test tests/icons.test.js`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the icon factory**

```bash
git add icons.js tests/icons.test.js
git commit -m "feat: add local Lucide icon factory"
```

---

### Task 2: Reply Panel and Manual Trigger Icons

**Files:**
- Modify: `index.js:1`
- Modify: `index.js:1060-1240`
- Modify: `index.js:1621-1629`
- Create: `tests/panel-icons.test.js`

**Interfaces:**
- Consumes: `createLucideIcon(documentImpl, name, options)` from Task 1.
- Produces: `renderCandidateButton(button, item, documentImpl) -> string`, preserving `.sqr-candidate-icon` and `.sqr-candidate-text`.

- [ ] **Step 1: Write failing candidate rendering tests**

Create `tests/panel-icons.test.js` with a minimal fake element implementation. Assert two observable behaviors:

```js
test('candidate updates preserve the Lucide progression icon', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  const value = renderCandidateButton(button, { text: '一起去看看吧', progression: true }, documentImpl);
  assert.equal(value, '一起去看看吧');
  assert.equal(button.querySelector('.sqr-candidate-text').textContent, '一起去看看吧');
  assert.equal(button.querySelector('.lucide-trending-up').hidden, false);

  renderCandidateButton(button, { text: '那就先休息一下', progression: false }, documentImpl);
  assert.equal(button.querySelector('.sqr-candidate-text').textContent, '那就先休息一下');
  assert.equal(button.querySelector('.lucide-trending-up').hidden, true);
});

test('empty candidates hide their button without removing its Lucide children', () => {
  const documentImpl = createFakeHtmlDocument();
  const button = documentImpl.createElement('button');
  renderCandidateButton(button, '', documentImpl);
  assert.equal(button.hidden, true);
  assert.ok(button.querySelector('.lucide-trending-up'));
});
```

- [ ] **Step 2: Run the panel icon tests and verify RED**

Run: `node --test tests/panel-icons.test.js`

Expected: FAIL because `renderCandidateButton` is not exported.

- [ ] **Step 3: Integrate Lucide icons into programmatic controls**

In `index.js`:

- Import `createLucideIcon` and `hydrateLucideIcons` from `./icons.js`.
- Replace drag text `⋮⋮` with `createLucideIcon(documentImpl, 'grip-vertical', { className: 'sqr-icon' })`.
- Initialize each candidate button with a hidden `trending-up` icon and `.sqr-candidate-text` span.
- Export `renderCandidateButton()` and make `setCandidates()` call it.
- Read candidate clicks from `.sqr-candidate-text`, not `button.textContent`.
- Replace refresh Emoji with `refresh-cw`.
- Build the manual trigger with `sparkles` plus a text span containing `回复建议`.

Minimal candidate update:

```js
export function renderCandidateButton(button, item, documentImpl = button?.ownerDocument) {
  let icon = button.querySelector?.('.sqr-candidate-icon');
  let text = button.querySelector?.('.sqr-candidate-text');
  if (!icon || !text) {
    button.replaceChildren();
    icon = createLucideIcon(documentImpl, 'trending-up', { className: 'sqr-candidate-icon' });
    icon.hidden = true;
    text = documentImpl.createElement('span');
    text.className = 'sqr-candidate-text';
    button.append(icon, text);
  }
  const value = String(typeof item === 'object' ? item?.text ?? item?.reply ?? '' : item ?? '').trim();
  const progression = typeof item === 'object' && Boolean(item?.progression);
  icon.hidden = !progression;
  text.textContent = value;
  button.classList.toggle('sqr-progression', progression);
  button.title = progression ? `推进剧情：${value}` : value;
  button.hidden = !value;
  return value;
}
```

- [ ] **Step 4: Run panel and existing layout tests**

Run: `node --test tests/panel-icons.test.js tests/extension-layout.test.js`

Expected: panel tests pass; any old text-symbol assertions fail and are removed or replaced only when they contradict the approved Lucide behavior.

- [ ] **Step 5: Commit panel icon integration**

```bash
git add index.js tests/panel-icons.test.js tests/extension-layout.test.js
git commit -m "feat: use Lucide icons in reply controls"
```

---

### Task 3: Settings Lucide Hydration

**Files:**
- Modify: `settings.html`
- Modify: `index.js:853-930`
- Modify: `style.css:19-105`
- Modify: `tests/settings.test.js:100-180`

**Interfaces:**
- Consumes: `hydrateLucideIcons(container)` from Task 1.
- Produces: settings markup containing `data-lucide` placeholders and no plugin-owned Font Awesome or text-chevron icons.

- [ ] **Step 1: Write failing settings icon inventory tests**

Update the settings markup tests to assert all approved placements:

```js
test('settings declare the complete Lucide icon inventory without legacy icons', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  assert.equal((html.match(/data-lucide="chevron-down"/g) ?? []).length, 9);
  for (const icon of ['map-pin-off', 'list-restart', 'undo-2', 'trash-2']) {
    assert.match(html, new RegExp(`data-lucide="${icon}"`));
  }
  assert.doesNotMatch(html, /fa-solid|fa-circle-chevron-down|>\\s*▾\\s*</);
});
```

The count of nine covers one root drawer icon, six settings section icons, and two color picker icons.

- [ ] **Step 2: Run settings tests and verify RED**

Run: `node --test tests/settings.test.js`

Expected: FAIL because current settings markup still contains Font Awesome and text chevrons.

- [ ] **Step 3: Replace settings symbols and hydrate once**

In `settings.html`:

- Replace every drawer or picker arrow with `<span class="..." data-lucide="chevron-down" aria-hidden="true"></span>`.
- Prefix action button text with placeholders for `map-pin-off`, `list-restart`, `undo-2`, and `trash-2`.

In `renderSettings()` call `hydrateLucideIcons(container)` before binding interactions.

In `style.css` define `.sqr-icon` and `.lucide` sizing without fixed fill, align action button icon/text with `inline-flex`, and preserve existing rotation selectors on the wrapper containing `chevron-down`.

- [ ] **Step 4: Run settings and icon tests**

Run: `node --test tests/settings.test.js tests/icons.test.js`

Expected: all tests pass.

- [ ] **Step 5: Commit settings icon integration**

```bash
git add settings.html index.js style.css tests/settings.test.js
git commit -m "feat: use Lucide icons throughout settings"
```

---

### Task 4: Transparent Panel and Dark LiquidGlass Controls

**Files:**
- Modify: `index.js:1256-1280`
- Modify: `style.css:360-500`
- Modify: `tests/extension-layout.test.js:17-73`

**Interfaces:**
- Consumes: current `configureReplyPanelGlassElements(panel)`.
- Produces: surface config `{ blurAmount: 0.25, cornerRadius: 30, opacity: 0.30 }` and control config `{ button: true, brightness: -0.45, blurAmount: 0.25, cornerRadius: 50, opacity: 0.88 }`.

- [ ] **Step 1: Change the LiquidGlass behavior test first**

Update the glass recipe test to require the approved transparent/dark hierarchy:

```js
assert.deepEqual(JSON.parse(surface.dataset.config), {
  blurAmount: 0.25,
  cornerRadius: 30,
  opacity: 0.30,
});
for (const control of controls) {
  assert.deepEqual(JSON.parse(control.dataset.config), {
    button: true,
    brightness: -0.45,
    blurAmount: 0.25,
    cornerRadius: 50,
    opacity: 0.88,
  });
}
```

Also keep the existing assertion that only one `LiquidGlass.init()` exists.

- [ ] **Step 2: Run the LiquidGlass test and verify RED**

Run: `node --test tests/extension-layout.test.js`

Expected: FAIL because the panel currently uses opacity `0.56` and controls omit opacity with brightness `-0.3`.

- [ ] **Step 3: Apply official LiquidGlass configs and CSS fallback**

Change only the documented per-element config objects:

```js
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
```

Update CSS fallback:

- `#sqr-panel` background becomes a transparent theme tint rather than the current opaque `rgba(92, 94, 102, 0.88)`.
- Candidate and refresh fallback backgrounds become dark translucent neutral glass.
- `.sqr-liquidglass-ready` continues to clear CSS backgrounds and borders so the library owns the rendered effect.
- Replace the old progression `::before` glyph rule with layout/color rules for `.sqr-candidate-icon`.
- Add loading rotation for `.sqr-refresh .lucide-refresh-cw` and disable it under `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 4: Run focused tests and syntax checks**

Run:

```bash
node --test tests/extension-layout.test.js tests/panel-icons.test.js tests/settings.test.js tests/icons.test.js
node --check index.js
node --check icons.js
```

Expected: all focused tests pass and both syntax checks exit 0.

- [ ] **Step 5: Commit the glass hierarchy**

```bash
git add index.js style.css tests/extension-layout.test.js tests/settings.test.js
git commit -m "style: separate transparent and dark LiquidGlass layers"
```

---

### Task 5: Full Regression and Source Audit

**Files:**
- Modify only files required to correct failures found by this task.

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: a clean, tested implementation with no legacy plugin icon remnants.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run static validation**

Run:

```bash
node --check index.js
node --check icons.js
git diff --check
rg -n "🔄|⋮⋮|content:\\s*['\"]↗|fa-solid|fa-circle-chevron-down|>\\s*▾\\s*<" index.js settings.html style.css
```

Expected: syntax and diff checks exit 0; the icon audit returns no matches.

- [ ] **Step 3: Verify the final diff against the design**

Run:

```bash
git diff --stat HEAD~4
git diff HEAD~4 -- index.js icons.js settings.html style.css tests
```

Confirm:

- One LiquidGlass instance remains.
- The large panel config is more transparent than the control config.
- Every approved icon placement uses the local Lucide factory.
- Candidate text updates preserve icon nodes.
- No API or generation behavior changed.

- [ ] **Step 4: Record any final correction**

If Step 1–3 expose a real defect, first add or tighten the test that catches it, verify RED, apply the minimal correction, and rerun the full suite.

- [ ] **Step 5: Commit final corrections if needed**

```bash
git add index.js icons.js settings.html style.css tests
git commit -m "test: verify LiquidGlass Lucide UI integration"
```
