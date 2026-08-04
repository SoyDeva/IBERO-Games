import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('la portada carga las capas visuales antes de accesibilidad', async () => {
  const html = await read('index.html');
  const visualIndex = html.indexOf('css/nebula-bright.css?v=23');
  const flightIndex = html.indexOf('css/flight-polish.css?v=23');
  const resultsIndex = html.indexOf('css/mission-results.css?v=23');
  const hangarIndex = html.indexOf('css/hangar-polish.css?v=23');
  const rankingIndex = html.indexOf('css/ranking-polish.css?v=23');
  const accessibilityIndex = html.indexOf('css/accessibility.css?v=23');

  assert.ok(visualIndex > 0);
  assert.ok(flightIndex > visualIndex);
  assert.ok(resultsIndex > flightIndex);
  assert.ok(hangarIndex > resultsIndex);
  assert.ok(rankingIndex > hangarIndex);
  assert.ok(accessibilityIndex > rankingIndex);
  assert.match(html, /meta name="theme-color" content="#0b071b"/);
});

test('Nébula brillante define identidad, respuesta móvil y reducción de movimiento sin red', async () => {
  const css = await read('css/nebula-bright.css');

  assert.match(css, /--color-space|--ink: #f7f8ff/);
  assert.match(css, /\.site-header\s*\{/);
  assert.match(css, /\.flight-home\s*\{/);
  assert.match(css, /\.home-actions \.launch-button\s*\{/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('el pulido de vuelo estiliza HUD, preguntas y respuestas sin dependencias remotas', async () => {
  const css = await read('css/flight-polish.css');

  assert.match(css, /\.flight-hud\s*\{/);
  assert.match(css, /\.hud-block::before\s*\{/);
  assert.match(css, /#fuel-fill\s*\{/);
  assert.match(css, /\.quiz-card\s*\{/);
  assert.match(css, /\.quiz-options button\.correct\s*[,\{]/);
  assert.match(css, /\.quiz-options button\.wrong\s*\{/);
  assert.match(css, /\.quiz-panel\[data-answered="true"\]/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('la bitácora visual destaca resultados, Liga y recompensas sin dependencias remotas', async () => {
  const css = await read('css/mission-results.css');

  assert.match(css, /\.stranded-card\s*\{/);
  assert.match(css, /\.flight-summary\s*\{/);
  assert.match(css, /\.flight-summary span:nth-child\(6\)/);
  assert.match(css, /\.flight-summary span:nth-child\(7\)/);
  assert.match(css, /\.ranking-result\.syncing\s*\{/);
  assert.match(css, /\.ranking-result\.sync-error\s*\{/);
  assert.match(css, /\.learned-fact\s*\{/);
  assert.match(css, /\.run-achievements\s*\{/);
  assert.match(css, /\.summary-actions \.launch-button\s*\{/);
  assert.match(css, /@media \(max-width: 460px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('el Hangar Estelar diferencia colección, equipamiento y respuesta móvil sin dependencias remotas', async () => {
  const css = await read('css/hangar-polish.css');

  assert.match(css, /\.orbital-shop\.screen-narrow\s*\{/);
  assert.match(css, /\.hangar-hero\s*\{/);
  assert.match(css, /\.shop-wallet\s*\{/);
  assert.match(css, /\.skin-card\.active::after\s*\{/);
  assert.match(css, /content: "EQUIPADA"/);
  assert.match(css, /\.trail-card\.active::after\s*\{/);
  assert.match(css, /content: "EN USO"/);
  assert.match(css, /@supports selector\(:has\(\*\)\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('la Liga Galáctica destaca podio, piloto y estados sin dependencias remotas', async () => {
  const css = await read('css/ranking-polish.css');

  assert.match(css, /\.galaxy-ranking\.screen-narrow\s*\{/);
  assert.match(css, /\.ranking-hero\s*\{/);
  assert.match(css, /\.space-podium::before\s*\{/);
  assert.match(css, /content: "PODIO DE LA TEMPORADA"/);
  assert.match(css, /\.podium-place\.current::after\s*\{/);
  assert.match(css, /content: "TU POSICIÓN"/);
  assert.match(css, /\.ranking-row\.current::after\s*\{/);
  assert.match(css, /\.ranking-loading::after\s*\{/);
  assert.match(css, /\.ranking-error\s*\{/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('la mejora visual conserva las acciones funcionales de Inicio', async () => {
  const source = await read('js/ui/home-screen.js');

  assert.match(source, /data-nav="flight" data-mode="mission"/);
  assert.match(source, /data-nav="shop"/);
  assert.match(source, /data-nav="ranking"/);
  assert.match(source, /data-nav="flight" data-mode="tutorial"/);
  assert.match(source, /data-nav="flight" data-mode="practice"/);
  assert.match(source, /data-change-pilot/);
});

test('el vuelo conserva sus identificadores y las clases de retroalimentación existentes', async () => {
  const app = await read('js/app.js');
  const quiz = await read('js/ui/quiz-panel.js');

  for (const id of [
    'fuel-fill',
    'fuel-value',
    'hull-value',
    'distance-value',
    'checkpoint-number',
    'remaining-value',
    'level-value',
    'ammo-value',
    'quiz-panel',
    'quiz-options',
    'quiz-result'
  ]) {
    assert.match(app, new RegExp('id=\\"' + id + '\\"'));
  }

  assert.match(quiz, /classList\.add\('correct'\)/);
  assert.match(quiz, /classList\.add\('wrong'\)/);
  assert.match(quiz, /panel\.dataset\.answered = 'true'/);
  assert.doesNotMatch(quiz, /setTimeout|fetch\s*\(/);
});

test('la bitácora conserva métricas, acciones y sincronización funcionales', async () => {
  const source = await read('js/ui/game-over-screen.js');

  for (const metric of [
    'summary.distance',
    'summary.correct',
    'summary.bestStreak',
    'summary.destroyed',
    'summary.checkpoints',
    'summary.best',
    'summary.crystals'
  ]) {
    assert.match(source, new RegExp(metric.replace('.', '\\.')));
  }

  for (const id of [
    'restart-flight',
    'ranking-after-game',
    'shop-after-game',
    'practice-after-game',
    'ranking-result'
  ]) {
    assert.match(source, new RegExp(id));
  }

  assert.match(source, /actions\.restart/);
  assert.match(source, /actions\.practice/);
  assert.match(source, /actions\.shop/);
  assert.match(source, /actions\.ranking/);
  assert.match(source, /actions\.exit/);
  assert.match(source, /rankingSyncPresentation/);
  assert.doesNotMatch(source, /fetch\s*\(|setTimeout/);
});

test('el Hangar conserva catálogo, compras, equipamiento y navegación funcionales', async () => {
  const source = await read('js/ui/hangar-screen.js');

  assert.match(source, /economy\.ownedSkins\.includes\(id\)/);
  assert.match(source, /economy\.activeSkin === id/);
  assert.match(source, /economy\.ownedTrails\.includes\(id\)/);
  assert.match(source, /economy\.activeTrail === id/);
  assert.match(source, /data-buy-item/);
  assert.match(source, /data-equip-item/);
  assert.match(source, /data-kind=/);
  assert.match(source, /data-item=/);
  assert.match(source, /data-crystal-balance/);
  assert.match(source, /data-nav="flight" data-mode="mission"/);
  assert.match(source, /data-nav="ranking"/);
  assert.match(source, /data-nav="home"/);
  assert.doesNotMatch(source, /fetch\s*\(|setTimeout|localStorage/);
});

test('la Liga conserva posiciones, métricas, actualización y navegación funcionales', async () => {
  const source = await read('js/ui/ranking-screen.js');

  assert.match(source, /const medals = \['🥇', '🥈', '🥉'\]/);
  assert.match(source, /const podium = \[1, 0, 2\]\.map/);
  assert.match(source, /ranking\.map\(\(entry, index\)/);
  assert.match(source, /isCurrentPilot\(entry\.name\)/);
  assert.match(source, /entry\.distance/);
  assert.match(source, /entry\.checkpoints/);
  assert.match(source, /entry\.correct/);
  assert.match(source, /rankingStatus === 'loading'/);
  assert.match(source, /rankingStatus === 'error'/);
  assert.match(source, /data-refresh-ranking/);
  assert.match(source, /data-nav="flight" data-mode="mission"/);
  assert.match(source, /data-nav="shop"/);
  assert.match(source, /data-nav="home"/);
  assert.match(source, /escapeHtml\(entry\.name\)/);
  assert.doesNotMatch(source, /fetch\s*\(|setTimeout|localStorage/);
});
