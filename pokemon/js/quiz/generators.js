import { TYPES, TYPE_META } from '../data/types.js';
import { getDefendingTypesAtMultiplier } from '../engine/effectiveness.js';

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function createOffensiveWeaknessQuestion() {
  const attackingType = randomItem(TYPES);
  const correctAnswers = getDefendingTypesAtMultiplier(attackingType, 2);

  return {
    id: `offensive-weakness:${attackingType}`,
    generatorId: 'offensive-weakness',
    prompt: `Which types are weak to ${TYPE_META[attackingType].label} attacks?`,
    answerType: 'type-multi-select',
    choices: [...TYPES],
    correctAnswers,
    explanation: `${TYPE_META[attackingType].label} attacks deal 2× damage to the highlighted types.`,
    metadata: {
      direction: 'offense',
      attackingType,
      multiplier: 2
    }
  };
}

export const QUESTION_GENERATORS = {
  'offensive-weakness': createOffensiveWeaknessQuestion
};

export function getQuestionGenerator(generatorId) {
  const generator = QUESTION_GENERATORS[generatorId];
  if (!generator) throw new Error(`Unknown question generator: ${generatorId}`);
  return generator;
}
