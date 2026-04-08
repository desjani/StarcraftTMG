# StarCraft TMG — Adjutant

Discord bot and web UI that looks up a StarCraft TMG army list by its **seed code** and posts a compact, ANSI-coloured summary.

## Requirements

- [Node.js 18+](https://nodejs.org/)
- A [Discord Application](https://discord.com/developers/applications) with a bot token (for the bot only)

## Setup

```bash
npm install
cp .env.example .env   # fill in your Discord credentials
```

## Run locally

```bash
# web UI
npm run web

# discord bot
npm run bot
```

Open http://localhost:3000 for the web UI.

## Firebase linked live game prerequisites

Linked live games rely on Firebase Auth and Firestore in the browser app.

- Enable Anonymous sign-in in Firebase Authentication so invited players can join without creating a full account.
- Publish the current Firestore rules from [firestore.rules](firestore.rules) after deploying linked-play changes.
- If linked joins start failing with permission errors after a rules change, re-publish the rules before debugging the client.

## Firebase hosting and custom domain

The canonical production web origin is `https://scadjutant.com`.

- Static hosting is configured through [firebase.json](firebase.json) and [.firebaserc](.firebaserc).
- Build the hosting artifact with `npm run build:hosting`.
- Deploy the hosting site with `npm run deploy:hosting`.
- Bot-published roster links now default to `https://scadjutant.com` and can be overridden with `PUBLIC_WEB_BASE_URL` if needed.
- Internal bot calls to the card and analytics endpoints can be overridden with `INTERNAL_WEB_BASE_URL` if the bot no longer runs beside the web server.

### Mobile preview (Phase 1 PWA)

The current desktop/web view remains canonical at `https://scadjutant.com/`.

- A separate mobile preview is available at `https://scadjutant.com/mobile/`.
- The preview is generated from the current main UI during `npm run build:hosting`, so it stays in sync without changing the base route.
- Android install test: open `/mobile/` in Chrome and use **Add to Home screen**.
- iOS install test: open `/mobile/` in Safari and use **Share → Add to Home Screen**.

### Cutover checklist

1. Deploy Hosting once with `npm run deploy:hosting`.
2. In Firebase Hosting, add the custom domain `scadjutant.com` and optionally `www.scadjutant.com`.
3. Create the DNS records Firebase provides at your registrar for `scadjutant.com`.
4. In Firebase Authentication, add `scadjutant.com` and `www.scadjutant.com` to Authorized domains.
5. Forward `www.scadjutant.com` to `https://scadjutant.com` if you want a single public host.

### Firebase migration plan

1. Keep the browser app on Firebase Hosting as the canonical public site at `https://scadjutant.com`.
2. Move the Express server to Cloud Run for server-only features such as `/api/card`, analytics endpoints, and any future authenticated APIs.
3. After Cloud Run is live, add Hosting rewrites for `/api/**` to the Cloud Run service.
4. Move the Discord bot to Cloud Run only if you want its runtime on Firebase/GCP too; GitHub should remain source control only.
5. Remove the last GitHub Pages references once Hosting is live and DNS is verified.

## Traffic analytics

The container now tracks lightweight HTTP traffic analytics (request counts, top routes, status codes, user-agent buckets, recent 5xx errors) and persists them to `/app/data/analytics.json`.

It also tracks daily Discord `/roster` command usage and can email a daily digest report.

Set these in `.env`:

```bash
ANALYTICS_KEY=choose-a-secret-key
ANALYTICS_INTERNAL_KEY=choose-a-second-secret-or-reuse-the-same
ANALYTICS_FILE=/app/data/analytics.json
ANALYTICS_EMAIL_TO=jaredtritsch@gmail.com
ANALYTICS_EMAIL_FROM=bot@yourdomain.com
ANALYTICS_DAILY_REPORT_UTC_HOUR=13
ANALYTICS_SMTP_HOST=smtp.yourprovider.com
ANALYTICS_SMTP_PORT=587
ANALYTICS_SMTP_SECURE=false
ANALYTICS_SMTP_USER=your-smtp-user
ANALYTICS_SMTP_PASS=your-smtp-password
```

View analytics:

```bash
curl -H "x-analytics-key: <your key>" http://localhost:3000/api/analytics
```

If `ANALYTICS_KEY` is blank, `/api/analytics` is not protected.

Daily digest email includes:
- `/roster` invokes per day
- Prompted-for-seed vs seed-provided counts
- Unique users and top seeds
- HTTP request totals, top routes, status mix, and latency summary

## Test

```bash
npm test
```

The test runner auto-fetches fixtures from Firestore only when fixture files are missing.

To refresh fixtures manually:

```bash
npm run test:capture
```

## Usage

### Web UI (test without Discord)

```bash
npm run web
# open http://localhost:3000
```

Enter any 6-character seed from the StarCraft TMG Army Builder and see:
- **Discord Preview** — rendered ANSI colours approximating Discord's dark theme
- **Raw Text** — the exact string to paste into Discord
- **Roster Card** — a structured breakdown of every unit and upgrade
- **JSON** — the full parsed roster object

### Discord Bot

```bash
# Register slash commands (add DISCORD_GUILD_ID to .env for instant dev registration)
npm run deploy

# Start the bot
npm run bot
```

**Slash command:** `/roster seed:<code> [plain:true] [stats:true] [abbr_upgrades:true] [tact_per_line:true] [abbr_tact:true] [tact_supply:true] [slot_breakdown:true]`

| Option | Description | Default |
|--------|-------------|---------|
| `seed` | 6-char roster code from the Army Builder | required |
| `plain` | Plain text output — no ANSI colours | `false` |
| `stats` | Include HP / Armor / Evade / Speed per unit | `false` |
| `abbr_upgrades` | Inline paid upgrades as abbreviations (e.g. `{HB, BA, TC}`) | `false` |
| `tact_per_line` | Show tactical cards one per line | `false` |
| `abbr_tact` | Abbreviate tactical card names | `false` |
| `tact_supply` | Show tactical supply types (e.g. `[S+2]`) | `false` |
| `slot_breakdown` | Move supply to its own line with per-slot used/total values | `false` |

## Project structure

```
lib/
	firestoreClient.js   Firebase REST API client + Firestore value flattener
	rosterParser.js      Converts raw Firestore document → clean roster object
	formatter.js         ANSI Discord formatter; auto-degrades to fit char limit
bot/
	bot.js               discord.js entry point
	deploy-commands.js   Slash command registration script
	commands/roster.js   /roster command handler
web/
	server.js            Express server (serves UI + /api/* endpoints)
	public/index.html    Web test UI
	public/app.js        Browser app (imports the same lib/ modules)
```

## How the seed works

A seed is a **6-character alphanumeric code** (e.g. `TRN9X2`) generated by the Army Builder when a list is saved. It is the Firestore document ID in the `shared_rosters` collection and can be shared so others can load the same list.

## Output format

```ansi
══ PROTOSS · Khalai ══
1000/1000m  95/100g  7sup  4pe

[H] Artanis  250m  1◆
[O] Pylon  0m
[C] Adept ×4  150m
[C] Zealot ×3  160m
[E] Praetor Guard (Zealot) ×3  280m
[E] Stalker  160m

TACT: Warp Gate · Forge · Gateway

Seed: 009IDJ
```

Unit type abbreviations: `[H]` Hero · `[C]` Core · `[E]` Elite · `[S]` Support · `[A]` Air · `[O]` Other

## Troubleshooting

- Seed not found: verify the 6-character seed and ensure it exists in the Army Builder share list.
- Clipboard text copy fails: use a secure browser context (https or localhost) and grant clipboard permission.
- Clipboard image copy fails: some browsers block image clipboard APIs; use Download Image as fallback.
- Debug diagnostics: append `?debug=1` to the web URL, or set localStorage key `sctmg.debug` to `true`.
