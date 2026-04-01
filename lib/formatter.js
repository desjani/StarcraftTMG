/**
 * Formatter for StarCraft TMG army rosters.
 * Produces Discord-ready ANSI code blocks (```ansi) or plain text (```),
 * with automatic fallback to stay within the Discord character limit.
 */

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const ESC   = '\u001b';
const RESET = `${ESC}[0m`;

/** Build an ANSI escape sequence from one or more SGR codes. */
function ansi(...codes) { return `${ESC}[${codes.join(';')}m`; }

// Pre-built colour sequences (Discord ```ansi renders standard 3/4-bit ANSI).
const C = {
  gray:        ansi(30),
  red:         ansi(31),
  green:       ansi(32),
  yellow:      ansi(33),
  blue:        ansi(34),
  magenta:     ansi(35),
  cyan:        ansi(36),
  white:       ansi(37),
  boldBlue:    ansi(1, 34),
  boldCyan:    ansi(1, 36),
  boldMagenta: ansi(1, 35),
  boldYellow:  ansi(1, 33),
  boldWhite:   ansi(1, 37),
};

// ─── Colour palettes (per faction) ───────────────────────────────────────────

/** { header, accent, cost, upgrade, seed } */
const PALETTES = {
  Terran:  { header: C.boldBlue,    accent: C.blue,    cost: C.yellow, upgrade: C.green, seed: C.gray },
  Protoss: { header: C.boldCyan,    accent: C.cyan,    cost: C.yellow, upgrade: C.green, seed: C.gray },
  Zerg:    { header: C.boldMagenta, accent: C.magenta, cost: C.yellow, upgrade: C.green, seed: C.gray },
};
const FALLBACK_PAL = { header: C.boldWhite, accent: C.cyan, cost: C.yellow, upgrade: C.green, seed: C.gray };

// ─── Unit type metadata ───────────────────────────────────────────────────────

const TYPE_ABBR  = { Hero: 'H', Core: 'C', Elite: 'E', Support: 'S', Air: 'A', Other: 'O' };
const TYPE_ORDER = ['Hero', 'Core', 'Elite', 'Support', 'Air', 'Other'];

function compareText(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' });
}

function compareUpgradesForDisplay(a, b) {
  const costDiff = Number(b?.cost ?? 0) - Number(a?.cost ?? 0);
  if (costDiff !== 0) return costDiff;
  return compareText(a?.name, b?.name);
}

function normalizeRosterForOutput(roster) {
  const normalized = JSON.parse(JSON.stringify(roster));

  normalized.tacticalCards = Array.isArray(normalized.tacticalCards)
    ? [...normalized.tacticalCards].sort(compareText)
    : [];

  normalized.tacticalCardDetails = Array.isArray(normalized.tacticalCardDetails)
    ? [...normalized.tacticalCardDetails].sort((a, b) => compareText(a?.name, b?.name))
    : [];

  normalized.units = Array.isArray(normalized.units)
    ? normalized.units.map(u => ({
      ...u,
      activeUpgrades: Array.isArray(u.activeUpgrades)
        ? [...u.activeUpgrades].sort(compareUpgradesForDisplay)
        : [],
      allUpgrades: Array.isArray(u.allUpgrades)
        ? [...u.allUpgrades].sort(compareUpgradesForDisplay)
        : [],
    }))
    : [];

  return normalized;
}

const RESOURCE_SHORT = {
  Terran: 'cp',
  Zerg: 'bm',
  Protoss: 'pe',
};

