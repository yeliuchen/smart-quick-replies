import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
