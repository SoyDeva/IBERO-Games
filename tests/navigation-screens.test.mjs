import test from 'node:test';
import assert from 'node:assert/strict';

import { createRouteState, normalizeRoute, ROUTES } from '../js/core/routes.js';
import { bindNavigation } from '../js/ui/navigation-bindings.js';
import { renderCredits, renderInstructions, renderTeacher } from '../js/ui/static-screens.js';

function fakeButton(nav, mode = '') {
  let clickHandler;
  return {
    dataset: { nav, ...(mode ? { mode } : {}) },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler;
    },
    click() {
      let prevented = false;
      clickHandler?.({ preventDefault() { prevented = true; } });
      return { prevented };
    }
  };
}

function fakeRoot(buttons) {
  return { querySelectorAll: () => buttons };
}

test('normaliza rutas desconocidas y conserva el catálogo público', () => {
  assert.equal(normalizeRoute('ranking'), 'ranking');
  assert.equal(normalizeRoute('desconocida'), 'home');
  assert.ok(ROUTES.includes('flight'));
  assert.ok(ROUTES.includes('teacher'));
});

test('el estado de rutas informa la transición sin exponer mutaciones', () => {
  const routes = createRouteState('shop');
  assert.equal(routes.get(), 'shop');
  assert.deepEqual(routes.set('ranking'), {
    previous: 'shop',
    current: 'ranking',
    changed: true
  });
  assert.deepEqual(routes.set('ruta-invalida'), {
    previous: 'ranking',
    current: 'home',
    changed: true
  });
});

test('los botones normales navegan y pueden prevenir el comportamiento del enlace', () => {
  const home = fakeButton('home');
  const visited = [];
  const count = bindNavigation(fakeRoot([home]), {
    navigate: (route) => visited.push(route),
    preventDefault: true
  });

  const event = home.click();
  assert.equal(count, 1);
  assert.equal(event.prevented, true);
  assert.deepEqual(visited, ['home']);
});

test('el acceso al vuelo se protege y aplica el modo antes de navegar', () => {
  const flight = fakeButton('flight', 'practice');
  const events = [];
  let pendingAction;

  bindNavigation(fakeRoot([flight]), {
    navigate: (route) => events.push(`route:${route}`),
    setMode: (mode) => events.push(`mode:${mode}`),
    guardFlight: true,
    requireFlightAccess: (action) => { pendingAction = action; }
  });

  flight.click();
  assert.deepEqual(events, []);
  assert.equal(typeof pendingAction, 'function');

  pendingAction();
  assert.deepEqual(events, ['mode:practice', 'route:flight']);
});

test('las pantallas informativas conservan navegación y contenido pedagógico', () => {
  const instructions = renderInstructions();
  const teacher = renderTeacher();
  const credits = renderCredits();

  assert.match(instructions, /id="instructions-title"/);
  assert.match(instructions, /data-mode="tutorial"/);
  assert.match(instructions, /Hangar Estelar/);

  assert.match(teacher, /id="teacher-title"/);
  assert.match(teacher, /100 preguntas/);
  assert.match(teacher, /informe-actividad-1\.html/);

  assert.match(credits, /id="credits-title"/);
  assert.match(credits, /Danilo Olarte González/);
  assert.match(credits, /data-nav="home"/);
});
