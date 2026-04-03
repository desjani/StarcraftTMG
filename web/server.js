/**
 * StarCraft TMG Roster Web UI — Express server.
 * Run with: node web/server.js
 *
 * Routes:
 *   GET /                          → index.html
 *   GET /lib/*                     → shared ES-module library (also imported by the browser)
 *   GET /api/roster/:seed          → JSON: { ok, roster }
 *   GET /api/format/:seed          → plain-text Discord code block
 *     ?plain=1   → no ANSI
 *     ?stats=1   → include unit stats
 *     ?abbr=1    → abbreviate paid upgrades inline (e.g. {HB, BA})
 *     ?tactLine=1   → tactical cards on separate lines
 *     ?tactAbbr=1   → abbreviate tactical card names
 *     ?tactSupply=1 → show tactical supply types (e.g. [S+2])
 *     ?tactResource=1 → show tactical card faction-resource values (e.g. 1cp)
 *     ?tactGas=1    → show tactical card gas costs (e.g. 35g)
 *     ?slotBreakdown=1 → move supply to dedicated line with slot used/total values
 *     ?limit=N   → character limit (default 2000)
 */
import 'dotenv/config';
import express from 'express';
import path    from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { fetchRoster, fetchTacticalCards }   from '../lib/firestoreClient.js';
import { parseRoster }   from '../lib/rosterParser.js';
import { formatCompact, formatJson } from '../lib/formatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = parseInt(process.env.PORT ?? '3000', 10);
const ANALYTICS_FILE = process.env.ANALYTICS_FILE ?? '/app/data/analytics.json';
const ANALYTICS_KEY = process.env.ANALYTICS_KEY ?? '';
const ANALYTICS_INTERNAL_KEY = process.env.ANALYTICS_INTERNAL_KEY ?? ANALYTICS_KEY;
const ANALYTICS_EMAIL_TO = process.env.ANALYTICS_EMAIL_TO ?? 'jaredtritsch@gmail.com';
const ANALYTICS_EMAIL_FROM = process.env.ANALYTICS_EMAIL_FROM ?? '';
const ANALYTICS_SMTP_HOST = process.env.ANALYTICS_SMTP_HOST ?? '';
const ANALYTICS_SMTP_PORT = parseInt(process.env.ANALYTICS_SMTP_PORT ?? '587', 10);
const ANALYTICS_SMTP_SECURE = process.env.ANALYTICS_SMTP_SECURE === '1' || process.env.ANALYTICS_SMTP_SECURE === 'true';
const ANALYTICS_SMTP_USER = process.env.ANALYTICS_SMTP_USER ?? '';
const ANALYTICS_SMTP_PASS = process.env.ANALYTICS_SMTP_PASS ?? '';
const ANALYTICS_DAILY_REPORT_UTC_HOUR = parseInt(process.env.ANALYTICS_DAILY_REPORT_UTC_HOUR ?? '13', 10);

const analytics = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  methods: {},
  statuses: {},
  routes: {},
  userAgents: {},
  httpByDay: {},
  rosterByDay: {},
  recentErrors: [],
  lastDailyEmailSentFor: null,
  dirty: false,
  lastSavedAt: null,
};

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousUtcDayKey(date = new Date()) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDayKey(d);
}

function ensureHttpDayBucket(dayKey) {
  if (!analytics.httpByDay[dayKey]) {
    analytics.httpByDay[dayKey] = {
      requests: 0,
      methods: {},
      statuses: {},
      routes: {},
      userAgents: {},
      totalDurationMs: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
    };
  }
  return analytics.httpByDay[dayKey];
}

function ensureRosterDayBucket(dayKey) {
  if (!analytics.rosterByDay[dayKey]) {
    analytics.rosterByDay[dayKey] = {
      invokes: 0,
      withSeedProvided: 0,
      promptedForSeed: 0,
      modalSeedSubmissions: 0,
      topSeeds: {},
      users: {},
    };
  }
  return analytics.rosterByDay[dayKey];
}

