import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

function replaceExpected(label, value, replacement, expectedCount) {
  const count = source.split(value).length - 1;
  if (count !== expectedCount) {
    throw new Error(`${label}: se esperaban ${expectedCount} coincidencias y se encontraron ${count}`);
  }
  source = source.split(value).join(replacement);
}

replaceOnce(
  'importar estado de rutas',
  "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';",
  "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';\nimport { createRouteState } from './core/routes.js?v=23';"
);
replaceOnce(
  'importar navegación y pantallas estáticas',
  "import { cleanPilotName, getPilotName, getPilotSession, loadRememberedPilot, savePilot } from './services/pilot-profile-store.js?v=23';",
  "import { cleanPilotName, getPilotName, getPilotSession, loadRememberedPilot, savePilot } from './services/pilot-profile-store.js?v=23';\nimport { bindNavigation } from './ui/navigation-bindings.js?v=23';\nimport { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';"
);

replaceOnce('crear estado de navegación', "let route = 'home';", "const navigation = createRouteState('home');");

replaceExpected(
  'consultas de ruta durante actualización del ranking',
  "if (route === 'ranking') render();",
  "if (navigation.get() === 'ranking') render();",
  2
);

replaceOnce(
  'centralizar transición de pantalla',
  /function setRoute\(next\) \{[\s\S]*?\n\}\n\nfunction renderHome\(\) \{/,
  `function setRoute(next) {
  const transition = navigation.set(next);
  window.clearTimeout(quizTimer);
  window.clearTimeout(toastTimer);
  window.clearTimeout(achievementTimer);
  window.clearTimeout(ammoRechargeTimer);
  stopMusic();
  document.body.classList.remove('flight-screen-locked');
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const exitResult = exit?.call(document);
    exitResult?.catch?.(() => {});
  }
  flight?.destroy();
  flight = null;
  if (transition.current === 'shop' && transition.previous !== 'shop') shopMessage = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => app.focus(), 30);
}

function renderHome() {`
);

replaceOnce(
  'retirar pantallas informativas duplicadas',
  /function renderInstructions\(\) \{[\s\S]*?\n\}\n\nfunction bindShop\(\) \{/,
  'function bindShop() {'
);

replaceOnce(
  'usar navegación común al renderizar',
  /function render\(\) \{[\s\S]*?\n\}\n\nfunction showToast\(message, tone = 'normal'\) \{/,
  `function render() {
  const route = navigation.get();
  const screens = { home: renderHome, flight: renderFlight, shop: renderShop, ranking: renderRanking, instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits };
  document.body.classList.toggle('flight-route', route === 'flight');
  app.innerHTML = (screens[route] || renderHome)();
  bindNavigation(app, {
    navigate: setRoute,
    setMode: (mode) => { flightMode = mode; },
    guardFlight: true,
    requireFlightAccess: requirePilot
  });
  app.querySelectorAll('[data-change-pilot]').forEach((button) => button.addEventListener('click', () => openPilotDialog(() => render())));
  app.querySelectorAll('[data-refresh-ranking]').forEach((button) => button.addEventListener('click', () => refreshGlobalRanking(true)));
  if (route === 'flight') bindFlight();
  if (route === 'shop') bindShop();
  if (route === 'ranking' && rankingController.getSnapshot().status === 'idle') window.setTimeout(() => refreshGlobalRanking(), 0);
  applySettings();
}

function showToast(message, tone = 'normal') {`
);

replaceOnce(
  'usar ruta central en el ajuste del viewport',
  "if (route === 'flight') flight?.resize();",
  "if (navigation.get() === 'flight') flight?.resize();"
);

replaceOnce(
  'usar enlazador común en el encabezado',
  /document\.querySelectorAll\('\.site-header \[data-nav\]'\)\.forEach\(\(button\) => button\.addEventListener\('click', \(event\) => \{\n  event\.preventDefault\(\);\n  setRoute\(button\.dataset\.nav\);\n\}\)\);/,
  "bindNavigation(document.querySelector('.site-header'), { navigate: setRoute, preventDefault: true });"
);

replaceOnce(
  'usar ruta central en el teclado',
  "(event.key === 'p' || event.key === 'P') && flight && route === 'flight'",
  "(event.key === 'p' || event.key === 'P') && flight && navigation.get() === 'flight'"
);

for (const forbidden of [
  "let route = 'home'",
  'function renderInstructions()',
  'function renderTeacher()',
  'function renderCredits()',
  "app.querySelectorAll('[data-nav]')",
  "document.querySelectorAll('.site-header [data-nav]')"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió código duplicado: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega rutas, enlaces de navegación y pantallas informativas.');
