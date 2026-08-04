import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const appSource = readFileSync(join(root, 'js/app.js'), 'utf8');
const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));

function pngDimensions(relativePath) {
  const absolutePath = join(root, relativePath);
  assert.ok(existsSync(absolutePath), `${relativePath} debe existir`);
  const buffer = readFileSync(absolutePath);
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: statSync(absolutePath).size
  };
}

function cachedPaths() {
  const match = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, 'sw.js debe declarar APP_SHELL');
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1].replace(/^\.\//, '')));
}

test('el manifiesto define una aplicación educativa autónoma y local', () => {
  assert.equal(manifest.name, 'Misión Nébula · Pilota, responde y avanza');
  assert.equal(manifest.short_name, 'Misión Nébula');
  assert.equal(manifest.lang, 'es');
  assert.equal(manifest.dir, 'ltr');
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './#inicio');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  assert.equal(manifest.theme_color.toLowerCase(), '#0b071b');
  assert.equal(manifest.background_color.toLowerCase(), '#0b071b');
  assert.deepEqual(manifest.categories, ['education', 'games']);
  assert.doesNotMatch(JSON.stringify(manifest), /https?:\/\//i);
});

test('los iconos instalables tienen dimensiones y propósito correctos', () => {
  assert.equal(manifest.icons.length, 2);
  const icon192 = manifest.icons.find((icon) => icon.sizes === '192x192');
  const icon512 = manifest.icons.find((icon) => icon.sizes === '512x512');
  assert.ok(icon192);
  assert.ok(icon512);
  assert.equal(icon192.type, 'image/png');
  assert.equal(icon512.type, 'image/png');
  assert.match(icon512.purpose, /maskable/);

  const small = pngDimensions(icon192.src);
  const large = pngDimensions(icon512.src);
  const apple = pngDimensions('assets/icons/app-icon-180.png');
  assert.deepEqual([small.width, small.height], [192, 192]);
  assert.deepEqual([large.width, large.height], [512, 512]);
  assert.deepEqual([apple.width, apple.height], [180, 180]);
  assert.ok(small.bytes > 1000);
  assert.ok(large.bytes > 3000);
  assert.ok(apple.bytes > 1000);
});

test('la portada enlaza manifiesto, icono de iOS y metadatos de aplicación', () => {
  assert.match(indexHtml, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(indexHtml, /<link rel="apple-touch-icon" sizes="180x180" href="assets\/icons\/app-icon-180\.png">/);
  assert.match(indexHtml, /<meta name="application-name" content="Misión Nébula">/);
  assert.match(indexHtml, /<meta name="apple-mobile-web-app-title" content="Misión Nébula">/);
  assert.match(appSource, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('el manifiesto y sus iconos están disponibles desde la caché inicial', () => {
  const paths = cachedPaths();
  for (const path of [
    'manifest.webmanifest',
    'assets/icons/app-icon-180.png',
    'assets/icons/app-icon-192.png',
    'assets/icons/app-icon-512.png'
  ]) {
    assert.ok(paths.has(path), `${path} debe formar parte de APP_SHELL`);
  }
  assert.match(serviceWorker, /\(\?:html\|css\|js\|webmanifest\)/);
});
