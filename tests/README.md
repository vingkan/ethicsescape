# Playwright Tests for Ethics Escape Room

This directory contains automated Playwright tests for the Ethics Escape Room game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in UI mode (interactive):
```bash
npm run test:ui
```

Run tests in debug mode:
```bash
npm run test:debug
```

## Test Structure

- `tests/helpers/server-manager.js` - Manages multiple HTTP servers on ports 4000-4003
- `tests/helpers/game-helpers.js` - Utility functions for game interactions
- `tests/team-selection.spec.js` - Tests for team selection and clue distribution
- `tests/form-selection-access.spec.js` - Tests for form selection access control

## How It Works

Since the game uses `localStorage` for state persistence, we cannot test multiple players on the same browser instance. Instead, the tests:

1. Start 4 separate HTTP servers on ports 4000-4003 using Python's `http.server`
2. Each test creates isolated browser contexts for each player
3. Tests verify that clues are distributed correctly and access controls work as expected

## Requirements

- Node.js (v16 or higher)
- Python 3 (for HTTP servers)
- macOS/Linux (Windows may require adjustments to port checking logic)