/** Bracket colour for each unit type ([H], [C], etc.) */
const TYPE_COLOR = {
  Hero:    C.boldYellow,
  Core:    C.white,
  Elite:   C.red,
  Support: C.green,
  Air:     C.cyan,
  Other:   C.gray,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Format a parsed roster as a Discord code block with ANSI colouring (or plain).
 * Automatically degrades if the result exceeds `charLimit`.
 *
 * Degradation order:
 *   1. Full ANSI output with stats + upgrades (per options)
 *   2. No stats
 *   3. No stats, no upgrades
 *   4. Plain text, no stats, no upgrades
 *   5. Bare-minimum plain fallback
 *
 * @param {object}  roster              Output of parseRoster()
 * @param {object}  [options]
 * @param {boolean} [options.plain]      Skip ANSI, use plain ``` block. Default false.
 * @param {boolean} [options.showStats]  Append HP/armor/etc per unit. Default false.
 * @param {boolean} [options.abbreviateUpgrades]  Inline paid upgrades as abbreviations (e.g. {HB, BA}). Default false.
 * @param {boolean} [options.tacticalPerLine]  Render tactical cards one per line. Default false.
 * @param {boolean} [options.abbreviateTacticalCards]  Abbreviate tactical card names. Default false.
 * @param {boolean} [options.showTacticalSupplyTypes]  Show supply types provided by each tactical card. Default false.
 * @param {boolean} [options.showTacticalResourceCosts]  Show tactical card faction-resource value (e.g. 1cp). Default false.
 * @param {boolean} [options.showTacticalGasCosts]  Show tactical card gas cost (e.g. 35g). Default false.
 * @param {boolean} [options.showSlotBreakdown]  Replace inline supply in header with dedicated slot-breakdown line. Default false.
 * @param {number}  [options.charLimit]  Max chars including fence + ANSI. Default 2000.
 * @returns {string}
 */
export function formatCompact(roster, options = {}) {
  const normalizedRoster = normalizeRosterForOutput(roster);
  const {
    plain = false,
    showStats = false,
    abbreviateUpgrades = false,
    tacticalPerLine = false,
    abbreviateTacticalCards = false,
    showTacticalSupplyTypes = false,
    showTacticalResourceCosts = false,
    showTacticalGasCosts = false,
    showSlotBreakdown = false,
    charLimit = 2000,
  } = options;

  const attempts = [
    () => buildOutput(normalizedRoster, plain,    showStats, true,  abbreviateUpgrades, tacticalPerLine, abbreviateTacticalCards, showTacticalSupplyTypes, showTacticalResourceCosts, showTacticalGasCosts, showSlotBreakdown, charLimit),
    () => buildOutput(normalizedRoster, plain,    false,     true,  abbreviateUpgrades, tacticalPerLine, abbreviateTacticalCards, showTacticalSupplyTypes, showTacticalResourceCosts, showTacticalGasCosts, showSlotBreakdown, charLimit),
    () => buildOutput(normalizedRoster, plain,    false,     false, false,              tacticalPerLine, abbreviateTacticalCards, showTacticalSupplyTypes, showTacticalResourceCosts, showTacticalGasCosts, showSlotBreakdown, charLimit),
    () => buildOutput(normalizedRoster, true,     false,     false, false,              tacticalPerLine, abbreviateTacticalCards, showTacticalSupplyTypes, showTacticalResourceCosts, showTacticalGasCosts, showSlotBreakdown, charLimit),
  ];

  for (const attempt of attempts) {
    const result = attempt();
    if (result.length <= charLimit) return result;
  }

  return buildMinimum(normalizedRoster);
}

/**
 * Return the full parsed roster as a formatted JSON string.
 * @param {object} roster
 * @returns {string}
 */
export function formatJson(roster) {
  return JSON.stringify(normalizeRosterForOutput(roster), null, 2);
}

// ─── Internal builders ────────────────────────────────────────────────────────

function buildOutput(roster, plain, showStats, includeUpgrades, abbreviateUpgrades, tacticalPerLine, abbreviateTacticalCards, showTacticalSupplyTypes, showTacticalResourceCosts, showTacticalGasCosts, showSlotBreakdown, _charLimit) {
  const pal = plain ? null : (PALETTES[roster.faction] ?? FALLBACK_PAL);

  /**
   * Wrap text in an ANSI colour sequence, or return plain text if in plain mode.
   * @param {string|null} colorSeq  Pre-built ANSI escape (e.g. C.cyan) or null.
   * @param {string}      text
   */
  function c(colorSeq, text) {
    if (!colorSeq || plain) return text;
    return `${colorSeq}${text}${RESET}`;
  }

  function abbreviateUpgradeName(name) {
    const rawName = String(name || '').trim();
    if (rawName && !/\s/.test(rawName)) {
      const lettersOnly = rawName.replace(/[^A-Za-z]/g, '');
      if (lettersOnly) return lettersOnly.slice(0, 3).toUpperCase();
      return rawName.slice(0, 3).toUpperCase();
    }

    const tokens = rawName
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean);
    if (tokens.length === 0) return '??';
    if (tokens.length === 1) return tokens[0].slice(0, 3).toUpperCase();
    return tokens.map(t => t[0].toUpperCase()).join('');
  }

  function getTacticalSupplyLetters(slots) {
    const ordered = TYPE_ORDER.filter(t => t !== 'Other');
    const extras = Object.keys(slots ?? {}).filter(t => !ordered.includes(t));
    const keys = [...ordered, ...extras];
    const letters = [];
    for (const key of keys) {
      const count = Number(slots?.[key] ?? 0);
      if (count <= 0) continue;
      const letter = TYPE_ABBR[key] ?? key[0]?.toUpperCase() ?? '?';
      for (let i = 0; i < count; i += 1) letters.push({ key, letter });
    }
    return letters;
  }

  function formatTacticalSupplyTypes(slots) {
    const letters = getTacticalSupplyLetters(slots);
    if (letters.length === 0) return '';
    if (plain) return `[${letters.map(entry => entry.letter).join('')}]`;
    const coloredLetters = letters
      .map(entry => c(TYPE_COLOR[entry.key] ?? pal?.accent, entry.letter))
      .join('');
    return `${c(pal?.accent, '[')}${coloredLetters}${c(pal?.accent, ']')}`;
  }

  function formatSlotBreakdown(slots) {
    const ordered = TYPE_ORDER.filter(t => t !== 'Other');
    const extras = Object.keys(slots ?? {}).filter(t => !ordered.includes(t));
    const keys = [...ordered, ...extras];
    return keys
      .filter((k) => {
        const used = Number(slots?.[k]?.used ?? 0);
        const avail = Number(slots?.[k]?.avail ?? 0);
        return used > 0 || avail > 0;
      })
      .map((k) => {
        const used = Number(slots?.[k]?.used ?? 0);
        const avail = Number(slots?.[k]?.avail ?? 0);
        return `${TYPE_ABBR[k] ?? k[0].toUpperCase()}:${used}/${avail}`;
      })
      .join('  ');
  }

  const lines = [];

  // ── Header ──────────────────────────────────────────────────────────────────
  lines.push(c(pal?.header, `══ ${roster.faction.toUpperCase()} · ${roster.factionCard} ══`));

  const { minerals: m, gas: g, supply, resources } = roster;
  const resourceShort = RESOURCE_SHORT[roster.faction] ?? 'res';
  if (showSlotBreakdown) {
    lines.push(c(pal?.accent, `${m.used}/${m.limit}m  ${g.used}/${g.limit}g  ${resources}${resourceShort}`));
    lines.push(c(pal?.accent, `SUP: ${supply}  ${formatSlotBreakdown(roster.slots ?? {})}`));
  } else {
    lines.push(c(pal?.accent, `${m.used}/${m.limit}m  ${g.used}/${g.limit}g  ${supply}sup  ${resources}${resourceShort}`));
  }
  lines.push('');

  // ── Units (grouped by type in canonical order) ───────────────────────────
  const byType = {};
  for (const u of roster.units) {
    const t = u.type || 'Core';
    (byType[t] ??= []).push(u);
  }

  for (const type of TYPE_ORDER) {
    if (!byType[type]) continue;
    for (const u of byType[type]) {
      const abbr     = TYPE_ABBR[type] ?? '?';
      const typeColor = plain ? null : (TYPE_COLOR[type] ?? pal?.accent);
      const prefix    = c(typeColor, `[${abbr}]`);
      const nameStr   = u.models > 1 ? `${u.name} ×${u.models}` : u.name;
      const costStr   = c(pal?.cost, `${u.totalCost}m`);
      const supStr    = u.supply > 0 ? `  ${c(pal?.accent, `${u.supply}◆`)}` : '';
      const paidUpgrades = u.activeUpgrades.filter(upg => upg.cost > 0);

      let unitLine = `${prefix} ${nameStr}`;
      if (includeUpgrades && abbreviateUpgrades && paidUpgrades.length > 0) {
        const upgAbbr = paidUpgrades.map(upg => abbreviateUpgradeName(upg.name)).join(', ');
        unitLine += `  ${c(pal?.upgrade, `{${upgAbbr}}`)}`;
      }
      unitLine += `  ${costStr}${supStr}`;

      lines.push(unitLine);

      // Paid upgrades (cost > 0 means it was a deliberate purchase)
      if (includeUpgrades && !abbreviateUpgrades) {
        for (const upg of paidUpgrades) {
          lines.push(`  ${c(pal?.upgrade, `+ ${upg.name} (${upg.cost}m)`)}`);
        }
      }

      // Optional stats line
      if (showStats) {
        const st = u.stats;
        const statParts = [`HP:${st.hp}`, `ARM:${st.armor}`, `EVD:${st.evade}`, `SPD:${st.speed}`];
        if (st.shield) statParts.push(`SH:${st.shield}`);
        lines.push(`   ${c(pal?.seed, statParts.join(' '))}`);
      }
    }
  }

  // ── Tactical Cards ───────────────────────────────────────────────────────
  if ((roster.tacticalCardDetails?.length ?? roster.tacticalCards.length) > 0) {
    const tacticalCards = roster.tacticalCardDetails?.length
      ? roster.tacticalCardDetails
      : (roster.tacticalCards ?? []).map(name => ({ name, slots: {}, resource: null, gasCost: null }));

    const groupedTacticalCards = [];
    const tacticalByName = new Map();
    for (const card of tacticalCards) {
      const key = String(card.name ?? '');
      const existing = tacticalByName.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      const group = { card, count: 1 };
      tacticalByName.set(key, group);
      groupedTacticalCards.push(group);
    }

    const labelForCard = (card, count = 1) => {
      const baseName = abbreviateTacticalCards ? abbreviateUpgradeName(card.name) : card.name;
      const supply = showTacticalSupplyTypes ? formatTacticalSupplyTypes(card.slots) : '';
      const resourceCost = showTacticalResourceCosts && typeof card.resource === 'number'
        ? `${card.resource}${resourceShort}`
        : '';
      const gasCost = showTacticalGasCosts && typeof card.gasCost === 'number'
        ? `${card.gasCost}g`
        : '';
      const nameLabel = count > 1 ? `${count}x ${baseName}` : baseName;
      const accentLabel = [nameLabel, supply].filter(Boolean).join(' ');
      const detailParts = [];
      if (resourceCost) detailParts.push(c(C.white, resourceCost));
      if (gasCost) detailParts.push(c(pal?.cost ?? C.yellow, gasCost));
      if (detailParts.length === 0) return c(pal?.accent, accentLabel);
      return `${c(pal?.accent, accentLabel)} ${detailParts.join(' ')}`;
    };

    lines.push('');
    if (tacticalPerLine) {
      lines.push(c(pal?.accent, 'TACT:'));
      for (const groupedCard of groupedTacticalCards) {
        lines.push(`  - ${labelForCard(groupedCard.card, groupedCard.count)}`);
      }
    } else {
      lines.push(`${c(pal?.accent, 'TACT:')} ${groupedTacticalCards.map(gc => labelForCard(gc.card, gc.count)).join(' · ')}`);
    }
  }

  // ── Seed footer ─────────────────────────────────────────────────────────
  lines.push('');
  lines.push(c(pal?.seed, `Seed: ${roster.seed}`));

  const fence  = plain ? '```' : '```ansi';
  return `${fence}\n${lines.join('\n')}\n\`\`\``;
}

/** Absolute minimum — pure plain text, no ANSI, no upgrades, no stats. */
function buildMinimum(roster) {
  const { minerals: m, gas: g, supply } = roster;
  const unitLines = roster.units.map(u => {
    const abbr    = TYPE_ABBR[u.type] ?? '?';
    const nameStr = u.models > 1 ? `${u.name} ×${u.models}` : u.name;
    return `[${abbr}] ${nameStr}  ${u.totalCost}m`;
  });
  const lines = [
    `${roster.faction} · ${roster.factionCard}`,
    `${m.used}/${m.limit}m  ${g.used}/${g.limit}g  ${supply}sup`,
    '',
    ...unitLines,
    '',
    `Seed: ${roster.seed}`,
  ];
  return `\`\`\`\n${lines.join('\n')}\n\`\`\``;
}
