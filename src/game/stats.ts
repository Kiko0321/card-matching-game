export const GOOD_LUCK_SCORE = 35_000

export type Stats = {
  highScore: number
  lastScore: number
  gamesPlayed: number
  /** Finished games that scored above GOOD_LUCK_SCORE. */
  goodGames: number
}

export const EMPTY_STATS: Stats = { highScore: 0, lastScore: 0, gamesPlayed: 0, goodGames: 0 }

export const isGoodResult = (score: number) => score > GOOD_LUCK_SCORE

export function resultMessage(score: number): string {
  return isGoodResult(score) ? 'Good Lucky' : 'Better luck next time'
}

export function recordResult(stats: Stats, score: number): Stats {
  return {
    highScore: Math.max(stats.highScore, score),
    lastScore: score,
    gamesPlayed: stats.gamesPlayed + 1,
    goodGames: stats.goodGames + (isGoodResult(score) ? 1 : 0),
  }
}
