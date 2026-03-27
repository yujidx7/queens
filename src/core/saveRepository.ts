import { PuzzleDefinition, PuzzleState } from './puzzle';

const KEY = 'queens_save_v1';

export type SavedSession = {
  def: PuzzleDefinition;
  state: PuzzleState;
  history?: PuzzleState[];
  future?: PuzzleState[];
};

export function saveSession(
  def: PuzzleDefinition,
  state: PuzzleState,
  history?: PuzzleState[],
  future?: PuzzleState[],
) {
  const payload: SavedSession = { def, state, history, future };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
