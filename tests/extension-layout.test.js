import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as extension from '../index.js';

const root = new URL('../', import.meta.url);

test('SillyTavern install files are available at the repository root', () => {
  for (const file of ['manifest.json', 'index.js', 'style.css', 'settings.html']) {
    assert.equal(fs.existsSync(new URL(file, root)), true, `${file} must be at repository root`);
  }
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.js, 'index.js');
  assert.equal(manifest.css, 'style.css');
});

test('LiquidGlass uses one isolated panel root instead of the document body', () => {
  const source = fs.readFileSync(new URL('index.js', root), 'utf8');
  assert.equal((source.match(/LiquidGlass\.init\(/g) ?? []).length, 1);
  assert.match(source, /LiquidGlass\.init\(\{\s*root:\s*panel\.element,\s*glassElements:\s*panel\.glassElements/);
  assert.doesNotMatch(source, /LiquidGlass\.init\(\{[\s\S]{0,120}root:\s*documentImpl\.body/);
  assert.match(source, /button\.hidden = true;\s*element\.appendChild\(button\)/);
});

test('LiquidGlass CDN is pinned to the inspected upstream release', () => {
  const source = fs.readFileSync(new URL('index.js', root), 'utf8');
  assert.match(source, /cdn\.jsdelivr\.net\/npm\/@ybouane\/liquidglass@1\.0\.3\/dist\/index\.js/);
});

test('reply glasses use the official rounded frosted and dark button recipes', () => {
  const styleValues = new Map();
  const surface = { dataset: {} };
  const controls = Array.from({ length: 5 }, () => ({ dataset: {} }));
  const panel = {
    element: {
      style: {
        setProperty(name, value) {
          styleValues.set(name, value);
        },
      },
    },
    glassElements: [surface, ...controls],
  };

  extension.configureReplyPanelGlassElements(panel);

  assert.deepEqual(JSON.parse(surface.dataset.config), {
    blurAmount: 0.25,
    cornerRadius: 30,
    opacity: 0.56,
  });
  for (const control of controls) {
    assert.deepEqual(JSON.parse(control.dataset.config), {
      button: true,
      brightness: -0.3,
      blurAmount: 0.25,
      cornerRadius: 50,
    });
  }
  assert.equal(styleValues.get('--sqr-liquidglass-radius'), '30px');
});

test('LiquidGlass CSS preserves shader rounding and library-owned button feedback', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /#sqr-panel\s*\{[\s\S]*?border-radius:\s*var\(--sqr-liquidglass-radius,\s*30px\)/);
  assert.match(css, /#sqr-panel \.sqr-glass-scene\s*\{[\s\S]*?border-radius:\s*inherit/);
  assert.match(css, /#sqr-panel \.sqr-candidate,\s*#sqr-panel \.sqr-refresh\s*\{[\s\S]*?border-radius:\s*50px/);

  const readyControls = css.match(/#sqr-panel\.sqr-liquidglass-ready \.sqr-candidate,\s*#sqr-panel\.sqr-liquidglass-ready \.sqr-refresh\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.doesNotMatch(readyControls, /border-radius\s*:\s*0/);
  assert.match(css, /#sqr-panel:not\(\.sqr-liquidglass-ready\) \.sqr-candidate:hover,\s*#sqr-panel:not\(\.sqr-liquidglass-ready\) \.sqr-refresh:hover/);
  assert.doesNotMatch(css, /#sqr-panel \.sqr-candidate:hover,\s*#sqr-panel \.sqr-refresh:hover\s*\{/);
});

test('visible panel retries after a stale async LiquidGlass init without a false ready state', async () => {
  const classes = new Set();
  const scheduled = [];
  const initResolvers = [];
  let visible = true;
  const panel = {
    element: {
      classList: {
        add: value => classes.add(value),
        remove: value => classes.delete(value),
        contains: value => classes.has(value),
      },
    },
    isVisible: () => visible,
  };
  const windowImpl = {
    requestIdleCallback(callback) {
      scheduled.push(callback);
      return scheduled.length;
    },
    cancelIdleCallback() {},
  };
  const controller = extension.createReplyPanelLiquidGlassController(panel, {
    window: windowImpl,
    init: () => new Promise(resolve => initResolvers.push(resolve)),
  });

  controller.ensure();
  scheduled.shift()();
  assert.equal(initResolvers.length, 1);

  visible = false;
  controller.dispose();
  visible = true;
  controller.ensure();

  const staleInstance = { destroyCalls: 0, destroy() { this.destroyCalls += 1; } };
  initResolvers.shift()(staleInstance);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(staleInstance.destroyCalls, 1);
  assert.equal(classes.has('sqr-liquidglass-ready'), false);
  assert.equal(scheduled.length, 1);

  scheduled.shift()();
  const currentInstance = { destroyCalls: 0, destroy() { this.destroyCalls += 1; } };
  initResolvers.shift()(currentInstance);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(classes.has('sqr-liquidglass-ready'), true);
  controller.dispose();
  assert.equal(currentInstance.destroyCalls, 1);
  assert.equal(classes.has('sqr-liquidglass-ready'), false);
});
