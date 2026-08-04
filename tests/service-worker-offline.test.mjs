import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

function normalizedPath(value) {
  const clean = String(value).split(/[?#]/)[0].replace(/^\.\//, '');
  return clean === '' ? 'index.html' : clean;
}

function collectFiles(directory, extension) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(absolute, extension));
    else if (entry.name.endsWith(extension)) files.push(relative(root, absolute).replaceAll('\\', '/'));
  }
  return files.sort();
}

function appShellEntries() {
  const match = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, 'sw.js debe declarar APP_SHELL');
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

const entries = appShellEntries();
const cachedPaths = new Set(entries.map(normalizedPath));

test('la caché inicial contiene todos los módulos JavaScript del juego', () => {
  const javascriptFiles = collectFiles(join(root, 'js'), '.js');
  assert.ok(javascriptFiles.length >= 79);
  for (const file of javascriptFiles) {
    assert.ok(cachedPaths.has(file), `${file} no está en APP_SHELL`);
  }
});

test('la caché inicial contiene estilos, script principal e icono usados por index.html', () => {
  const resources = [...indexHtml.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => /\.(?:css|js|svg)(?:[?#]|$)/i.test(value));

  assert.ok(resources.length >= 14);
  for (const resource of resources) {
    assert.ok(cachedPaths.has(normalizedPath(resource)), `${resource} no está en APP_SHELL`);
  }
});

test('el manifiesto no repite rutas y solo referencia archivos existentes', () => {
  assert.equal(new Set(entries).size, entries.length);
  for (const entry of entries) {
    if (entry === './') continue;
    const localPath = normalizedPath(entry);
    assert.ok(existsSync(join(root, localPath)), `${entry} no existe en el repositorio`);
  }
});

test('la navegación puede usar index.html, pero CSS y JS nunca reciben HTML como reserva', () => {
  assert.match(serviceWorker, /event\.request\.mode === 'navigate'/);
  assert.match(serviceWorker, /caches\.match\(request, \{ ignoreSearch: true \}\)/);
  assert.match(serviceWorker, /status: 503/);
  assert.equal((serviceWorker.match(/cachedResponse\('\.\/index\.html'\)/g) || []).length, 1);
});
