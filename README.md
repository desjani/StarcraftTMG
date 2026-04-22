# StarCraft TMG Adjutant

Adjutant is the working companion app for StarCraft TMG. It loads rosters by seed, renders roster and player-aid views, runs local or linked Play Mode sessions in the browser, supports roster JSON import, serves shareable roster card images, and optionally exposes the same data through a Discord `/roster` command.

The production web app is deployed at `https://scadjutant.com`. This repository also contains the Android client under [`android/`](android/).

## What This Repo Contains

- Browser app with four primary tabs:
  - `Roster`: visual roster card, Discord preview, raw text, and JSON display
  - `Player Aid`: printable rules and tactical reference views
  - `Play Mode`: local game tracking plus linked cloud sessions
  - `List Builder`: reserved UI surface in the current app shell
- Express server for the web app plus roster, format, analytics, and image endpoints
- Shared parsing/formatting modules used by both the browser and Discord bot
- Firebase-backed linked play and user cloud sync for recent seeds, favorites, and play library
- Discord bot entry point for `/roster`
- Android app built separately in [`android/`](android/)

## Core Concepts

### Seeds

A seed is the roster identifier used throughout the app.

- Canonical shared rosters usually use 6-character alphanumeric seeds such as `TTPIBA`
- Imported JSON rosters can be assigned generated import seeds such as `NABC123`
- Direct roster links work with `/?s=SEED` and clean URLs like `/TTPIBA`

### Seed-Like JSON Import

The browser app can import roster JSON and treat it as a first-class seed.

Current supported intake paths in code:

- Firestore-style roster JSON
- Cleaned roster JSON
- NewRecruit export JSON

Imported rosters are normalized into the app’s seed-compatible roster shape before they are displayed or saved.

## Requirements

- Node.js `18+`
- `npm`
- Optional for Discord bot development:
  - Discord application credentials
- Optional for linked cloud play:
  - Firebase project with Authentication and Firestore enabled

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment config if you plan to run the bot or analytics mailer:

```bash
cp .env.example .env
```

The web app can run without Discord credentials. Bot features cannot.

## Running The App

### Browser App

```bash
npm run web
```

Open `http://localhost:3000`.

Equivalent server entry points:

```bash
npm start
# or
node web/server.js
```

### Discord Bot

Register slash commands:

```bash
npm run deploy
```

Start the bot:

```bash
npm run bot
```

## Main Workflows

### Load A Shared Roster

1. Start the web server.
2. Enter a roster seed in the lookup field.
3. Review the result in the `Roster`, `Player Aid`, or `Play Mode` tabs.

### Import Roster JSON

1. Open the browser app.
2. Click `Import Roster JSON`.
3. Select a supported roster export.
4. The app assigns or preserves an import seed, loads the roster, and treats it like any other seed in the session.

### Start A Local Play Session

1. Load a roster.
2. Open the `Play Mode` tab.
3. Start a game using one or two seeds.
4. Track round state, scores, resources, deployment, activations, and unit health.

### Start Or Join A Linked Cloud Game

Linked Play Mode uses Firebase Auth and Firestore from the browser client.

1. Sign in in the web UI.
2. Start a linked game or join with a match code.
3. Each side syncs roster ownership and tracker state through Firebase.

## Environment Variables

The sample file is [`.env.example`](/home/jared/Documents/Git/StarcraftTMG/.env.example).

Most commonly used values:

- `PORT`: local web server port, default `3000`
- `DISCORD_TOKEN`: required for the bot
- `DISCORD_CLIENT_ID`: required for slash command registration
- `DISCORD_GUILD_ID`: optional for fast guild-scoped command updates
- `ANALYTICS_KEY`: optional protection for `/api/analytics`
- `ANALYTICS_INTERNAL_KEY`: optional internal telemetry key for bot-to-web tracking
- `ANALYTICS_FILE`: analytics persistence path
- `ANALYTICS_EMAIL_*` and `ANALYTICS_SMTP_*`: optional daily analytics email reporting
- `PUBLIC_WEB_BASE_URL`: optional public roster-link override for bot output
- `INTERNAL_WEB_BASE_URL`: optional internal API base URL override for bot-to-web calls