function normalizeRoute(req) {
  if (req.path.startsWith('/api/roster/')) return '/api/roster/:seed';
  if (req.path.startsWith('/api/format/')) return '/api/format/:seed';
  if (req.path.startsWith('/api/json/')) return '/api/json/:seed';
  if (req.path.startsWith('/api/card/')) return '/api/card/:seed';
  if (/^\/[A-Za-z0-9]{4,8}\/card\.png$/i.test(req.path)) return '/:seed/card.png';
  if (/^\/[A-Za-z0-9]{4,8}$/i.test(req.path)) return '/:seed';
  return req.path;
}

function getUserAgentBucket(req) {
  const ua = String(req.get('user-agent') || 'unknown').toLowerCase();
  if (ua.includes('discordbot')) return 'DiscordBot';
  if (ua.includes('discord')) return 'Discord';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('curl')) return 'curl';
  return 'Other';
}

async function loadAnalytics() {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    analytics.startedAt = parsed.startedAt ?? analytics.startedAt;
    analytics.totalRequests = parsed.totalRequests ?? 0;
    analytics.methods = parsed.methods ?? {};
    analytics.statuses = parsed.statuses ?? {};
    analytics.routes = parsed.routes ?? {};
    analytics.userAgents = parsed.userAgents ?? {};
    analytics.httpByDay = parsed.httpByDay ?? {};
    analytics.rosterByDay = parsed.rosterByDay ?? {};
    analytics.recentErrors = parsed.recentErrors ?? [];
    analytics.lastDailyEmailSentFor = parsed.lastDailyEmailSentFor ?? null;
    analytics.lastSavedAt = parsed.lastSavedAt ?? null;
    console.log(`[analytics] Loaded persisted analytics from ${ANALYTICS_FILE}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[analytics] Failed to load analytics: ${err.message}`);
    }
  }
}

async function saveAnalytics(force = false) {
  if (!analytics.dirty && !force) return;
  try {
    await fs.mkdir(path.dirname(ANALYTICS_FILE), { recursive: true });
    analytics.lastSavedAt = new Date().toISOString();
    const snapshot = {
      startedAt: analytics.startedAt,
      totalRequests: analytics.totalRequests,
      methods: analytics.methods,
      statuses: analytics.statuses,
      routes: analytics.routes,
      userAgents: analytics.userAgents,
      httpByDay: analytics.httpByDay,
      rosterByDay: analytics.rosterByDay,
      recentErrors: analytics.recentErrors,
      lastDailyEmailSentFor: analytics.lastDailyEmailSentFor,
      lastSavedAt: analytics.lastSavedAt,
    };
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
    analytics.dirty = false;
  } catch (err) {
    console.warn(`[analytics] Failed to persist analytics: ${err.message}`);
  }
}

function bumpCounter(obj, key, delta = 1) {
  obj[key] = (obj[key] ?? 0) + delta;
}

