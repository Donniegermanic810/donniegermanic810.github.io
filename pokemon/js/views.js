import { TYPES, TYPE_META } from './data/types.js';
import { state, resetQuestionState } from './state.js';
import { getQuizMode, QUIZ_MODES } from './quiz/modes.js';

function el(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;
  return node;
}

function newQuestion(render) {
  resetQuestionState();
  state.quiz.status = 'answering';
  state.quiz.question = getQuizMode(state.quiz.mode).createQuestion();
  render();
}

function renderQuiz(container, render) {
  const page = el('section', { className: 'page' });
  page.append(el('h2', { text: 'Quiz' }));

  const toolbar = el('div', { className: 'quiz-toolbar' });
  const label = el('label');
  label.append(el('span', { text: 'Quiz type' }));
  const select = el('select');
  for (const mode of Object.values(QUIZ_MODES)) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.label;
    option.selected = mode.id === state.quiz.mode;
    select.append(option);
  }
  select.addEventListener('change', () => {
    state.quiz.mode = select.value;
    state.settings.quizMode = select.value;
    newQuestion(render);
  });
  label.append(select);
  toolbar.append(label);
  page.append(toolbar);

  if (!state.quiz.question) {
    const panel = el('div', { className: 'panel' });
    panel.append(el('p', { text: 'One quiz mode is registered. More modes can be added without changing the quiz page.' }));
    const start = el('button', { text: 'Start quiz' });
    start.addEventListener('click', () => newQuestion(render));
    panel.append(start);
    page.append(panel);
    container.replaceChildren(page);
    return;
  }

  const question = state.quiz.question;
  const panel = el('div', { className: 'panel' });
  panel.append(el('h3', { text: question.prompt }));

  const grid = el('div', { className: 'type-grid' });
  for (const type of TYPES) {
    const button = el('button', { className: 'type-button', text: TYPE_META[type].label });
    button.type = 'button';
    button.dataset.type = type;
    button.setAttribute('aria-pressed', String(state.quiz.selectedTypes.has(type)));
    if (state.quiz.result) {
      if (question.correctTypes.includes(type)) button.classList.add('correct');
      else if (state.quiz.selectedTypes.has(type)) button.classList.add('incorrect');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => {
        state.quiz.selectedTypes.has(type) ? state.quiz.selectedTypes.delete(type) : state.quiz.selectedTypes.add(type);
        render();
      });
    }
    grid.append(button);
  }
  panel.append(grid);

  if (state.quiz.result) {
    const feedback = el('div', {
      className: `feedback ${state.quiz.result.isCorrect ? 'correct' : 'incorrect'}`,
      text: state.quiz.result.isCorrect
        ? 'Correct.'
        : `Incorrect. Correct answers: ${state.quiz.result.correctTypes.map(type => TYPE_META[type].label).join(', ')}.`
    });
    panel.append(feedback);
  }

  const actions = el('div', { className: 'actions' });
  if (!state.quiz.result) {
    const submit = el('button', { text: 'Submit answer' });
    submit.disabled = state.quiz.selectedTypes.size === 0;
    submit.addEventListener('click', () => {
      state.quiz.result = getQuizMode(state.quiz.mode).evaluate(question, state.quiz.selectedTypes);
      state.quiz.status = 'answered';
      state.progress.totalAnswered += 1;
      if (state.quiz.result.isCorrect) state.progress.totalCorrect += 1;
      render();
    });
    actions.append(submit);
  } else {
    const next = el('button', { text: 'Next question' });
    next.addEventListener('click', () => newQuestion(render));
    actions.append(next);
  }
  panel.append(actions);
  page.append(panel);
  container.replaceChildren(page);
}

function renderPlaceholder(container, title, message) {
  const page = el('section', { className: 'page' });
  page.append(el('h2', { text: title }));
  const panel = el('div', { className: 'panel' });
  panel.append(el('p', { text: message }));
  page.append(panel);
  container.replaceChildren(page);
}

export const VIEWS = {
  quiz: renderQuiz,
  study: container => renderPlaceholder(container, 'Study', 'Type and Pokémon lookup will live here.'),
  progress: container => renderPlaceholder(container, 'Progress', `Answered this session: ${state.progress.totalAnswered}. Correct: ${state.progress.totalCorrect}.`),
  settings: container => renderPlaceholder(container, 'Settings', 'Persistent quiz and display settings will live here.')
};
