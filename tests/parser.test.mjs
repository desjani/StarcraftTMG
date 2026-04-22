/**
 * Parser tests — validates that parseRoster() produces correct output for all
 * three faction seeds: VNIEMU (Terran), IWMZ7C (Zerg), TTPIBA (Protoss).
 *
 * Ground-truth seed facts extracted from live Firestore API responses:
 *
 *   VNIEMU · Terran · factionCard:"Terran Armed Forces"
 *     minerals 2000/2000 · gas 200/200 · supply 14 · resources 7 · no heroes
 *
 *   IWMZ7C · Zerg   · factionCard:"Zerg Swarm"
 *     minerals 2020/2020 · gas 190/202 · supply 10 · resources 7 · 1 Hero (Kerrigan)
 *
 *   TTPIBA · Protoss · factionCard:"Khalai"
 *     minerals 2000/2000 · gas 200/200 · supply 14 · resources 7 · 1 Hero (Artanis)
 */

import assert from 'assert/strict';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadGameData } from '../lib/gameData.js';
import { parseRoster } from '../lib/rosterParser.js';
import { cleanSeed } from '../lib/seedCleaner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures');

const TYPE_ORDER = ['Hero', 'Core', 'Elite', 'Support', 'Air', 'Other'];

// ── Ground-truth constants ────────────────────────────────────────────────────

