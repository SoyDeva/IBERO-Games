import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml } from '../js/core/html.js';
import { renderHangarScreen } from '../js/ui/hangar-screen.js';
import { renderHomeScreen } from '../js/ui/home-screen.js';
import { renderRankingScreen } from '../js/ui/ranking-screen.js';

const skins = {
  nebula: { icon: '🚀', name: 'Nébula', description: 'Nave inicial', price: 0, body: '#fff', wing: '#ddd', glass: '#aaa', flame: '#f90', glow: '#0ff' },
  solar: { icon: '☀️', name: 'Solar', description: 'Nave brillante', price: 50, body: '#fff', wing: '#ddd', glass: '#aaa', flame: '#f90', glow: '#ff0' }
};

const trails = {
  pulse: { icon: '✨', name: 'Pulso', description: 'Estela inicial', price: 0, primary: '#fff', secondary: '#ccc' },
  comet: { icon: '☄️', name: 'Cometa', description: 'Estela veloz', price: 30, primary: '#fff', secondary: '#ccc' }
};

const economy = {
  credits: 40,
  ownedSkins: ['nebula'],
  activeSkin: 'nebula',
  ownedTrails: ['pulse'],
  activeTrail: 'pulse'
};

test('escapeHtml protege contenido dinámico', () => {
  assert.equal(escapeHtml('<b>"A" & B</b>'), '&lt;b&gt;&quot;A&quot; &amp; B&lt;/b&gt;');
});

test('Inicio conserva acciones, progreso y contenido escapado', () => {
  const html = renderHomeScreen({
    best: 900,
    unlocked: ['first'],
    economy,
    activeSkin: skins.nebula,
    pilotName: '<Piloto>',
    learned: true,
    achievements: { first: { icon: '🏅', title: 'Primer <logro>' } }
  });

  assert.match(html, /900<\/strong> km/);
  assert.match(html, /Repetir tutorial/);
  assert.match(html, /&lt;Piloto&gt;/);
  assert.match(html, /Primer &lt;logro&gt;/);
  assert.match(html, /<strong>1<\/strong>\/1 logros/);
  assert.match(html, /data-nav="ranking"/);
});

test('Hangar conserva compras, equipamiento y mensajes seguros', () => {
  const html = renderHangarScreen({ economy, skins, trails, message: '<Faltan cristales>' });

  assert.match(html, /✓ En uso/);
  assert.match(html, /data-buy-item data-kind="skin" data-item="solar"/);
  assert.match(html, /💎 50 · Desbloquear/);
  assert.match(html, /&lt;Faltan cristales&gt;/);
  assert.match(html, /1\/2 desbloqueadas/);
});

test('Liga representa errores sin inyectar HTML', () => {
  const html = renderRankingScreen({
    snapshot: { ranking: [], status: 'error', error: '<Sin señal>' },
    pilotName: 'Nova',
    seasonName: 'Expedición v23',
    skins,
    trails
  });

  assert.match(html, /🔴 SIN SEÑAL/);
  assert.match(html, /&lt;Sin señal&gt;/);
  assert.match(html, /data-refresh-ranking/);
});

test('Liga destaca al piloto actual y conserva métricas', () => {
  const html = renderRankingScreen({
    snapshot: {
      status: 'ready',
      error: '',
      ranking: [{ name: 'Nova', distance: 1234, checkpoints: 4, correct: 4, skin: 'solar', trail: 'comet' }]
    },
    pilotName: 'nova',
    seasonName: 'Expedición v23',
    skins,
    trails
  });

  assert.match(html, /podium-place place-1 current/);
  assert.match(html, /ranking-row current/);
  assert.match(html, /1234 km/);
  assert.match(html, /☄️ Cometa/);
  assert.match(html, /🟢 EN LÍNEA/);
});