function captureAnalytics(req, res, durationMs) {
  const method = req.method;
  const status = String(res.statusCode);
  const route = normalizeRoute(req);
  const ua = getUserAgentBucket(req);
  const dayKey = utcDayKey();

  analytics.totalRequests += 1;
  bumpCounter(analytics.methods, method);
  bumpCounter(analytics.statuses, status);
  bumpCounter(analytics.userAgents, ua);

  const dayBucket = ensureHttpDayBucket(dayKey);
  dayBucket.requests += 1;
  bumpCounter(dayBucket.methods, method);
  bumpCounter(dayBucket.statuses, status);
  bumpCounter(dayBucket.userAgents, ua);
  dayBucket.totalDurationMs += durationMs;
  dayBucket.avgDurationMs = Number((dayBucket.totalDurationMs / dayBucket.requests).toFixed(2));
  dayBucket.maxDurationMs = Math.max(dayBucket.maxDurationMs, durationMs);
  bumpCounter(dayBucket.routes, route);

  if (!analytics.routes[route]) {
    analytics.routes[route] = {
      hits: 0,
      methods: {},
      statuses: {},
      totalDurationMs: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
      lastHitAt: null,
    };
  }

  const routeStats = analytics.routes[route];
  routeStats.hits += 1;
  bumpCounter(routeStats.methods, method);
  bumpCounter(routeStats.statuses, status);
  routeStats.totalDurationMs += durationMs;
  routeStats.avgDurationMs = Number((routeStats.totalDurationMs / routeStats.hits).toFixed(2));
  routeStats.maxDurationMs = Math.max(routeStats.maxDurationMs, durationMs);
  routeStats.lastHitAt = new Date().toISOString();

  if (res.statusCode >= 500) {
    analytics.recentErrors.unshift({
      at: new Date().toISOString(),
      method,
      route,
      status: res.statusCode,
      durationMs,
    });
    analytics.recentErrors = analytics.recentErrors.slice(0, 50);
  }

  analytics.dirty = true;
}

function isAnalyticsAuthorized(req) {
  if (!ANALYTICS_KEY) return true;
  const headerKey = req.get('x-analytics-key');
  const queryKey = req.query.key;
  return headerKey === ANALYTICS_KEY || queryKey === ANALYTICS_KEY;
}

function isInternalAnalyticsAuthorized(req) {
  if (!ANALYTICS_INTERNAL_KEY) return true;
  const headerKey = req.get('x-internal-analytics-key');
  const queryKey = req.query.key;
  return headerKey === ANALYTICS_INTERNAL_KEY || queryKey === ANALYTICS_INTERNAL_KEY;
}

function trackRosterEvent(req) {
  const event = String(req.query.event ?? 'invoke');
  const seed = String(req.query.seed ?? '').trim().toUpperCase();
  const userId = String(req.query.userId ?? '').trim();
  const dayKey = utcDayKey();
  const dayBucket = ensureRosterDayBucket(dayKey);

  if (event === 'invoke') {
    dayBucket.invokes += 1;
    if (String(req.query.withSeed) === '1') dayBucket.withSeedProvided += 1;
    if (String(req.query.prompted) === '1') dayBucket.promptedForSeed += 1;
  }

  if (event === 'modal_seed') {
    dayBucket.modalSeedSubmissions += 1;
  }

  if (seed) {
    bumpCounter(dayBucket.topSeeds, seed);
  }

  if (userId) {
    bumpCounter(dayBucket.users, userId);
  }

  analytics.dirty = true;
}

function topEntries(obj, limit = 10) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function analyticsSummary() {
  const topRoutes = Object.entries(analytics.routes)
    .sort((a, b) => b[1].hits - a[1].hits)
    .slice(0, 15)
    .map(([route, stats]) => ({ route, ...stats }));

  return {
    startedAt: analytics.startedAt,
    now: new Date().toISOString(),
    totalRequests: analytics.totalRequests,
    methods: analytics.methods,
    statuses: analytics.statuses,
    topUserAgents: topEntries(analytics.userAgents, 10),
    topRoutes,
    httpToday: analytics.httpByDay[utcDayKey()] ?? null,
    rosterToday: analytics.rosterByDay[utcDayKey()] ?? null,
    recentErrors: analytics.recentErrors,
    lastSavedAt: analytics.lastSavedAt,
    analyticsFile: ANALYTICS_FILE,
  };
}

function isDailyEmailConfigured() {
  return Boolean(ANALYTICS_SMTP_HOST && ANALYTICS_EMAIL_FROM && ANALYTICS_EMAIL_TO);
}

