const STORAGE_KEY = 'pokemon-type-trainer';
export const STORAGE_VERSION = 1;

export const DEFAULT_PERSISTENT_DATA = Object.freeze({
  version: STORAGE_VERSION,
  settings: {
    theme: 'system',
    quizMode: 'select-all',
    quizLength: 10
  },
  progress: {
    totalAnswered: 0,
    totalScore: 0,
    relationshipStats: {}
  },
  cache: {
    pokemon: {}
  }
});

function cloneDefaults() {
  return structuredClone(DEFAULT_PERSISTENT_DATA);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSettings(value) {
  const defaults = cloneDefaults().settings;
  if (!isObject(value)) return defaults;

  const validThemes = new Set(['system', 'light', 'dark']);
  const validLengths = new Set([5, 10, 20, 0]);

  return {
    theme: validThemes.has(value.theme) ? value.theme : defaults.theme,
    quizMode: typeof value.quizMode === 'string' ? value.quizMode : defaults.quizMode,
    quizLength: validLengths.has(value.quizLength) ? value.quizLength : defaults.quizLength
  };
}

function normalizeProgress(value) {
  const defaults = cloneDefaults().progress;
  if (!isObject(value)) return defaults;

  const totalAnswered = Number.isFinite(value.totalAnswered) && value.totalAnswered >= 0
    ? Math.floor(value.totalAnswered)
    : defaults.totalAnswered;
  const totalScore = Number.isFinite(value.totalScore) && value.totalScore >= 0
    ? value.totalScore
    : defaults.totalScore;

  return {
    totalAnswered,
    totalScore,
    relationshipStats: isObject(value.relationshipStats) ? value.relationshipStats : {}
  };
}

function normalizeCache(value) {
  return {
    pokemon: isObject(value?.pokemon) ? value.pokemon : {}
  };
}

function migrate(raw) {
  if (!isObject(raw)) return cloneDefaults();

  if (raw.version === STORAGE_VERSION) {
    return {
      version: STORAGE_VERSION,
      settings: normalizeSettings(raw.settings),
      progress: normalizeProgress(raw.progress),
      cache: normalizeCache(raw.cache)
    };
  }

  // Future versions can add explicit migration steps here.
  return cloneDefaults();
}

export function loadPersistentData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    return migrate(JSON.parse(raw));
  } catch (error) {
    console.warn('Could not load saved data. Using defaults.', error);
    return cloneDefaults();
  }
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Could not save data.', error);
    return false;
  }
}

export function savePersistentData({ settings, progress, cache }) {
  return write({
    version: STORAGE_VERSION,
    settings: normalizeSettings(settings),
    progress: normalizeProgress(progress),
    cache: normalizeCache(cache)
  });
}

export function saveSettings(settings) {
  const current = loadPersistentData();
  current.settings = normalizeSettings(settings);
  return write(current);
}

export function saveProgress(progress) {
  const current = loadPersistentData();
  current.progress = normalizeProgress(progress);
  return write(current);
}

export function saveCache(cache) {
  const current = loadPersistentData();
  current.cache = normalizeCache(cache);
  return write(current);
}

export function clearPersistentData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Could not clear saved data.', error);
    return false;
  }
}
