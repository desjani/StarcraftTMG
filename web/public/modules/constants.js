/**
 * Application-wide constants shared across all modules.
 * No imports, no side effects — safe to import from anywhere.
 */

// ─── Unit / faction display ───────────────────────────────────────────────────
export const TYPE_ABBR      = { Hero: 'H', Core: 'C', Elite: 'E', Support: 'S', Air: 'A', Other: 'O' };
export const RESOURCE_SHORT = { Terran: 'cp', Zerg: 'bm', Protoss: 'pe' };
export const RESOURCE_ICON  = { Terran: '▣', Zerg: '◉', Protoss: '✦' };

// ─── Phase ordering ───────────────────────────────────────────────────────────
export const PLAY_PHASES = ['Movement', 'Assault', 'Combat', 'Scoring'];

export const PHASE_ORDER = ['Any', 'Movement', 'Assault', 'Combat', 'Scoring', 'Cleanup'];
export const PHASE_TAG   = {
  Any: 'ANY', Movement: 'MOV', Assault: 'ASS',
  Combat: 'COM', Scoring: 'SCO', Cleanup: 'CLN',
};

// ─── localStorage keys + limits ──────────────────────────────────────────────
export const STORAGE_KEY              = 'sctmg.prefs';
export const SEED_HISTORY_KEY         = 'sctmg.seedHistory';
export const PLAY_LIBRARY_KEY         = 'sctmg.playLibrary.v1';
export const CLOUD_IMPORT_PROMPT_PREFIX = 'sctmg.cloudImportPrompt.v1.';

export const MAX_RECENT_SEEDS   = 10;
export const MAX_COMPLETED_GAMES = 25;
