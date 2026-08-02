import { TYPES, TYPE_META } from './data/types.js';
import {
  state,
  getQuizModeSettings,
  startQuizSession,
  recordQuestionResult,
  advanceQuizSession,
  endQuizSession,
  returnToQuizSetup,
  getSessionAverageScore,
  getAverageScore
} from './state.js';
import { saveSettings, saveProgress, loadPersistentData, STORAGE_VERSION } from './storage.js';
import { createQuestionForMode, QUIZ_MODES } from './quiz/modes.js';
import { QUESTION_GENERATORS } from './quiz/generators.js';
import { scoreQuestion } from './quiz/scoring.js';
import { renderAnswerDisplay } from './quiz/displays.js';
import { runEngineSelfTests } from './engine/effectiveness.js';

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

function createNextQuestion() {
  state.quiz.question = createQuestionForMode(state.quiz.session.mode);
  state.quiz.selectedAnswers = new Set();
  state.quiz.result = null;
  state.quiz.status = 'answering';
}

function beginSession(length, render) {
  startQuizSession(length);
  saveSettings(state.settings);
  createNextQuestion();
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

function renderQuizSetup(page, render) {
  const panel = el('div', { className: 'panel' });
  panel.append(el('p', {
    text: 'This quiz currently uses one offensive weakness generator. Each quiz type keeps its own saved setup.'
  }));

  const form = el('div', { className: 'quiz-setup' });

  const modeLabel = el('label');
  modeLabel.append(el('span', { text: 'Quiz type' }));
  const modeSelect = el('select');
  for (const mode of Object.values(QUIZ_MODES)) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.label;
    option.selected = mode.id === state.quiz.mode;
    modeSelect.append(option);
  }
  modeLabel.append(modeSelect);
  form.append(modeLabel);

  const lengthLabel = el('label');
  lengthLabel.append(el('span', { text: 'Questions' }));
  const lengthSelect = el('select');
  const lengths = [5, 10, 20, 0];

  function populateLengthOptions() {
    const modeSettings = getQuizModeSettings(state.quiz.mode);
    lengthSelect.replaceChildren();
    for (const length of lengths) {
      const option = document.createElement('option');
      option.value = String(length);
      option.textContent = length === 0 ? 'Endless' : String(length);
      option.selected = length === modeSettings.questionCount;
      lengthSelect.append(option);
    }
  }

  populateLengthOptions();

  modeSelect.addEventListener('change', () => {
    state.quiz.mode = modeSelect.value;
    state.settings.quiz.defaultMode = modeSelect.value;
    getQuizModeSettings(modeSelect.value);
    populateLengthOptions();
    saveSettings(state.settings);
  });

  lengthSelect.addEventListener('change', () => {
    getQuizModeSettings(state.quiz.mode).questionCount = Number(lengthSelect.value);
    saveSettings(state.settings);
  });

  lengthLabel.append(lengthSelect);
  form.append(lengthLabel);

  const start = el('button', { text: 'Start quiz' });
  start.addEventListener('click', () => beginSession(Number(lengthSelect.value), render));
  form.append(start);

  panel.append(form);
  page.append(panel);
}

function renderSessionHeader(page) {
  const session = state.quiz.session;
  const header = el('div', { className: 'session-header' });
  const countText = session.length === 0
    ? `Question ${session.questionNumber}`
    : `Question ${session.questionNumber} of ${session.length}`;
  header.append(el('span', { text: countText }));
  header.append(el('span', {
    text: `Session average: ${formatPercent(getSessionAverageScore())}`
  }));
  page.append(header);
}

function renderActiveQuestion(page, render) {
  renderSessionHeader(page);

  const question = state.quiz.question;
  const panel = el('div', { className: 'panel' });
  panel.append(el('h3', { text: question.prompt }));

  panel.append(renderAnswerDisplay(question.answerType, {
    question,
    selectedAnswers: state.quiz.selectedAnswers,
    result: state.quiz.result,
    onToggle: answer => toggleAnswer(answer, render)
  }));

  if (state.quiz.result) panel.append(renderFeedback(state.quiz.result, question));

  const actions = el('div', { className: 'actions' });
  if (!state.quiz.result) {
    const submit = el('button', { text: 'Submit answer' });
    submit.disabled = state.quiz.selectedAnswers.size === 0;
    submit.addEventListener('click', () => {
      const result = scoreQuestion(question, state.quiz.selectedAnswers);
      state.quiz.result = result;
      state.quiz.status = 'answered';
      recordQuestionResult(question, result);
      saveProgress(state.progress);
      render();
    });
    actions.append(submit);
  } else {
    const isLastQuestion = state.quiz.session.length !== 0
      && state.quiz.session.questionNumber >= state.quiz.session.length;
    const next = el('button', { text: isLastQuestion ? 'See summary' : 'Next question' });
    next.addEventListener('click', () => {
      if (advanceQuizSession()) createNextQuestion();
      render();
    });
    actions.append(next);
  }

  if (state.quiz.session.length === 0) {
    const end = el('button', { text: 'End session' });
    end.className = 'secondary-button';
    end.addEventListener('click', () => {
      endQuizSession();
      render();
    });
    actions.append(end);
  }

  panel.append(actions);
  page.append(panel);
}

