import { escapeHtml } from '../core/html.js';

export function clearTutorialTargets(documentRef = document) {
  documentRef.querySelectorAll('.tutorial-target').forEach((element) => element.classList.remove('tutorial-target'));
}

export function showTutorialCoach({ documentRef = document, step }) {
  const coach = documentRef.getElementById('tutorial-coach');
  if (!coach || !step) return false;
  coach.innerHTML = '<span>' + escapeHtml(step.icon) + '</span><div><strong>' + escapeHtml(step.title) + '</strong><small>' + escapeHtml(step.detail) + '</small></div>';
  coach.hidden = false;
  return true;
}

export function applyTutorialStep({ documentRef = document, step }) {
  clearTutorialTargets(documentRef);
  if (!step) return { showQuestion: false, delayMs: 0 };
  showTutorialCoach({ documentRef, step });
  step.targets.forEach((selector) => {
    documentRef.querySelectorAll(selector).forEach((element) => element.classList.add('tutorial-target'));
  });
  return { showQuestion: Boolean(step.showQuestion), delayMs: Number(step.delayMs) || 0 };
}

export function hideTutorialCoach(documentRef = document) {
  const coach = documentRef.getElementById('tutorial-coach');
  if (coach) coach.hidden = true;
}

export function presentTutorialQuestion({ documentRef = document, question, onAnswer }) {
  const panel = documentRef.getElementById('quiz-panel');
  const options = documentRef.getElementById('quiz-options');
  if (!panel || !options || !question) return false;

  hideTutorialCoach(documentRef);
  panel.dataset.answered = 'false';
  documentRef.getElementById('quiz-category').textContent = question.icon + ' PREGUNTA DE ENTRENAMIENTO';
  documentRef.getElementById('quiz-question').textContent = question.text;
  documentRef.getElementById('quiz-result').textContent = '';
  options.innerHTML = question.options.map((option, index) => '<button type="button" data-answer="' + index + '"><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>').join('');
  options.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => onAnswer(Number(button.dataset.answer))));
  panel.hidden = false;
  options.querySelector('button')?.focus();
  return true;
}

export function revealTutorialAnswer({ documentRef = document, outcome }) {
  const panel = documentRef.getElementById('quiz-panel');
  if (!panel || !outcome) return false;
  const buttons = [...panel.querySelectorAll('[data-answer]')];
  const result = documentRef.getElementById('quiz-result');

  if (!outcome.correct) {
    const selected = buttons[outcome.selectedIndex];
    selected?.classList.add('wrong');
    if (selected) selected.disabled = true;
    if (result) result.textContent = outcome.message;
    return true;
  }

  panel.dataset.answered = 'true';
  buttons.forEach((button) => { button.disabled = true; });
  buttons[outcome.correctIndex]?.classList.add('correct');
  if (result) result.textContent = outcome.message;
  return true;
}

export function hideTutorialQuestion(documentRef = document) {
  const panel = documentRef.getElementById('quiz-panel');
  if (panel) panel.hidden = true;
}
