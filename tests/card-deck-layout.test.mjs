import assert from 'assert/strict';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRoster } from '../lib/rosterParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures');
const APP_JS_PATH = join(__dirname, '../web/public/app.js');

const WORST_CASE_SEEDS = [
  { seed: '58WS1N', faction: 'Terran' },
  { seed: 'KPKC0V', faction: 'Zerg' },
  { seed: 'U093PL', faction: 'Protoss' },
];

const PHASE_ORDER = ['Any', 'Movement', 'Assault', 'Combat', 'Scoring', 'Cleanup'];

function normalizePhaseLabel(phase) {
  const cleaned = String(phase || '')
    .replace(/\s+phase\b/gi, '')
    .trim();
  if (!cleaned) return 'Any';

  if (/\b(any|passive|always)\b/i.test(cleaned)) return 'Any';
  if (/\b(move|movement|maneuver|deploy|setup)\b/i.test(cleaned)) return 'Movement';
  if (/\bassault\b/i.test(cleaned)) return 'Assault';
  if (/\bcombat\b/i.test(cleaned)) return 'Combat';
  if (/\bscor(e|ing)\b/i.test(cleaned)) return 'Scoring';
  if (/\b(cleanup|regroup|end)\b/i.test(cleaned)) return 'Cleanup';
  return 'Any';
}

function isWeaponProfile(upgrade) {
  const description = String(upgrade?.description || '').trim();
  return /^RANGE\s*:/i.test(description) && /\bTARGET\s*:/i.test(description);
}

function isNaturalAbility(upgrade) {
  const cost = upgrade?.cost;
  if (typeof cost === 'number') return cost <= 0;
  if (typeof cost === 'string') {
    const trimmed = cost.trim().toLowerCase();
    if (!trimmed || trimmed === 'free') return true;
    const numericCost = Number.parseFloat(trimmed);
    if (Number.isFinite(numericCost)) return numericCost <= 0;
  }
  return cost == null;
}

function parseWeaponProfile(upgrade) {
  const description = String(upgrade?.description || '').trim();
  const lines = description
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const statsLine = lines[0] || '';
  const surgeLine = lines.find(line => /^SURGE\s*:/i.test(line)) || '';
  const statEntries = Object.fromEntries(
    statsLine
      .split('|')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [label, ...rest] = part.split(':');
        return [String(label || '').trim().toUpperCase(), rest.join(':').trim()];
      })
  );
  const traits = lines
    .slice(lines.indexOf(surgeLine) >= 0 ? lines.indexOf(surgeLine) + 1 : 1)
    .filter(line => !/^SURGE\s*:/i.test(line))
    .join(' | ');

  return {
    name: upgrade?.name ?? '',
    range: statEntries.RANGE ?? '-',
    roa: statEntries.ROA ?? '-',
    hit: statEntries.HIT ?? '-',
    damage: statEntries.DMG ?? '-',
    surge: surgeLine ? surgeLine.replace(/^SURGE\s*:/i, '').trim() || '-' : '-',
    traits,
    active: !!upgrade?.active,
  };
}

function groupAbilitiesByPhase(abilities = []) {
  const groups = new Map();
  for (const ability of abilities) {
    const phase = normalizePhaseLabel(ability?.phase || ability?.activation || 'Any');
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase).push(ability);
  }
  return PHASE_ORDER
    .filter(phase => groups.has(phase))
    .map(phase => ({ phase, abilities: groups.get(phase) }));
}

function estimateAbilityWeight(ability) {
  const nameLen = String(ability?.name || '').trim().length;
  const descLen = String(ability?.description || '').trim().length;
  // Mirrors the card renderer's balancing strategy.
  return descLen + nameLen * 2 + 60;
}

function estimateMaxBackColumnWeight(unit) {
  const visibleAbilities = (unit.allUpgrades ?? [])
    .filter(upg => !isWeaponProfile(upg))
    .filter(upg => isNaturalAbility(upg) || upg.active);

  const grouped = groupAbilitiesByPhase(visibleAbilities);
  const weighted = [];
  for (const group of grouped) {
    for (const ability of group.abilities) {
      weighted.push(estimateAbilityWeight(ability));
    }
  }

  let colA = 0;
  let colB = 0;
  for (const w of weighted) {
    if (colA <= colB) colA += w;
    else colB += w;
  }
  return Math.max(colA, colB);
}

async function loadRoster(seed) {
  const path = join(FIXTURE_DIR, `${seed}.json`);
  const flat = JSON.parse(await readFile(path, 'utf8'));
  return parseRoster(flat);
}

export async function run({ test }) {
  const rosters = {};
  for (const { seed } of WORST_CASE_SEEDS) {
    rosters[seed] = await loadRoster(seed);
  }

  const appJsText = await readFile(APP_JS_PATH, 'utf8');

  test('[layout] print unit weapon table includes a Traits column', () => {
    assert.ok(appJsText.includes('<th>Traits</th>'));
  });

  test('[layout] weapon names are not ellipsized in print deck CSS', () => {
    const hasEllipsis = /\.unit-weapons-table\s+\.weapon-name[\s\S]{0,260}text-overflow:\s*ellipsis/i.test(appJsText);
    assert.equal(hasEllipsis, false, 'weapon-name style still contains text-overflow: ellipsis');
  });

  for (const { seed, faction } of WORST_CASE_SEEDS) {
    const roster = rosters[seed];

    test(`[${seed}] roster resolves as ${faction}`, () => {
      assert.equal(roster.faction, faction);
      assert.ok(roster.units.length > 0, 'expected at least one unit');
    });

    test(`[${seed}] weapon profile rows include traits text for wordiest cards`, () => {
      const profiles = roster.units
        .flatMap(unit => (unit.allUpgrades ?? [])
          .filter(isWeaponProfile)
          .filter(upg => isNaturalAbility(upg) || upg.active)
          .map(parseWeaponProfile));
      assert.ok(profiles.length > 0, 'expected at least one weapon profile');
      const withTraits = profiles.filter(profile => String(profile.traits || '').trim().length > 0);
      assert.ok(withTraits.length > 0, 'expected at least one profile with traits content');
    });

    test(`[${seed}] front-card content remains within non-truncating string budgets`, () => {
      for (const unit of roster.units) {
        const title = `${unit.name}${Number(unit.models ?? 1) > 1 ? ` x${unit.models}` : ''}`;
        assert.ok(title.length <= 44, `title too long for single-line centered header: ${title}`);

        const profiles = (unit.allUpgrades ?? [])
          .filter(isWeaponProfile)
          .filter(upg => isNaturalAbility(upg) || upg.active)
          .map(parseWeaponProfile);

        for (const profile of profiles) {
          assert.ok(profile.name.length <= 64, `weapon name exceeds safe printable width: ${profile.name}`);
          assert.ok(String(profile.traits || '').length <= 120, `traits text exceeds safe printable width: ${profile.traits}`);
        }
      }
    });

    test(`[${seed}] back-card weighted columns stay under fit threshold`, () => {
      const maxWeight = Math.max(...roster.units.map(unit => estimateMaxBackColumnWeight(unit)));
      // Empirical safety cap for 70mm x 2-column back layout with 6.6-8pt fonts.
      assert.ok(maxWeight <= 3000, `estimated ability column overflow risk: weight=${maxWeight}`);
    });
  }
}
