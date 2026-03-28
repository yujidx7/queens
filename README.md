# Queens

Minimal Queens puzzle app — prototype implementation (TypeScript + React + Vite).

## About Queens (short)

Queens is a logic puzzle where N queens must be placed on an N×N board with these rules:

- Exactly one queen per row.
- Exactly one queen per column.
- Exactly one queen per region (regions are shown as colored areas in this app).
- Queens must not be adjacent to each other (including diagonals).

This app generates puzzles with unique solutions, shows regions by color, and runs entirely in the browser.

## Prerequisites

- Node.js >= 20.19.0
- npm

## Quick start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Notes

- Tests use Vitest. If you see native binding errors, ensure Node version >= 20.19.0.
- The app autosaves sessions to `localStorage` and preserves `history`/`future` to support undo/redo.

## Next steps

- Polish UI and accessibility, add more integration/E2E tests, optionally provide CI deployment to GitHub Pages or similar.