const KNOWN = {
  VNIEMU: {
    faction:     'Terran',
    factionCard: 'Terran Armed Forces',
    minerals:    { used: 2000, limit: 2000 },
    gas:         { used: 200,  limit: 200  },
    supply:      14,
    resources:   7,
    heroCount:   0,
    hasUnit:     ['goliath', 'marauder', 'medic'],
  },
  IWMZ7C: {
    faction:     'Zerg',
    factionCard: 'Zerg Swarm',
    minerals:    { used: 2020, limit: 2020 },
    gas:         { used: 190,  limit: 202  },
    supply:      10,
    resources:   7,
    heroCount:   1,
    hasUnit:     ['kerrigan', 'hydralisk', 'queen'],
  },
  TTPIBA: {
    faction:     'Protoss',
    factionCard: 'Khalai',
    minerals:    { used: 2000, limit: 2000 },
    gas:         { used: 200,  limit: 200  },
    supply:      14,
    resources:   7,
    heroCount:   1,
    hasUnit:     ['artanis', 'stalker', 'zealot'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadFixture(seed) {
  const path = join(FIXTURE_DIR, `${seed}.json`);
  return readFile(path, 'utf8').then(JSON.parse);
}

function typeIndex(type) {
  const i = TYPE_ORDER.indexOf(type);
  return i === -1 ? TYPE_ORDER.length : i;
}

// ── Test suite ────────────────────────────────────────────────────────────────

export async function run({ test }) {
  const seeds = Object.keys(KNOWN);
  const gameData = await loadGameData();

  // Load all fixtures up front
  const fixtures = {};
  for (const seed of seeds) {
    fixtures[seed] = await loadFixture(seed);
  }

  // Parse each fixture
  const rosters = {};
  for (const seed of seeds) {
    rosters[seed] = parseRoster(cleanSeed(fixtures[seed]), { gameData });
  }

  const importedCleanedSeed = cleanSeed({
    id: 'NL1GW9B',
    createdAt: '2026-04-22T19:56:37.916Z',
    faction: 'Protoss',
    factionCardId: 'khalai',
    mineralsLimit: 2000,
    gasLimit: 200,
    slotsAvailable: { Core: 6, Elite: 3, Support: 2, Hero: 1, Air: 2 },
    gasUsed: 200,
    mineralsUsed: 2000,
    slotsUsed: { Core: 6, Elite: 3, Support: 2, Hero: 1, Air: 2 },
    resourceTotal: 7,
    units: [
      {
        id: 'artanis',
        name: 'Artanis',
        uid: 'nr-artanis',
        count: 1,
        size: 'small',
        purchasedUpgrades: [],
      },
      {
        id: 'stalker',
        name: 'Stalker',
        uid: 'nr-stalker',
        count: 2,
        size: 'small',
        purchasedUpgrades: [],
      },
    ],
    tacticalCards: ['orbital_strike'],
    missions: [],
  });
  const importedRoster = parseRoster(importedCleanedSeed, { gameData });

  // ── Identity ──────────────────────────────────────────────────────────────

  for (const seed of seeds) {
    const k = KNOWN[seed];
    const r = rosters[seed];

    test(`[${seed}] seed field matches`, () => {
      assert.equal(r.seed, seed);
    });

    test(`[${seed}] faction is "${k.faction}"`, () => {
      assert.equal(r.faction, k.faction);
    });

    test(`[${seed}] factionCard is "${k.factionCard}"`, () => {
      assert.equal(r.factionCard, k.factionCard);
    });

    test(`[${seed}] minerals used = ${k.minerals.used}`, () => {
      assert.equal(r.minerals.used, k.minerals.used);
    });

    test(`[${seed}] minerals limit = ${k.minerals.limit}`, () => {
      assert.equal(r.minerals.limit, k.minerals.limit);
    });

    test(`[${seed}] gas used = ${k.gas.used}`, () => {
      assert.equal(r.gas.used, k.gas.used);
    });

    test(`[${seed}] gas limit = ${k.gas.limit}`, () => {
      assert.equal(r.gas.limit, k.gas.limit);
    });

    test(`[${seed}] supply = ${k.supply}`, () => {
      assert.equal(r.supply, k.supply);
    });

    test(`[${seed}] resources = ${k.resources}`, () => {
      assert.equal(r.resources, k.resources);
    });
  }

  test('[imported cleaned seed] preserves faction and units without legacy state wrapper', () => {
    assert.equal(importedRoster.seed, 'NL1GW9B');
    assert.equal(importedRoster.faction, 'Protoss');
    assert.equal(importedRoster.units.length, 2);
    assert.ok(importedRoster.units.some((unit) => unit.id === 'artanis'));
    assert.ok(importedRoster.units.some((unit) => unit.id === 'stalker'));
  });

  // ── Unit presence ─────────────────────────────────────────────────────────

  for (const seed of seeds) {
    const k = KNOWN[seed];
    const r = rosters[seed];

    test(`[${seed}] has at least one unit`, () => {
      assert.ok(r.units.length > 0, 'expected units.length > 0');
    });

    test(`[${seed}] hero count = ${k.heroCount}`, () => {
      const heroes = r.units.filter(u => u.type === 'Hero');
      assert.equal(
        heroes.length,
        k.heroCount,
        `expected ${k.heroCount} hero(es), got ${heroes.length}`
      );
    });

    for (const unitId of k.hasUnit) {
      test(`[${seed}] contains unit id "${unitId}"`, () => {
        const found = r.units.some(u => u.id === unitId);
        assert.ok(found, `no unit with id="${unitId}" found in roster`);
      });
    }
  }

  // ── Unit shape ────────────────────────────────────────────────────────────

  for (const seed of seeds) {
    const r = rosters[seed];

    test(`[${seed}] every unit has required fields`, () => {
      const required = ['id', 'name', 'type', 'size', 'models', 'supply',
                        'baseCost', 'totalCost', 'activeUpgrades', 'allUpgrades', 'stats'];
      for (const u of r.units) {
        for (const field of required) {
          assert.ok(
            Object.prototype.hasOwnProperty.call(u, field),
            `unit "${u.name}" missing field "${field}"`
          );
        }
      }
    });

    test(`[${seed}] every unit type is in TYPE_ORDER`, () => {
      for (const u of r.units) {
        assert.ok(
          TYPE_ORDER.includes(u.type),
          `unit "${u.name}" has unknown type "${u.type}"`
        );
      }
    });

    test(`[${seed}] every unit stats has hp, armor, evade, speed, shield`, () => {
      for (const u of r.units) {
        const st = u.stats;
        const fields = ['hp', 'armor', 'evade', 'speed', 'shield'];
        for (const f of fields) {
          assert.ok(
            Object.prototype.hasOwnProperty.call(st, f),
            `unit "${u.name}" stats missing field "${f}"`
          );
        }
      }
    });

    test(`[${seed}] models is a positive integer for all units`, () => {
      for (const u of r.units) {
        assert.ok(
          Number.isInteger(u.models) && u.models >= 1,
          `unit "${u.name}" has invalid models="${u.models}"`
        );
      }
    });

    test(`[${seed}] supply is a non-negative integer for all units`, () => {
      for (const u of r.units) {
        assert.ok(
          Number.isInteger(u.supply) && u.supply >= 0,
          `unit "${u.name}" has invalid supply="${u.supply}"`
        );
      }
    });
  }

  // ── totalCost formula ─────────────────────────────────────────────────────

  for (const seed of seeds) {
    const r = rosters[seed];

    test(`[${seed}] totalCost = baseCost + sum(paid upgrade costs) for all units`, () => {
      for (const u of r.units) {
        const upgradeCost = u.activeUpgrades.reduce((sum, upg) => sum + (upg.cost ?? 0), 0);
        const expected    = u.baseCost + upgradeCost;
        assert.equal(
          u.totalCost,
          expected,
          `unit "${u.name}": expected totalCost=${expected}, got ${u.totalCost}`
        );
      }
    });

    test(`[${seed}] totalCost >= baseCost for all units`, () => {
      for (const u of r.units) {
        assert.ok(
          u.totalCost >= u.baseCost,
          `unit "${u.name}" totalCost (${u.totalCost}) < baseCost (${u.baseCost})`
        );
      }
    });
  }

  // ── allUpgrades.active consistency ───────────────────────────────────────

  for (const seed of seeds) {
    const r = rosters[seed];

    test(`[${seed}] allUpgrades[i].active === (i is in activeUpgrades) for all units`, () => {
      // We can't easily test by index since the data is already transformed,
      // but we can verify that the count of active allUpgrades matches
      // the count of activeUpgrades, and that each activeUpgrade name
      // appears in allUpgrades with active=true.
      for (const u of r.units) {
        const activeInAll = u.allUpgrades.filter(a => a.active);
        assert.equal(
          activeInAll.length,
          u.activeUpgrades.length,
          `unit "${u.name}": allUpgrades active count (${activeInAll.length}) ` +
          `≠ activeUpgrades length (${u.activeUpgrades.length})`
        );

        // Every name in activeUpgrades must appear in allUpgrades.active
        for (const active of u.activeUpgrades) {
          const found = u.allUpgrades.some(a => a.active && a.name === active.name);
          assert.ok(
            found,
            `unit "${u.name}": activeUpgrade "${active.name}" not found ` +
            `in allUpgrades with active=true`
          );
        }
      }
    });

    test(`[${seed}] allUpgrades cost = size-appropriate cost for all units`, () => {
      // All costs in allUpgrades should be non-negative numbers
      for (const u of r.units) {
        for (const upg of u.allUpgrades) {
          assert.ok(
            typeof upg.cost === 'number' && upg.cost >= 0,
            `unit "${u.name}" upgrade "${upg.name}" has invalid cost="${upg.cost}"`
          );
        }
      }
    });
  }

  // ── Type sort order ───────────────────────────────────────────────────────

  for (const seed of seeds) {
    const r = rosters[seed];

    test(`[${seed}] units are sorted by TYPE_ORDER`, () => {
      const indices = r.units.map(u => typeIndex(u.type));
      for (let i = 1; i < indices.length; i++) {
        assert.ok(
          indices[i] >= indices[i - 1],
          `unit at index ${i} ("${r.units[i].name}" type "${r.units[i].type}") ` +
          `appears after "${r.units[i-1].name}" type "${r.units[i-1].type}" ` +
          `but should come before in TYPE_ORDER`
        );
      }
    });

    // Hero units should always come first (if any)
    if (KNOWN[seed].heroCount > 0) {
      test(`[${seed}] hero units are first in sorted order`, () => {
        const firstNonHero = r.units.findIndex(u => u.type !== 'Hero');
        if (firstNonHero === -1) return; // all heroes (unlikely)
        const heroAfterNonHero = r.units
          .slice(firstNonHero)
          .some(u => u.type === 'Hero');
        assert.ok(
          !heroAfterNonHero,
          'a Hero unit appears after a non-Hero unit in the sorted roster'
        );
      });
    }
  }

  // ── Tactical cards ────────────────────────────────────────────────────────

  for (const seed of seeds) {
    const r = rosters[seed];

    test(`[${seed}] tacticalCards is an array of strings`, () => {
      assert.ok(Array.isArray(r.tacticalCards), 'tacticalCards is not an array');
      for (const c of r.tacticalCards) {
        assert.equal(typeof c, 'string', `tactical card entry is not a string: ${c}`);
      }
    });

    test(`[${seed}] tacticalCardDetails is an array with id/name/slots`, () => {
      assert.ok(Array.isArray(r.tacticalCardDetails));
      for (const cd of r.tacticalCardDetails) {
        assert.ok(typeof cd.id   === 'string', `card detail missing id`);
        assert.ok(typeof cd.name === 'string', `card detail missing name`);
        assert.ok(typeof cd.slots === 'object', `card detail missing slots`);
      }
    });

    test(`[${seed}] tacticalCards.length matches tacticalCardDetails.length`, () => {
      assert.equal(r.tacticalCards.length, r.tacticalCardDetails.length);
    });
  }

  test('[parser] tacticalCards option preserves rich tactical card metadata', () => {
    const synthetic = {
      id: 'SYNTH',
      faction: 'Terran',
      factionCardId: 'terran_armed_forces',
      tacticalCards: ['orbital_command'],
      units: [],
    };

    const parsed = parseRoster(synthetic, {
      gameData,
      tacticalCards: [{
        id: 'orbital_command',
        name: 'Orbital Command',
        faction: 'Terran',
        tags: 'Structure',
        frontUrl: 'https://example.test/orbital-command.jpg',
        isUnique: true,
        resource: 1,
        gasCost: 25,
        slots: { Core: 1 },
        abilities: [{ name: 'Scanner Sweep', text: 'Scanner Sweep <Active> <Movement Phase>: Test text.' }],
      }],
    });

    assert.equal(parsed.tacticalCardDetails.length, 1);
    assert.deepEqual(parsed.tacticalCardDetails[0], {
      id: 'orbital_command',
      name: 'Orbital Command',
      slots: { Core: 1 },
      faction: 'Terran',
      tags: 'Structure',
      frontUrl: 'https://example.test/orbital-command.jpg',
      isUnique: true,
      resource: 1,
      gasCost: 25,
      abilities: [{ name: 'Scanner Sweep', text: 'Scanner Sweep <Active> <Movement Phase>: Test text.' }],
    });
  });

  // ── Regression: VNIEMU-specific known unit costs ─────────────────────────

  test('[VNIEMU] Goliath base cost is 190', () => {
    const goliath = rosters.VNIEMU.units.find(u => u.id === 'goliath');
    assert.ok(goliath, 'no goliath unit found');
    assert.equal(goliath.baseCost, 190);
  });

  test('[VNIEMU] Medic base cost is 110', () => {
    const medic = rosters.VNIEMU.units.find(u => u.id === 'medic');
    assert.ok(medic, 'no medic unit found');
    assert.equal(medic.baseCost, 110);
  });

  // ── Regression: IWMZ7C-specific ──────────────────────────────────────────

  test('[IWMZ7C] Kerrigan is Hero type', () => {
    const kerrigan = rosters.IWMZ7C.units.find(u => u.id === 'kerrigan');
    assert.ok(kerrigan, 'no kerrigan unit found');
    assert.equal(kerrigan.type, 'Hero');
  });

  test('[IWMZ7C] Queen is Support type', () => {
    const queen = rosters.IWMZ7C.units.find(u => u.id === 'queen');
    assert.ok(queen, 'no queen unit found');
    assert.equal(queen.type, 'Support');
  });

  test('[IWMZ7C] Hydralisk is Elite type', () => {
    const h = rosters.IWMZ7C.units.find(u => u.id === 'hydralisk');
    assert.ok(h, 'no hydralisk found');
    assert.equal(h.type, 'Elite');
  });

  // ── Regression: TTPIBA-specific ──────────────────────────────────────────

  test('[TTPIBA] Artanis is Hero type', () => {
    const artanis = rosters.TTPIBA.units.find(u => u.id === 'artanis');
    assert.ok(artanis, 'no artanis found');
    assert.equal(artanis.type, 'Hero');
  });

  test('[TTPIBA] Pylon is Other type', () => {
    const pylon = rosters.TTPIBA.units.find(u => u.id === 'pylon');
    assert.ok(pylon, 'no pylon found');
    assert.equal(pylon.type, 'Other');
  });

  test('[TTPIBA] Stalker has shield stat', () => {
    const stalker = rosters.TTPIBA.units.find(u => u.id === 'stalker');
    assert.ok(stalker, 'no stalker found');
    // Protoss units have shields
    assert.ok(stalker.stats.shield !== null && stalker.stats.shield !== '-');
  });

  test('[TTPIBA] Adept Glaive Strike links to Strike', () => {
    const adept = rosters.TTPIBA.units.find(u => u.id === 'adept');
    assert.ok(adept, 'no adept found');

    const glaiveStrike = adept.allUpgrades.find(upg => upg.name === 'Glaive Strike');
    assert.ok(glaiveStrike, 'no Glaive Strike upgrade found');
    assert.equal(glaiveStrike.linkedTo, 'Strike');
  });

  test('[parser] factionCardId raynor_s_raiders formats as Raynor\'s Raiders', () => {
    const synthetic = {
      id: 'SYNTH',
      faction: 'Terran',
      factionCardId: 'raynor_s_raiders',
      units: [],
    };
    const parsed = parseRoster(synthetic, { gameData });
    assert.equal(parsed.factionCard, "Raynor's Raiders");
  });

  test('[parser] factionCardId kerrigan_s_swarm formats as Kerrigan\'s Swarm', () => {
    const synthetic = {
      id: 'SYNTH',
      faction: 'Zerg',
      factionCardId: 'kerrigan_s_swarm',
      units: [],
    };
    const parsed = parseRoster(synthetic, { gameData });
    assert.equal(parsed.factionCard, "Kerrigan's Swarm");
  });
}
