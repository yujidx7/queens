import { PuzzleDefinition, PuzzleState } from './puzzle';
import { findNextHumanMove, HumanMove } from './humanSolver';

export type Hint = {
  move: HumanMove | null;
  description?: string;
};

export function findHint(def: PuzzleDefinition, state: PuzzleState): Hint {
  const mv = findNextHumanMove(def, state);
  if (!mv) return { move: null, description: '次の手が見つかりません' };
  const desc =
    mv.type === 'PlaceQueen'
      ? `Place Queen at (${mv.pos.r},${mv.pos.c}) — ${mv.technique}`
      : `Mark Cross at (${mv.pos.r},${mv.pos.c}) — ${mv.technique}`;
  return { move: mv, description: desc };
}
