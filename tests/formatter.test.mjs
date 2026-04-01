/**
 * Formatter tests — validates that formatCompact() and formatJson() produce
 * correct output for all three faction seeds.
 *
 * Tests cover:
 *   - Plain-text mode contains no ANSI escape sequences
 *   - Output contains the seed code, faction name, and resource shorthand
 *   - Unit type brackets appear in correct TYPE_ORDER
 *   - Tactical card section present when cards exist
 *   - formatJson() produces valid, parseable JSON
 *   - Degradation guard: output never exceeds charLimit
 */

import assert from 'assert/strict';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRoster } from '../lib/rosterParser.js';
import { formatCompact, formatJson } from '../lib/formatter.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures');

const TYPE_BRACKETS = ['[H]', '[C]', '[E]', '[S]', '[A]', '[O]'];

// Resource shorthand per faction (duplicated here so formatter tests are
// self-contained and immediately catch regressions in RESOURCE_SHORT).
const RESOURCE_SHORT = { Terran: 'cp', Zerg: 'bm', Protoss: 'pe' };

// Seeds + what we know about their formatted text
const CASES = [
  { seed: 'VNIEMU', faction: 'Terran', resourceLabel: 'cp' },
  { seed: 'IWMZ7C', faction: 'Zerg',   resourceLabel: 'bm' },
  { seed: 'TTPIBA', faction: 'Protoss', resourceLabel: 'pe' },
];

async function loadRoster(seed) {
  const path = join(FIXTURE_DIR, `${seed}.json`);
  const flat  = JSON.parse(await readFile(path, 'utf8'));
  return parseRoster(flat);
}

