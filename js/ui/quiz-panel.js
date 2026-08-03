import { escapeHtml } from '../core/html.js';

export function questionCategoryLabel(question) {
  return question.icon + ' ' + question.category + ' · Pregunta nivel ' + question.level;
}

export function renderQuestionOptions(question) {
  return question.options.map((option, index) => (
    '<button type="button" data-answer="' + index + '"><span>'
    + String.fromCharCode(65 + index)
    + '</span>' + escapeHtml(option) + '</button>'
  )).join('');
}

export function presentQuizPanel({ documentRef = document, question, onAnswer }) {
  const panel = documentRef.getElementById('quiz-panel');
  const options = documentRef.getElementById('quiz-options');
  if (!panel || !options || !question) return false;

  panel.dataset.answered = 'false';
  documentRef.getElementById('quiz-category').textContent = questionCategoryLabel(question);
  documentRef.getElementById('quiz-question').textContent = question.text;
  documentRef.getElementById('quiz-result').textContent = '';
  options.innerHTML = renderQuestionOptions(question);
  options.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => onAnswer(Number(button.dataset.answer)));
  });
  panel.hidden = false;
  options.querySelector('button')?.focus();
  return true;
}

export function revealQuizAnswer({ documentRef = document, outcome }) {
  const panel = documentRef.getElementById('quiz-panel');
  if (!panel || !outcome) return false;

  panel.dataset.answered = 'true';
  const buttons = [...panel.querySelectorAll('[data-answer]')];
  buttons.forEach((button) => { button.disabled = true; });
  buttons[outcome.correctIndex]?.classList.add('correct');
  if (!outcome.correct) buttons[outcome.selectedIndex]?.classList.add('wrong');
  documentRef.getElementById('quiz-result').textContent = outcome.feedback;
  return true;
}

export function resetQuizPanel({ documentRef = document, hide = true } = {}) {
  const panel = documentRef.getElementById('quiz-panel');
  if (!panel) return false;
  if (hide) panel.hidden = true;
  panel.dataset.answered = 'false';
  return true;
}
