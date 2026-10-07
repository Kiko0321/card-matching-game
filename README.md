# Stack Match

A card-matching game built with React, TypeScript and Vite. It has no backend; progress and stats are saved in the browser.

## How to play

- The board has 3 rows × 5 columns. Each position is a stack of 3 cards.
- The top and bottom rows are open from the start. The middle row is locked.
- The game uses a standard 52-card deck: 45 cards on the board, 7 in the draw pile.
- Select two exposed cards with the same number (A–K, any suit) to remove them and expose the cards underneath.
- Clearing a top or bottom position scores **1,000**.
- When both outer positions in a column are cleared, that column's middle position unlocks. Clearing it scores **10,000**.
- When no match is showing, draw from the remaining cards. A drawn card that isn't matched disappears when you draw the next one.
- The game ends when the board is cleared, or as soon as no match is possible (including with the cards left in the draw pile). The score screen then appears. The maximum score is **60,000**. A score above 35,000 shows "Good Lucky".

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run lint
npm run build    # production build in dist/
```

## Project layout

| Path | Contents |
| --- | --- |
| `src/game/rules.ts` | Board model, matching, unlocking, scoring, drawing, game end |
| `src/game/deck.ts` | 52-card deck, card names, shuffle |
| `src/game/stats.ts` | Result message and local statistics |
| `src/game/storage.ts` | Saving and validating game state and stats in `localStorage` |
| `src/game/appState.ts` | App reducer: applies moves and records each finished game once |
| `src/game/sound.ts` | Sound effects (Web Audio, no files) |
| `src/components/` | Board, cards, draw area, scoreboard, dialogs |

## Deployment

`.github/workflows/deploy.yml` builds, tests and publishes to GitHub Pages on every push to `main`. In the repository settings, enable it under **Settings → Pages → Source: GitHub Actions**.
