import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QUESTIONS,
  levelForPortal,
  shuffledQuestionOptions,
  shuffledQuestions
} from '../js/questions.js';

const LEVELS = [1, 2, 3, 4, 5];

test('el banco contiene exactamente 1000 preguntas distribuidas por nivel', () => {
  assert.equal(QUESTIONS.length, 1000);

  for (const level of LEVELS) {
    const questions = QUESTIONS.filter((item) => item.level === level);
    assert.equal(questions.length, 200, `El nivel ${level} debe contener 200 preguntas.`);
  }
});

test('cada pregunta tiene identidad, contenido y respuesta válidos', () => {
  const ids = new Set();
  const texts = new Set();

  for (const item of QUESTIONS) {
    assert.ok(!ids.has(item.id), `Identificador repetido: ${item.id}`);
    assert.ok(!texts.has(item.text), `Pregunta repetida: ${item.text}`);
    ids.add(item.id);
    texts.add(item.text);

    assert.ok(LEVELS.includes(item.level));
    assert.equal(typeof item.category, 'string');
    assert.ok(item.category.trim().length > 0);
    assert.equal(typeof item.icon, 'string');
    assert.ok(item.icon.length > 0);
    assert.equal(typeof item.text, 'string');
    assert.ok(item.text.trim().length > 0);
    assert.equal(typeof item.fact, 'string');
    assert.ok(item.fact.trim().length > 0);
    assert.equal(item.options.length, 3);
    assert.equal(new Set(item.options).size, 3, `Opciones repetidas en ${item.id}`);
    assert.ok(Number.isInteger(item.answer));
    assert.ok(item.answer >= 0 && item.answer < item.options.length);
    assert.equal(typeof item.options[item.answer], 'string');
  }
});

test('cada nivel entrega una baraja aleatoria independiente de 200 preguntas', () => {
  for (const level of LEVELS) {
    const original = QUESTIONS.filter((item) => item.level === level).map((item) => item.id);
    const first = shuffledQuestions(level, () => .17);
    const second = shuffledQuestions(level, () => .83);

    assert.equal(first.length, 200);
    assert.equal(second.length, 200);
    assert.equal(new Set(first.map((item) => item.id)).size, 200);
    assert.equal(new Set(second.map((item) => item.id)).size, 200);
    assert.notDeepEqual(first.map((item) => item.id), second.map((item) => item.id));
    assert.deepEqual(QUESTIONS.filter((item) => item.level === level).map((item) => item.id), original);
  }
});

test('los portales conservan cinco niveles y las opciones mezcladas mantienen la respuesta', () => {
  assert.equal(levelForPortal(1), 1);
  assert.equal(levelForPortal(2), 1);
  assert.equal(levelForPortal(3), 2);
  assert.equal(levelForPortal(8), 4);
  assert.equal(levelForPortal(9), 5);
  assert.equal(levelForPortal(50), 5);

  const source = QUESTIONS[0];
  const correct = source.options[source.answer];
  const mixed = shuffledQuestionOptions(source, () => .75);
  assert.equal(mixed.options[mixed.answer], correct);
  assert.deepEqual(source.options, QUESTIONS[0].options);
});
