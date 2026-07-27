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
