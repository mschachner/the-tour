import { Game } from '../types/golf';

export const GAME_STORAGE_KEY = 'golfer-current-game';
const SCORECARD_STORAGE_KEY = 'golfer-scorecards';
const SCORECARD_EXPORT_VERSION = 1;

export interface StoredScorecard {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: Game;
}

export interface ScorecardExportFile {
  schema: 'the-tour-scorecard';
  version: number;
  exportedAt: string;
  scorecards: StoredScorecard[];
}
export const loadGame = (): Game | null => {
  try {
    const stored = localStorage.getItem(GAME_STORAGE_KEY);
    if (stored) {
      const game = JSON.parse(stored) as Game;
      if (!game.eventName) {
        game.eventName = 'Current Scorecard';
      }
      return game;
    }
  } catch (err) {
    console.error('Failed to load saved game', err);
  }
  return null;
};

export const saveGame = (game: Game): void => {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
  } catch (err) {
    console.error('Failed to save game', err);
  }
};

export const clearGame = (): void => {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear saved game', err);
  }
};

const normalizeSavedScorecard = (scorecard: StoredScorecard): StoredScorecard => {
  const game = scorecard.data;
  if (!game.eventName) {
    game.eventName = scorecard.name || 'Untitled Scorecard';
  }
  return {
    ...scorecard,
    name: scorecard.name || game.eventName || 'Untitled Scorecard',
    data: game,
  };
};

export const loadScorecards = (): StoredScorecard[] => {
  try {
    const stored = localStorage.getItem(SCORECARD_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as StoredScorecard[];
    return parsed.map((scorecard) => normalizeSavedScorecard(scorecard));
  } catch (err) {
    console.error('Failed to load saved scorecards', err);
    return [];
  }
};

export const saveScorecards = (scorecards: StoredScorecard[]): void => {
  try {
    localStorage.setItem(SCORECARD_STORAGE_KEY, JSON.stringify(scorecards));
  } catch (err) {
    console.error('Failed to save scorecards', err);
  }
};

export const saveScorecard = (scorecard: StoredScorecard): StoredScorecard[] => {
  const scorecards = loadScorecards();
  const updated = scorecards.filter((item) => item.id !== scorecard.id);
  updated.unshift(scorecard);
  saveScorecards(updated);
  return updated;
};

export const deleteScorecard = (scorecardId: string): StoredScorecard[] => {
  const updated = loadScorecards().filter((item) => item.id !== scorecardId);
  saveScorecards(updated);
  return updated;
};

export const buildExportFile = (
  scorecards: StoredScorecard[],
): ScorecardExportFile => ({
  schema: 'the-tour-scorecard',
  version: SCORECARD_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  scorecards,
});

export const parseScorecardImport = (
  raw: string,
): { scorecards: StoredScorecard[]; warnings: string[] } => {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { scorecards: [], warnings: ['Import file is not valid JSON.'] };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { scorecards: [], warnings: ['Import file format is not recognized.'] };
  }

  const data = parsed as Partial<ScorecardExportFile>;
  if (data.schema !== 'the-tour-scorecard' || !Array.isArray(data.scorecards)) {
    return { scorecards: [], warnings: ['Import file is missing scorecards data.'] };
  }

  const normalized = data.scorecards
    .map((scorecard) => normalizeSavedScorecard(scorecard))
    .filter((scorecard) => scorecard.id && scorecard.data);

  if (normalized.length === 0) {
    warnings.push('No valid scorecards found in the import.');
  }

  if (data.version && data.version > SCORECARD_EXPORT_VERSION) {
    warnings.push('Import file was created by a newer version of the app.');
  }

  return { scorecards: normalized, warnings };
};

export const mergeImportedScorecards = (
  incoming: StoredScorecard[],
): { merged: StoredScorecard[]; addedCount: number } => {
  const existing = loadScorecards();
  const mergedMap = new Map(existing.map((item) => [item.id, item]));
  let addedCount = 0;

  incoming.forEach((scorecard) => {
    if (mergedMap.has(scorecard.id)) {
      const current = mergedMap.get(scorecard.id)!;
      if (new Date(scorecard.updatedAt) > new Date(current.updatedAt)) {
        mergedMap.set(scorecard.id, scorecard);
      }
    } else {
      mergedMap.set(scorecard.id, scorecard);
      addedCount += 1;
    }
  });

  const merged = Array.from(mergedMap.values()).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  saveScorecards(merged);
  return { merged, addedCount };
};