function buildDailyEmailText(dayKey) {
  const http = analytics.httpByDay[dayKey] ?? {
    requests: 0,
    methods: {},
    statuses: {},
    routes: {},
    userAgents: {},
    avgDurationMs: 0,
    maxDurationMs: 0,
  };
  const roster = analytics.rosterByDay[dayKey] ?? {
    invokes: 0,
    withSeedProvided: 0,
    promptedForSeed: 0,
    modalSeedSubmissions: 0,
    topSeeds: {},
    users: {},
  };

  const topRoutes = Object.entries(http.routes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, hits]) => `  - ${route}: ${hits}`)
    .join('\n') || '  - none';

  const topSeeds = Object.entries(roster.topSeeds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([seed, count]) => `  - ${seed}: ${count}`)
    .join('\n') || '  - none';

  const topAgents = Object.entries(http.userAgents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([agent, count]) => `  - ${agent}: ${count}`)
    .join('\n') || '  - none';

  const uniqueRosterUsers = Object.keys(roster.users ?? {}).length;

  return [
    `StarCraft TMG daily analytics for ${dayKey}`,
    '',
    'Roster command stats:',
    `- /roster invokes: ${roster.invokes}`,
    `- With seed provided up front: ${roster.withSeedProvided}`,
    `- Prompted for seed: ${roster.promptedForSeed}`,
    `- Modal seed submissions: ${roster.modalSeedSubmissions}`,
    `- Unique roster users: ${uniqueRosterUsers}`,
    'Top roster seeds:',
    topSeeds,
    '',
    'HTTP traffic stats:',
    `- Total requests: ${http.requests}`,
    `- Methods: ${JSON.stringify(http.methods)}`,
    `- Statuses: ${JSON.stringify(http.statuses)}`,
    `- Avg duration (ms): ${http.avgDurationMs ?? 0}`,
    `- Max duration (ms): ${http.maxDurationMs ?? 0}`,
    'Top routes:',
    topRoutes,
    'Top user agents:',
    topAgents,
    '',
    `Data file: ${ANALYTICS_FILE}`,
    `Generated at: ${new Date().toISOString()}`,
  ].join('\n');
}

async function sendDailyAnalyticsEmail(dayKey) {
  if (!isDailyEmailConfigured()) return false;

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: ANALYTICS_SMTP_HOST,
    port: ANALYTICS_SMTP_PORT,
    secure: ANALYTICS_SMTP_SECURE,
    auth: ANALYTICS_SMTP_USER ? { user: ANALYTICS_SMTP_USER, pass: ANALYTICS_SMTP_PASS } : undefined,
  });

  const text = buildDailyEmailText(dayKey);
  await transporter.sendMail({
    from: ANALYTICS_EMAIL_FROM,
    to: ANALYTICS_EMAIL_TO,
    subject: `StarCraft TMG daily analytics - ${dayKey}`,
    text,
  });
  return true;
}

async function maybeSendDailyAnalyticsReport() {
  if (!isDailyEmailConfigured()) return;
  const now = new Date();
  if (Number.isNaN(ANALYTICS_DAILY_REPORT_UTC_HOUR) || ANALYTICS_DAILY_REPORT_UTC_HOUR < 0 || ANALYTICS_DAILY_REPORT_UTC_HOUR > 23) {
    return;
  }
  if (now.getUTCHours() < ANALYTICS_DAILY_REPORT_UTC_HOUR) return;

  const targetDay = previousUtcDayKey(now);
  if (analytics.lastDailyEmailSentFor === targetDay) return;

  try {
    const sent = await sendDailyAnalyticsEmail(targetDay);
    if (sent) {
      analytics.lastDailyEmailSentFor = targetDay;
      analytics.dirty = true;
      await saveAnalytics(true);
      console.log(`[analytics] Daily report emailed for ${targetDay} to ${ANALYTICS_EMAIL_TO}`);
    }
  } catch (err) {
    console.warn(`[analytics] Failed to send daily report for ${targetDay}: ${err.message}`);
  }
}

await loadAnalytics();

setInterval(() => {
  saveAnalytics().catch(() => {});
}, 15000);

setInterval(() => {
  maybeSendDailyAnalyticsReport().catch(() => {});
}, 60000);

