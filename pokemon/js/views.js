import { TYPE_META } from './data/types.js';
import { state, resetQuestionState, getAverageScore } from './state.js';
import { createQuestionForMode, QUIZ_MODES } from './quiz/modes.js';
import { scoreQuestion } from './quiz/scoring.js';
import { renderAnswerDisplay } from './quiz/displays.js';

function el(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;
  return node;
}

function formatPercent(score) {
  return `${Math.round(score * 100)}%`;
}

function formatTypes(types) {
  return types.length
    ? types.map(type => TYPE_META[type].label).join(', ')
    : 'None';
}

function newQuestion(render) {
  resetQuestionState();
  state.quiz.status = 'answering';
  state.quiz.question = createQuestionForMode(state.quiz.mode);
  render();
}

function toggleAnswer(answer, render) {
  if (state.quiz.selectedAnswers.has(answer)) {
    state.quiz.selectedAnswers.delete(answer);
  } else {
    state.quiz.selectedAnswers.add(answer);
  }
  render();
}

function renderFeedback(result, question) {
  const feedback = el('div', { className: 'feedback' });
  feedback.append(el('h4', { text: `Question score: ${formatPercent(result.score)}` }));
  feedback.append(el('p', { text: `Correctly selected: ${formatTypes(result.correctlySelected)}` }));
  feedback.append(el('p', { text: `Missed: ${formatTypes(result.missedAnswers)}` }));
  feedback.append(el('p', { text: `Incorrectly selected: ${formatTypes(result.incorrectAnswers)}` }));
  feedback.append(el('p', { className: 'muted', text: question.explanation }));
  return feedback;
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
    panel.append(el('p', {
      text: 'This quiz mode currently uses one offensive weakness generator. Additional generators can be added to the mode later.'
    }));
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

  panel.append(renderAnswerDisplay(question.answerType, {
    question,
    selectedAnswers: state.quiz.selectedAnswers,
    result: state.quiz.result,
    onToggle: answer => toggleAnswer(answer, render)
  }));

  if (state.quiz.result) {
    panel.append(renderFeedback(state.quiz.result, question));
  }

  const actions = el('div', { className: 'actions' });
  if (!state.quiz.result) {
    const submit = el('button', { text: 'Submit answer' });
    submit.disabled = state.quiz.selectedAnswers.size === 0;
    submit.addEventListener('click', () => {
      state.quiz.result = scoreQuestion(question, state.quiz.selectedAnswers);
      state.quiz.status = 'answered';
      state.progress.totalAnswered += 1;
      state.progress.totalScore += state.quiz.result.score;
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
  progress: container => renderPlaceholder(
    container,
    'Progress',
    `Answered this session: ${state.progress.totalAnswered}. Average score: ${formatPercent(getAverageScore())}.`
  ),
  settings: container => renderPlaceholder(container, 'Settings', 'Persistent quiz and display settings will live here.')
};