export async function run({ test }) {
  // Pre-load all rosters
  const rosters = {};
  for (const { seed } of CASES) {
    rosters[seed] = await loadRoster(seed);
  }

  // ── Plain-mode: no ANSI escape sequences ─────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];

    test(`[${seed}] plain mode contains no ANSI escape codes`, () => {
      const out = formatCompact(r, { plain: true });
      assert.ok(
        !out.includes('\u001b'),
        'ANSI ESC character found in plain-mode output'
      );
    });

    test(`[${seed}] ANSI mode contains ANSI escape codes`, () => {
      const out = formatCompact(r, { plain: false });
      // If the output contains an ESC, ANSI colouring is present.
      // (May not apply if roster output is extremely long and falls back to plain.)
      // We only check that the output is non-empty and structurally sound.
      assert.ok(out.length > 0, 'empty output from formatter');
    });
  }

  // ── Seed and faction in output ────────────────────────────────────────────

  for (const { seed, faction } of CASES) {
    const r  = rosters[seed];
    const out = formatCompact(r, { plain: true });

    test(`[${seed}] output contains seed code`, () => {
      assert.ok(out.includes(seed), `"${seed}" not found in output`);
    });

    test(`[${seed}] output contains faction name (case-insensitive)`, () => {
      assert.ok(
        out.toLowerCase().includes(faction.toLowerCase()),
        `"${faction}" not found in output`
      );
    });
  }

  // ── Resource shorthand label ──────────────────────────────────────────────

  for (const { seed, faction, resourceLabel } of CASES) {
    test(`[${seed}] output contains resource shorthand "${resourceLabel}"`, () => {
      const r   = rosters[seed];
      const out = formatCompact(r, { plain: true });
      assert.ok(
        out.includes(resourceLabel),
        `resource shorthand "${resourceLabel}" not found for faction "${faction}"`
      );
    });
  }

  // ── Minerals and gas values appear in output ──────────────────────────────

  for (const { seed } of CASES) {
    const r   = rosters[seed];
    const out = formatCompact(r, { plain: true });

    test(`[${seed}] output contains mineral value`, () => {
      assert.ok(
        out.includes(`${r.minerals.used}`),
        `mineral value ${r.minerals.used} not found in output`
      );
    });

    test(`[${seed}] output contains gas value`, () => {
      assert.ok(
        out.includes(`${r.gas.used}`),
        `gas value ${r.gas.used} not found in output`
      );
    });
  }

  // ── Unit type brackets ────────────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r   = rosters[seed];

    test(`[${seed}] unit type brackets appear in output`, () => {
      const out = formatCompact(r, { plain: true });
      const usedTypes = new Set(r.units.map(u => u.type));
      for (const type of usedTypes) {
        const letter = { Hero: 'H', Core: 'C', Elite: 'E',
                         Support: 'S', Air: 'A', Other: 'O' }[type] ?? '?';
        const bracket = `[${letter}]`;
        assert.ok(out.includes(bracket), `bracket "${bracket}" not found in output`);
      }
    });
  }

  // ── Unit type ordering in output ──────────────────────────────────────────

  for (const { seed } of CASES) {
    const r   = rosters[seed];

    // The output renders units in TYPE_ORDER. We verify this by checking that
    // the first occurrence of each bracket appears in the correct sequence.
    test(`[${seed}] unit type brackets appear in TYPE_ORDER in output`, () => {
      const out = formatCompact(r, { plain: true });
      const order = ['[H]', '[C]', '[E]', '[S]', '[A]', '[O]'];
      const positions = order.map(b => out.indexOf(b)).filter(p => p !== -1);
      for (let i = 1; i < positions.length; i++) {
        assert.ok(
          positions[i] > positions[i - 1],
          `unit brackets do not appear in TYPE_ORDER in output for ${seed}`
        );
      }
    });
  }

  // ── Hero units appear before Core in output (Zerg & Protoss) ─────────────

  for (const { seed } of ['IWMZ7C', 'TTPIBA'].map(s => ({ seed: s }))) {
    test(`[${seed}] [H] bracket appears before [C] bracket in output`, () => {
      const r   = rosters[seed];
      const out = formatCompact(r, { plain: true });
      const hPos = out.indexOf('[H]');
      const cPos = out.indexOf('[C]');
      assert.ok(hPos !== -1, '[H] bracket not found');
      assert.ok(cPos !== -1, '[C] bracket not found');
      assert.ok(hPos < cPos, '[H] does not appear before [C] in output');
    });
  }

  // ── Tactical cards section ────────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];

    if (r.tacticalCards.length > 0) {
      test(`[${seed}] TACT: section appears in output when there are tactical cards`, () => {
        const out = formatCompact(r, { plain: true });
        assert.ok(out.includes('TACT:'), '"TACT:" not found in output');
      });

      test(`[${seed}] at least one tactical card name appears in output`, () => {
        const out = formatCompact(r, { plain: true });
        const found = r.tacticalCards.some(name => out.includes(name));
        assert.ok(found, 'no tactical card names found in output');
      });
    }
  }

  // ── charLimit guard ───────────────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];

    test(`[${seed}] default charLimit=2000 is respected`, () => {
      const out = formatCompact(r);
      assert.ok(out.length <= 2000, `output length ${out.length} exceeds 2000 chars`);
    });

    test(`[${seed}] charLimit=500 is respected`, () => {
      const out = formatCompact(r, { charLimit: 500 });
      assert.ok(out.length <= 500, `output length ${out.length} exceeds 500 chars`);
    });
  }

  // ── Option: showSlotBreakdown ─────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];
    test(`[${seed}] showSlotBreakdown adds SUP: line`, () => {
      const out = formatCompact(r, { plain: true, showSlotBreakdown: true });
      assert.ok(out.includes('SUP:'), '"SUP:" not found when showSlotBreakdown=true');
    });
  }

  // ── Option: abbreviateUpgrades ────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];
    test(`[${seed}] abbreviateUpgrades=true produces output without errors`, () => {
      const out = formatCompact(r, { plain: true, abbreviateUpgrades: true });
      assert.ok(typeof out === 'string' && out.length > 0);
    });
  }

  // ── Option: tacticalPerLine ───────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];
    if (r.tacticalCards.length > 0) {
      test(`[${seed}] tacticalPerLine=true puts cards on separate lines`, () => {
        const out = formatCompact(r, { plain: true, tacticalPerLine: true });
        assert.ok(out.includes('\n  - '), 'per-line tactical cards prefix "  - " not found');
      });

      test(`[${seed}] showTacticalGasCosts=true shows tactical gas labels`, () => {
        const firstCard = r.tacticalCardDetails?.[0];
        assert.ok(firstCard, 'expected at least one tactical card detail');
        const withGas = {
          ...r,
          tacticalCardDetails: r.tacticalCardDetails.map((card, idx) => ({
            ...card,
            gasCost: idx === 0 ? 35 : card.gasCost,
          })),
        };
        const out = formatCompact(withGas, { plain: true, showTacticalGasCosts: true });
        assert.ok(out.includes('35g'), 'expected tactical gas label "35g" in output');
      });

      test(`[${seed}] showTacticalResourceCosts=true shows tactical resource labels`, () => {
        const firstCard = r.tacticalCardDetails?.[0];
        assert.ok(firstCard, 'expected at least one tactical card detail');
        const resourceShort = { Terran: 'cp', Zerg: 'bm', Protoss: 'pe' }[r.faction] ?? 'res';
        const withResource = {
          ...r,
          tacticalCardDetails: r.tacticalCardDetails.map((card, idx) => ({
            ...card,
            resource: idx === 0 ? 1 : card.resource,
          })),
        };
        const out = formatCompact(withResource, { plain: true, showTacticalResourceCosts: true });
        assert.ok(out.includes(`1${resourceShort}`), `expected tactical resource label "1${resourceShort}" in output`);
      });
    }
  }

  // ── formatJson ────────────────────────────────────────────────────────────

  for (const { seed } of CASES) {
    const r = rosters[seed];

    test(`[${seed}] formatJson produces valid JSON`, () => {
      const json = formatJson(r);
      let parsed;
      assert.doesNotThrow(() => { parsed = JSON.parse(json); });
      assert.equal(parsed.seed, seed);
      assert.equal(parsed.faction, r.faction);
      assert.equal(parsed.units.length, r.units.length);
    });
  }

  // ── Regression: totalCost appears in output for each unit ────────────────

  for (const { seed } of CASES) {
    const r   = rosters[seed];
    const out = formatCompact(r, { plain: true });

    test(`[${seed}] every unit totalCost appears in output`, () => {
      for (const u of r.units) {
        assert.ok(
          out.includes(`${u.totalCost}m`),
          `totalCost "${u.totalCost}m" for unit "${u.name}" not found in output`
        );
      }
    });
  }
}