// Capture analytics for all HTTP requests (web + API).
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsed = Number(process.hrtime.bigint() - started) / 1_000_000;
    captureAnalytics(req, res, Number(elapsed.toFixed(2)));
  });
  next();
});

// ── Puppeteer lazy singleton ──────────────────────────────────────────────────
let _browser = null;
async function getBrowser() {
  if (!_browser) {
    const { default: puppeteer } = await import('puppeteer');
    _browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    _browser.on('disconnected', () => { _browser = null; });
  }
  return _browser;
}

// ── Static assets ─────────────────────────────────────────────────────────────
// Expose lib/ so the browser can do: import { fetchRoster } from '/lib/firestoreClient.js'
app.use('/lib',    express.static(path.join(__dirname, '../lib')));
app.use(express.static(path.join(__dirname, 'public')));

// ── API: parsed roster JSON ───────────────────────────────────────────────────
app.get('/api/roster/:seed', async (req, res) => {
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    res.json({ ok: true, roster });
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).json({ ok: false, error: err.message });
  }
});

// ── API: formatted Discord output ─────────────────────────────────────────────
app.get('/api/format/:seed', async (req, res) => {
  const plain     = req.query.plain === '1' || req.query.plain === 'true';
  const showStats = req.query.stats === '1' || req.query.stats === 'true';
  const abbreviateUpgrades = req.query.abbr === '1' || req.query.abbr === 'true';
  const tacticalPerLine = req.query.tactLine === '1' || req.query.tactLine === 'true';
  const abbreviateTacticalCards = req.query.tactAbbr === '1' || req.query.tactAbbr === 'true';
  const showTacticalSupplyTypes = req.query.tactSupply === '1' || req.query.tactSupply === 'true';
  const showTacticalResourceCosts = req.query.tactResource === '1' || req.query.tactResource === 'true';
  const showTacticalGasCosts = req.query.tactGas === '1' || req.query.tactGas === 'true';
  const showSlotBreakdown = req.query.slotBreakdown === '1' || req.query.slotBreakdown === 'true';
  const charLimit = parseInt(req.query.limit ?? '2000', 10);
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    const output = formatCompact(roster, {
      plain,
      showStats,
      abbreviateUpgrades,
      tacticalPerLine,
      abbreviateTacticalCards,
      showTacticalSupplyTypes,
      showTacticalResourceCosts,
      showTacticalGasCosts,
      showSlotBreakdown,
      charLimit,
    });
    res.type('text/plain').send(output);
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).type('text/plain').send(`Error: ${err.message}`);
  }
});

// ── API: roster JSON (formatted for readability) ──────────────────────────────
app.get('/api/json/:seed', async (req, res) => {
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    res.type('text/plain').send(formatJson(roster));
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).type('text/plain').send(`Error: ${err.message}`);
  }
});