## Firebase Notes

Linked cloud features depend on Firebase configuration already wired into the web client.

Before testing linked play in a real environment:

- Enable Anonymous sign-in in Firebase Authentication
- Publish the rules from [`firestore.rules`](firestore.rules)
- Ensure your authorized domains include `localhost` for local testing and `scadjutant.com` for production use

The current browser Firebase bootstrap lives in [`web/public/firebase-init.js`](web/public/firebase-init.js).

## API Surface

The Express server in [`web/server.js`](web/server.js) serves both the SPA and several utility endpoints.

Key routes:

- `GET /api/roster/:seed`
  - Parsed roster JSON suitable for app consumption
- `GET /api/format/:seed`
  - Discord-formatted text output with query flags for stats, abbreviations, tactical formatting, and slot breakdown
- `GET /api/json/:seed`
  - Pretty-printed raw fetched roster JSON
- `GET /api/card/:seed`
  - PNG roster card render generated through Puppeteer
- `GET /api/analytics`
  - Request and `/roster` telemetry summary
- `POST /api/internal/track/roster`
  - Internal bot telemetry endpoint
- `GET /:seed`
  - Clean roster URL that opens the SPA with that seed loaded
- `GET /:seed/card.png`
  - Clean card-image URL

## Testing

Run the main automated test suite:

```bash
npm test
```

Current test coverage in this repo includes:

- parser behavior
- formatter behavior
- browser utility helpers
- card deck layout behavior

Fixture capture is built into the test runner when canonical fixture files are missing. You can also refresh them manually:

```bash
npm run test:capture
```

There are also Playwright import artifacts in [`tests/`](tests/) for roster import coverage and browser-side verification.

## Hosting And Deployment

Firebase Hosting is configured in [`firebase.json`](firebase.json) and publishes the static artifact from `dist/pages`.

Build the hosting artifact:

```bash
npm run build:hosting
```

Deploy Hosting:

```bash
npm run deploy:hosting
```

Current production assumptions in this repo:

- canonical public site: `https://scadjutant.com`
- mobile preview route: `https://scadjutant.com/mobile`
- Hosting build script: [`scripts/build-pages.mjs`](scripts/build-pages.mjs)

## Project Layout

```text
android/               Native Android client
bot/                   Discord bot entry point and command handlers
data/                  Canonical unit, tactical, and rules data
lib/                   Shared parsing, formatting, sync, and seed utilities
scripts/               Build, data, seed, and import helper scripts
tests/                 Node test suites and import/playwright artifacts
web/public/            Browser app assets, modules, and Firebase bootstrap
web/server.js          Express server and API routes
```

Useful shared modules:

- [`lib/seedCleaner.js`](lib/seedCleaner.js): normalize raw roster formats into the compact seed contract
- [`lib/newrecruit_mapper.js`](lib/newrecruit_mapper.js): NewRecruit-to-seed mapping logic
- [`lib/rosterParser.js`](lib/rosterParser.js): expand cleaned seed data into display-ready roster models
- [`lib/formatter.js`](lib/formatter.js): Discord-style compact text formatter
- [`lib/cloudSync.js`](lib/cloudSync.js): Firebase sync and linked match helpers
- [`lib/gameData.js`](lib/gameData.js): `/data` loading and lookup helpers

## Android App

The Android client lives in [`android/`](android/) and has its own guide at [`android/README.md`](android/README.md).

That app currently covers:

- roster lookup by seed
- local persistence for recent seeds, favorites, and game state
- local Play Mode
- Firebase-backed cloud sync foundations

## Troubleshooting

- Seed not found:
  - confirm the seed exists and is typed correctly
- Linked game actions unavailable:
  - verify Firebase auth is working and Firestore rules are published
- `Syncing...` or cloud issues:
  - check browser auth state first, then Firestore permissions
- Card image generation fails:
  - confirm the local server is running and Puppeteer can launch
- Hosting shows a default Firebase 404:
  - rebuild with `npm run build:hosting` and redeploy with `npm run deploy:hosting`

## Status

This repository is actively evolving. The app surface has moved beyond simple roster lookup: the browser client is the primary product, Discord is an optional integration, and Android is a parallel client in progress.
