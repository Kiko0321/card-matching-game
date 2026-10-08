# Stack Match

A card-matching game built with React, TypeScript and Vite. It runs as a Windows desktop app (Electron) or in a browser. There is no backend; progress and stats are saved locally.

## How to play

- The board has 3 rows × 5 columns. Each position is a stack of 3 cards.
- The top and bottom rows are open from the start. The middle row is locked.
- The game uses a standard 52-card deck: 45 cards on the board, 7 in the draw pile.
- Select two exposed cards with the same number (A–K, any suit) to remove them and expose the cards underneath.
- Clearing a top or bottom position scores **1,000**.
- When both outer positions in a column are cleared, that column's middle position unlocks. Clearing it scores **10,000**.
- When no match is showing, draw from the remaining cards. Each drawn card covers the previous one, and only the top drawn card can be used.
- When the remaining pile is empty, click it to turn the drawn cards back over and draw them again. You can do this **3 times** per game; after that, the drawn cards stay where they are.
- The game ends when the board is cleared, or as soon as no match is possible (including with any card left in the remaining or drawn piles). The score screen then appears. The maximum score is **60,000**. A score above 35,000 shows "Good Lucky".

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run lint
npm run build    # production build in dist/
```

## Windows desktop app

```sh
npm run app       # build and open the game in a desktop window
npm run app:dev   # desktop window with hot reload while developing
npm run dist:win  # build the Windows packages into release/
```

`npm run dist:win` creates two files in `release/`:

- `Stack Match-Setup-1.0.0.exe` — installer with Start menu and desktop shortcuts
- `Stack Match-Portable-1.0.0.exe` — runs directly, no install

The executables are not code-signed, so Windows SmartScreen may show "Windows protected your PC" on first launch; choose **More info → Run anyway**.

The Electron entry point is `electron/main.cjs`; the app icon is `build/icon.png`.

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