// ── API: lightweight traffic analytics ───────────────────────────────────────
app.get('/api/analytics', async (req, res) => {
  if (!isAnalyticsAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  await saveAnalytics(true);
  return res.json({ ok: true, analytics: analyticsSummary() });
});

// ── API: internal analytics events (for bot command telemetry) ──────────────
app.post('/api/internal/track/roster', async (req, res) => {
  if (!isInternalAnalyticsAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  trackRosterEvent(req);
  return res.json({ ok: true });
});

// ── API: roster card PNG image ─────────────────────────────────────────────────
// GET /api/card/:seed[.png]  — optional query params to override defaults:
//   upgrades, stats, size, cost, tactical, tact-resource, tact-gas,
//   tact-supply, slots   (0=off, 1=on; default: all on except stats)
const CARD_SEED_RE = /^([A-Za-z0-9]{4,8})(\.png)?$/;
app.get('/api/card/:seed', async (req, res) => {
  const m = CARD_SEED_RE.exec(req.params.seed);
  if (!m) return res.status(400).type('text/plain').send('Invalid seed');
  const seed = m[1].toUpperCase();

  // Build the internal URL for the headless render
  const qs = new URLSearchParams({ s: seed, tab: 'roster', _img: '1' });
  for (const key of ['upgrades','stats','size','cost','tactical','tact-resource','tact-gas','tact-supply','slots']) {
    if (req.query[key] !== undefined) qs.set(key, req.query[key]);
  }
  const targetUrl = `http://127.0.0.1:${PORT}/?${qs.toString()}`;

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 560, height: 1600, deviceScaleFactor: 2 });
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    // Wait for the readiness signal set by app.js after loadRoster finishes
    await page.waitForFunction(
      () => document.documentElement.dataset.imgReady === '1',
      { timeout: 15000 }
    );

    // Forcibly make the card visible and measure it in one evaluate call
    const box = await page.evaluate(() => {
      const card = document.querySelector('#roster-card .roster-card');
      if (!card) return null;
      // Walk every ancestor up to <body> and force it visible
      let el = card.parentElement;
      while (el && el !== document.documentElement) {
        el.removeAttribute('hidden');
        el.style.setProperty('display', 'block', 'important');
        el = el.parentElement;
      }
      card.style.setProperty('display', 'inline-block', 'important');
      // Force layout recalc
      void card.offsetWidth;
      const r = card.getBoundingClientRect();
      return r.width > 0 ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    });

    if (!box) {
      await page.close();
      return res.status(500).type('text/plain').send('Could not measure card element — card may be empty');
    }

    // Resize viewport to exactly match the card so nothing is clipped
    await page.setViewport({ width: Math.ceil(box.width) + 4, height: Math.ceil(box.height) + 4, deviceScaleFactor: 2 });

    const png = await page.screenshot({
      type: 'png',
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      omitBackground: false,
    });
    await page.close();

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(png);
  } catch (err) {
    if (page) page.close().catch(() => {});
    const status = err.message?.includes('timeout') ? 504 : 500;
    res.status(status).type('text/plain').send(`Image generation failed: ${err.message}`);
  }
});

// ── Clean URL: /:seed/card.png → /api/card/:seed ───────────────────────────────
app.get('/:seed/card.png', (req, res) => {
  const qs = new URLSearchParams(req.query);
  res.redirect(302, `/api/card/${encodeURIComponent(req.params.seed)}.png?${qs.toString()}`);
});

// ── Clean URL: /:seed → loads the SPA with ?s=SEED ───────────────────────────
// Supports optional ?tab= and other query params being forwarded.
const SEED_URL_RE = /^[A-Za-z0-9]{4,8}$/;
app.get('/:seed', (req, res, next) => {
  if (!SEED_URL_RE.test(req.params.seed)) return next();
  const qs = new URLSearchParams(req.query);
  qs.set('s', req.params.seed.toUpperCase());
  res.redirect(302, `/?${qs.toString()}`);
});

app.listen(PORT, () => {
  console.log(`✅  Web UI → http://localhost:${PORT}`);
  console.log(`    API    → http://localhost:${PORT}/api/roster/<seed>`);
  console.log(`    Links  → http://localhost:${PORT}/<seed>`);
  if (ANALYTICS_KEY) {
    console.log('    Analytics → GET /api/analytics with header x-analytics-key');
  } else {
    console.log('    Analytics → GET /api/analytics (no key configured)');
  }
  if (isDailyEmailConfigured()) {
    console.log(`    Daily email → ${ANALYTICS_EMAIL_TO} at ${ANALYTICS_DAILY_REPORT_UTC_HOUR}:00 UTC`);
  } else {
    console.log('    Daily email → disabled (set ANALYTICS_SMTP_* and ANALYTICS_EMAIL_* vars)');
  }
});

process.on('SIGTERM', async () => {
  await saveAnalytics(true);
  process.exit(0);
});

process.on('SIGINT', async () => {
  await saveAnalytics(true);
  process.exit(0);
});
