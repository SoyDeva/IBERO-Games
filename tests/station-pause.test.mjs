import assert from 'node:assert/strict';
import test from 'node:test';

import { createStationSession, STATION_OFFERS } from '../js/core/station.js';
import { applyPausePanelState, pauseButtonMarkup } from '../js/ui/pause-panel.js';
import { renderStationOffers, updateStationButtons } from '../js/ui/station-panel.js';

test('la estación conserva las tres mejoras y sus precios', () => {
  assert.deepEqual(Object.keys(STATION_OFFERS), ['repair', 'plasma', 'stabilizer']);
  assert.equal(STATION_OFFERS.repair.price, 20);
  assert.equal(STATION_OFFERS.plasma.price, 25);
  assert.equal(STATION_OFFERS.stabilizer.price, 30);
});

test('la sesión valida saldo y permite una sola compra por visita', () => {
  const session = createStationSession();
  const insufficient = session.inspect('plasma', 18);
  assert.equal(insufficient.status, 'insufficient');
  assert.equal(insufficient.missing, 7);

  assert.equal(session.inspect('plasma', 25).status, 'available');
  assert.equal(session.confirm('plasma'), true);
  assert.equal(session.hasPurchased(), true);
  assert.equal(session.getPurchasedId(), 'plasma');
  assert.equal(session.inspect('repair', 100).status, 'completed');
  assert.equal(session.confirm('repair'), false);

  session.reset();
  assert.equal(session.hasPurchased(), false);
  assert.equal(session.inspect('repair', 20).status, 'available');
});

test('rechaza identificadores de mejora inexistentes', () => {
  const session = createStationSession();
  assert.equal(session.inspect('fantasma', 100).status, 'invalid');
  assert.equal(session.confirm('fantasma'), false);
});

test('genera los botones de estación y escapa contenido dinámico', () => {
  const markup = renderStationOffers({
    test: { icon: '<i>', name: '<b>Mejora</b>', description: 'A & B', price: 12 }
  });
  assert.match(markup, /data-station-buy="test"/);
  assert.match(markup, /data-price="12"/);
  assert.doesNotMatch(markup, /<b>Mejora<\/b>/);
  assert.match(markup, /&lt;b&gt;Mejora&lt;\/b&gt;/);
  assert.match(markup, /A &amp; B/);
});

test('habilita botones según saldo y compra realizada', () => {
  const makeButton = (price) => ({
    dataset: { price: String(price) },
    disabled: false,
    classList: {
      values: new Set(),
      toggle(name, enabled) {
        if (enabled) this.values.add(name);
        else this.values.delete(name);
      }
    }
  });
  const cheap = makeButton(20);
  const expensive = makeButton(30);
  const documentRef = { querySelectorAll: () => [cheap, expensive] };

  updateStationButtons({ documentRef, credits: 25, purchased: false });
  assert.equal(cheap.disabled, false);
  assert.equal(expensive.disabled, true);
  assert.equal(expensive.classList.values.has('unaffordable'), true);

  updateStationButtons({ documentRef, credits: 100, purchased: true });
  assert.equal(cheap.disabled, true);
  assert.equal(expensive.disabled, true);
  assert.equal(expensive.classList.values.has('unaffordable'), false);
});

test('representa de forma consistente los estados de pausa', () => {
  assert.match(pauseButtonMarkup(true), /Continuar/);
  assert.match(pauseButtonMarkup(false), /Pausa/);

  const pageClasses = new Set();
  const page = {
    classList: {
      toggle(name, enabled) {
        if (enabled) pageClasses.add(name);
        else pageClasses.delete(name);
      }
    }
  };
  const panel = { hidden: true };
  const attributes = {};
  const button = {
    innerHTML: '',
    setAttribute(name, value) { attributes[name] = value; }
  };
  let focused = false;
  const resume = { focus() { focused = true; } };
  const documentRef = {
    querySelector: () => page,
    getElementById(id) {
      return { 'pause-panel': panel, 'pause-flight': button, 'resume-flight': resume }[id] || null;
    }
  };

  assert.equal(applyPausePanelState({ documentRef, paused: true }), true);
  assert.equal(panel.hidden, false);
  assert.equal(pageClasses.has('is-paused'), true);
  assert.equal(attributes['aria-label'], 'Continuar vuelo');
  assert.equal(focused, true);

  applyPausePanelState({ documentRef, paused: false });
  assert.equal(panel.hidden, true);
  assert.equal(pageClasses.has('is-paused'), false);
  assert.equal(attributes['aria-label'], 'Pausar vuelo');
});
