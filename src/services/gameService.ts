import { Game } from '../types/golf';

export const GAME_STORAGE_KEY = 'golfer-current-game';
export const loadGame = (): Game | null => {
  try {
    const stored = localStorage.getItem(GAME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Game;
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
