import { TYPES, TYPE_META } from '../data/types.js';
import { getDefendingTypesAtMultiplier } from '../engine/effectiveness.js';

function createSelectAllQuestion() {
  const attackingType = TYPES[Math.floor(Math.random() * TYPES.length)];
  return {
    id: `select-all:${attackingType}:2`,
    mode: 'select-all',
    prompt: `Which types are weak to ${TYPE_META[attackingType].label} attacks?`,
    attackingType,
    correctTypes: getDefendingTypesAtMultiplier(attackingType, 2)
  };
}

function evaluateSelectAll(question, selectedTypes) {
  const selected = [...selectedTypes].sort();
  const correct = [...question.correctTypes].sort();
  const isCorrect = selected.length === correct.length && selected.every((type, index) => type === correct[index]);
  return { isCorrect, correctTypes: correct, selectedTypes: selected };
}

export const QUIZ_MODES = {
  'select-all': {
    id: 'select-all',
    label: 'Select all matching types',
    createQuestion: createSelectAllQuestion,
    evaluate: evaluateSelectAll
  }
};

export function getQuizMode(modeId) {
  const mode = QUIZ_MODES[modeId];
  if (!mode) throw new Error(`Unknown quiz mode: ${modeId}`);
  return mode;
}