function renderSessionSummary(page, render) {
  const panel = el('div', { className: 'panel summary-panel' });
  const count = state.quiz.session.results.length;
  panel.append(el('h3', { text: 'Session complete' }));
  panel.append(el('p', { text: `Questions answered: ${count}` }));
  panel.append(el('p', {
    className: 'summary-score',
    text: `Average score: ${formatPercent(getSessionAverageScore())}`
  }));

  const actions = el('div', { className: 'actions' });
  const sameAgain = el('button', { text: 'Quiz again' });
  sameAgain.addEventListener('click', () => beginSession(state.quiz.session.length, render));
  const setup = el('button', { text: 'Change setup' });
  setup.className = 'secondary-button';
  setup.addEventListener('click', () => {
    returnToQuizSetup();
    render();
  });
  actions.append(sameAgain, setup);
  panel.append(actions);
  page.append(panel);
}

function renderQuiz(container, render) {
  const page = el('section', { className: 'page' });
  page.append(el('h2', { text: 'Quiz' }));

  if (state.quiz.status === 'idle') renderQuizSetup(page, render);
  else if (state.quiz.status === 'complete') renderSessionSummary(page, render);
  else renderActiveQuestion(page, render);

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

function renderSettings(container) {
  const page = el('section', { className: 'page' });
  page.append(el('h2', { text: 'Settings' }));

  const panel = el('div', { className: 'panel' });
  panel.append(el('p', {
    text: `Saved preferences are active. Theme preference: ${state.settings.theme}. Default quiz type: ${state.settings.quiz.defaultMode}.`
  }));
  const link = el('a', { className: 'button-link', text: 'Developer diagnostics' });
  link.href = '#debug';
  panel.append(link);
  page.append(panel);
  container.replaceChildren(page);
}

function diagnosticRow(label, value, status = 'neutral') {
  const row = el('div', { className: `diagnostic-row ${status}` });
  row.append(el('span', { text: label }));
  row.append(el('strong', { text: String(value) }));
  return row;
}

function localStorageAvailable() {
  try {
    const key = '__pokemon_debug_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function renderDebug(container) {
  const page = el('section', { className: 'page' });
  page.append(el('h2', { text: 'Developer diagnostics' }));
  const back = el('a', { className: 'back-link', text: '← Back to settings' });
  back.href = '#settings';
  page.append(back);

  const tests = runEngineSelfTests();
  const passed = tests.filter(test => test.passed).length;
  const saved = loadPersistentData();
  const storageWorks = localStorageAvailable();

  const overview = el('div', { className: 'panel diagnostic-panel' });
  overview.append(el('h3', { text: 'System' }));
  overview.append(diagnosticRow('Type chart loaded', TYPES.length === 18 ? 'Yes' : 'No', TYPES.length === 18 ? 'ok' : 'bad'));
  overview.append(diagnosticRow('Types', TYPES.length, TYPES.length === 18 ? 'ok' : 'bad'));
  overview.append(diagnosticRow('Single-type relationships', TYPES.length * TYPES.length, 'ok'));
  overview.append(diagnosticRow('Engine tests', `${passed}/${tests.length} passed`, passed === tests.length ? 'ok' : 'bad'));
  overview.append(diagnosticRow('Registered quiz modes', Object.keys(QUIZ_MODES).length, 'ok'));
  overview.append(diagnosticRow('Registered generators', Object.keys(QUESTION_GENERATORS).length, 'ok'));
  page.append(overview);

  const storage = el('div', { className: 'panel diagnostic-panel' });
  storage.append(el('h3', { text: 'Storage' }));
  storage.append(diagnosticRow('localStorage available', storageWorks ? 'Yes' : 'No', storageWorks ? 'ok' : 'bad'));
  storage.append(diagnosticRow('Schema version', STORAGE_VERSION, 'ok'));
  storage.append(diagnosticRow('Saved questions', saved.progress.totalAnswered, 'neutral'));
  storage.append(diagnosticRow('Saved average', formatPercent(saved.progress.totalAnswered ? saved.progress.totalScore / saved.progress.totalAnswered : 0), 'neutral'));
  storage.append(diagnosticRow('Relationship records', Object.keys(saved.progress.relationshipStats ?? {}).length, 'neutral'));
  storage.append(diagnosticRow('Cached Pokémon', Object.keys(saved.cache.pokemon ?? {}).length, 'neutral'));
  page.append(storage);

  const runtime = el('div', { className: 'panel diagnostic-panel' });
  runtime.append(el('h3', { text: 'Runtime state' }));
  runtime.append(diagnosticRow('Current route', state.route));
  runtime.append(diagnosticRow('Quiz status', state.quiz.status));
  runtime.append(diagnosticRow('Selected quiz mode', state.quiz.mode));
  runtime.append(diagnosticRow('Active session mode', state.quiz.session.mode));
  runtime.append(diagnosticRow('Active session length', state.quiz.session.length === 0 ? 'Endless' : state.quiz.session.length));
  runtime.append(diagnosticRow('Current selections', state.quiz.selectedAnswers.size));
  page.append(runtime);

  const testPanel = el('div', { className: 'panel diagnostic-panel' });
  testPanel.append(el('h3', { text: 'Engine test details' }));
  for (const test of tests) {
    testPanel.append(diagnosticRow(test.name ?? 'Unnamed test', test.passed ? 'Pass' : 'Fail', test.passed ? 'ok' : 'bad'));
  }
  page.append(testPanel);

  container.replaceChildren(page);
}

export const VIEWS = {
  quiz: renderQuiz,
  study: container => renderPlaceholder(container, 'Study', 'Type and Pokémon lookup will live here.'),
  progress: container => renderPlaceholder(
    container,
    'Progress',
    `Saved questions answered: ${state.progress.totalAnswered}. Average score: ${formatPercent(getAverageScore())}.`
  ),
  settings: renderSettings,
  debug: renderDebug
};
