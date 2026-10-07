import { STACK_SIZE, drawCard, isOver, resolveMatch, scoreOf, select, type Game, type Source } from './rules'
import { recordResult, type Stats } from './stats'

export type AppState = { game: Game; stats: Stats }

export type AppAction =
  | { type: 'select'; source: Source }
  | { type: 'draw' }
  | { type: 'resolve' }
  /** The new game is created by the caller so the reducer stays pure. */
  | { type: 'new'; game: Game }

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'new') return { ...state, game: action.game }

  const before = state.game
  const game =
    action.type === 'select' ? select(before, action.source)
    : action.type === 'draw' ? drawCard(before)
    : resolveMatch(before)
  if (game === before) return state

  // Record the result exactly once: on the move that ends the game.
  const finished = !isOver(before) && isOver(game)
  return { game, stats: finished ? recordResult(state.stats, scoreOf(game.board)) : state.stats }
}

/** True once the player has drawn or matched anything, so a reset would lose progress. */
export function hasProgress(game: Game): boolean {
  return !isOver(game) && (game.waste.length > 0 || game.board.flat().some(stack => stack.length < STACK_SIZE))
}
