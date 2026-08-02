import { getQuestionGenerator } from './generators.js';

export const QUIZ_MODES = {
  'select-all': {
    id: 'select-all',
    label: 'Select all matching types',
    generatorIds: ['offensive-weakness']
  }
};

export function getQuizMode(modeId) {
  const mode = QUIZ_MODES[modeId];
  if (!mode) throw new Error(`Unknown quiz mode: ${modeId}`);
  return mode;
}

export function createQuestionForMode(modeId) {
  const mode = getQuizMode(modeId);
  const generatorId = mode.generatorIds[Math.floor(Math.random() * mode.generatorIds.length)];
  return getQuestionGenerator(generatorId)();
}
