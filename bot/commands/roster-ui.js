/**
 * /roster_ui slash command.
 * Ephemeral interactive UI that mirrors website Discord-tab and roster-card options.
 */
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

import { fetchRoster, fetchTacticalCards } from '../../lib/firestoreClient.js';
import { parseRoster } from '../../lib/rosterParser.js';
import { formatCompact } from '../../lib/formatter.js';

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map();

const DISCORD_OPTION_DEFS = [
  { key: 'plain', value: 'plain', label: 'Plain Text', description: 'Disable ANSI colors' },
  { key: 'stats', value: 'stats', label: 'Unit Stats', description: 'Show HP/armor/evade/speed' },
  { key: 'abbr', value: 'abbr', label: 'Abbreviate Upgrades', description: 'Render upgrades inline as abbreviations' },
  { key: 'tactLine', value: 'tactLine', label: 'Tactical Per Line', description: 'One tactical card per line' },
  { key: 'tactAbbr', value: 'tactAbbr', label: 'Abbreviate Tactical', description: 'Short tactical card names' },
  { key: 'tactSupply', value: 'tactSupply', label: 'Tactical Supply Types', description: 'Show tactical supply slots' },
  { key: 'tactResource', value: 'tactResource', label: 'Tactical Resource Cost', description: 'Show tactical resource costs' },
  { key: 'tactGas', value: 'tactGas', label: 'Tactical Gas Cost', description: 'Show tactical gas costs' },
  { key: 'slotBreakdown', value: 'slotBreakdown', label: 'Slot Breakdown', description: 'Separate supply + slot totals line' },
];

const CARD_OPTION_DEFS = [
  { key: 'upgrades', value: 'upgrades', label: 'Show Upgrades', description: 'Display paid upgrades on card' },
  { key: 'stats', value: 'stats', label: 'Show Stats', description: 'Display unit stats on card' },
  { key: 'size', value: 'size', label: 'Show Unit Size', description: 'Display model count / size' },
  { key: 'cost', value: 'cost', label: 'Show Unit Cost', description: 'Display unit costs' },
  { key: 'tactical', value: 'tactical', label: 'Show Tactical', description: 'Display tactical card section' },
  { key: 'tactResource', value: 'tactResource', label: 'Tactical Resource Cost', description: 'Show tactical resource costs' },
  { key: 'tactGas', value: 'tactGas', label: 'Tactical Gas Cost', description: 'Show tactical gas costs' },
  { key: 'tactSupply', value: 'tactSupply', label: 'Tactical Supply Types', description: 'Show tactical supply slots' },
  { key: 'slots', value: 'slots', label: 'Show Slot Breakdown', description: 'Display slot used/total values' },
];

const LIMIT_STEPS = [1200, 1500, 1800, 2000];

function now() {
  return Date.now();
}

function cleanSessions() {
  const cutoff = now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff) sessions.delete(id);
  }
}

function createSession({ userId, seed, roster }) {
  cleanSessions();
  const id = `${now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const session = {
    id,
    userId,
    seed,
    roster,
    mode: 'discord',
    discord: {
      plain: false,
      stats: false,
      abbr: false,
      tactLine: false,
      tactAbbr: false,
      tactSupply: false,
      tactResource: false,
      tactGas: false,
      slotBreakdown: false,
      limit: 2000,
    },
    card: {
      upgrades: true,
      stats: false,
      size: true,
      cost: true,
      tactical: true,
      tactResource: false,
      tactGas: false,
      tactSupply: false,
      slots: false,
    },
    updatedAt: now(),
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  cleanSessions();
  const session = sessions.get(id);
  if (session) session.updatedAt = now();
  return session;
}

function requireSessionOwnership(interaction, session) {
  if (!session) {
    return 'This preview session expired. Run /roster_ui again.';
  }
  if (interaction.user.id !== session.userId) {
    return 'This preview belongs to another user.';
  }
  return null;
}

function nextLimit(current) {
  const idx = LIMIT_STEPS.indexOf(current);
  if (idx === -1 || idx === LIMIT_STEPS.length - 1) return LIMIT_STEPS[0];
  return LIMIT_STEPS[idx + 1];
}

function buildDiscordOutput(session) {
  return formatCompact(session.roster, {
    plain: session.discord.plain,
    showStats: session.discord.stats,
    abbreviateUpgrades: session.discord.abbr,
    tacticalPerLine: session.discord.tactLine,
    abbreviateTacticalCards: session.discord.tactAbbr,
    showTacticalSupplyTypes: session.discord.tactSupply,
    showTacticalResourceCosts: session.discord.tactResource,
    showTacticalGasCosts: session.discord.tactGas,
    showSlotBreakdown: session.discord.slotBreakdown,
    charLimit: session.discord.limit,
  });
}

function buildCardQuery(session) {
  const qs = new URLSearchParams();
  qs.set('upgrades', session.card.upgrades ? '1' : '0');
  qs.set('stats', session.card.stats ? '1' : '0');
  qs.set('size', session.card.size ? '1' : '0');
  qs.set('cost', session.card.cost ? '1' : '0');
  qs.set('tactical', session.card.tactical ? '1' : '0');
  qs.set('tact-resource', session.card.tactResource ? '1' : '0');
  qs.set('tact-gas', session.card.tactGas ? '1' : '0');
  qs.set('tact-supply', session.card.tactSupply ? '1' : '0');
  qs.set('slots', session.card.slots ? '1' : '0');
  return qs;
}

async function fetchCardAttachment(session) {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const qs = buildCardQuery(session);
  const url = `http://127.0.0.1:${port}/api/card/${encodeURIComponent(session.seed)}.png?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Card preview failed (${res.status}): ${msg}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return new AttachmentBuilder(buffer, { name: `${session.seed}.png` });
}

function summarizeEnabled(session) {
  if (session.mode === 'discord') {
    const on = DISCORD_OPTION_DEFS.filter(def => session.discord[def.key]).map(def => def.label);
    return on.length ? on.join(', ') : 'none';
  }
  const on = CARD_OPTION_DEFS.filter(def => session.card[def.key]).map(def => def.label);
  return on.length ? on.join(', ') : 'none';
}

function buildComponents(session) {
  const modeRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`roi:mode:${session.id}`)
      .setPlaceholder(`Mode: ${session.mode === 'discord' ? 'Discord Preview' : 'Roster Card'}`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: 'Discord Preview',
          description: 'Mirror Discord-tab output options',
          value: 'discord',
          default: session.mode === 'discord',
        },
        {
          label: 'Roster Card Preview',
          description: 'Mirror roster-card tab image options',
          value: 'card',
          default: session.mode === 'card',
        },
      ])
  );

  const defs = session.mode === 'discord' ? DISCORD_OPTION_DEFS : CARD_OPTION_DEFS;
  const selected = defs.filter(def => (session.mode === 'discord' ? session.discord[def.key] : session.card[def.key])).map(def => def.value);
  const optionsRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`roi:opts:${session.id}`)
      .setPlaceholder('Toggle preview options')
      .setMinValues(0)
      .setMaxValues(defs.length)
      .addOptions(
        defs.map(def => ({
          label: def.label,
          description: def.description,
          value: def.value,
          default: selected.includes(def.value),
        }))
      )
  );

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`roi:publish:${session.id}`)
      .setStyle(ButtonStyle.Success)
      .setLabel(session.mode === 'discord' ? 'Post Text To Channel' : 'Post Card To Channel'),
    new ButtonBuilder()
      .setCustomId(`roi:limit:${session.id}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel(`Limit ${session.discord.limit}`)
      .setDisabled(session.mode !== 'discord'),
    new ButtonBuilder()
      .setCustomId(`roi:close:${session.id}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel('Close')
  );

  return [modeRow, optionsRow, actionRow];
}

async function renderSessionReply(interaction, session) {
  const components = buildComponents(session);

  if (session.mode === 'discord') {
    const output = buildDiscordOutput(session);
    const header = `Seed: ${session.seed} | Mode: Discord | Enabled: ${summarizeEnabled(session)} | Limit: ${session.discord.limit}`;
    const content = `${header}\n${output}`;
    return interaction.editReply({ content, files: [], components });
  }

  const attachment = await fetchCardAttachment(session);
  const content = `Seed: ${session.seed} | Mode: Roster Card | Enabled: ${summarizeEnabled(session)}`;
  return interaction.editReply({ content, files: [attachment], components });
}

function parseCustomId(customId) {
  const [prefix, action, sessionId] = String(customId || '').split(':');
  if (prefix !== 'roi' || !action || !sessionId) return null;
  return { action, sessionId };
}

export const rosterUiCommand = {
  data: new SlashCommandBuilder()
    .setName('roster_ui')
    .setDescription('Interactive ephemeral roster preview with Discord/card options')
    .addStringOption(opt =>
      opt.setName('seed')
        .setDescription('The roster seed code (e.g. VNIEMU)')
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(10)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const seed = interaction.options.getString('seed', true).trim().toUpperCase();

    try {
      const flat = await fetchRoster(seed);
      const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
      const roster = parseRoster(flat, { tacticalCards });
      const session = createSession({ userId: interaction.user.id, seed, roster });
      await renderSessionReply(interaction, session);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('NOT_FOUND')) {
        await interaction.editReply(`No roster found with seed ${seed}.`);
        return;
      }
      console.error('roster_ui execute failed:', err);
      await interaction.editReply(`Failed to load seed ${seed}: ${err.message}`);
    }
  },

  canHandleComponent(interaction) {
    return Boolean(parseCustomId(interaction.customId));
  },

  async handleComponent(interaction) {
    const parsed = parseCustomId(interaction.customId);
    if (!parsed) return false;

    const session = getSession(parsed.sessionId);
    const ownershipError = requireSessionOwnership(interaction, session);
    if (ownershipError) {
      await interaction.reply({ content: ownershipError, ephemeral: true }).catch(() => {});
      return true;
    }

    try {
      if (parsed.action === 'mode' && interaction.isStringSelectMenu()) {
        await interaction.deferUpdate();
        session.mode = interaction.values[0] === 'card' ? 'card' : 'discord';
        await renderSessionReply(interaction, session);
        return true;
      }

      if (parsed.action === 'opts' && interaction.isStringSelectMenu()) {
        await interaction.deferUpdate();
        const selected = new Set(interaction.values);
        const defs = session.mode === 'discord' ? DISCORD_OPTION_DEFS : CARD_OPTION_DEFS;
        if (session.mode === 'discord') {
          for (const def of defs) session.discord[def.key] = selected.has(def.value);
        } else {
          for (const def of defs) session.card[def.key] = selected.has(def.value);
        }
        await renderSessionReply(interaction, session);
        return true;
      }

      if (parsed.action === 'limit' && interaction.isButton()) {
        await interaction.deferUpdate();
        session.discord.limit = nextLimit(session.discord.limit);
        await renderSessionReply(interaction, session);
        return true;
      }

      if (parsed.action === 'publish' && interaction.isButton()) {
        await interaction.deferUpdate();
        if (session.mode === 'discord') {
          const output = buildDiscordOutput(session);
          await interaction.followUp({
            content: `${output}\nRequested by <@${interaction.user.id}>`,
            ephemeral: false,
            allowedMentions: { users: [interaction.user.id] },
          });
        } else {
          const attachment = await fetchCardAttachment(session);
          await interaction.followUp({
            content: `Roster card for ${session.seed} (requested by <@${interaction.user.id}>)`,
            files: [attachment],
            ephemeral: false,
            allowedMentions: { users: [interaction.user.id] },
          });
        }
        await interaction.followUp({ content: 'Posted to channel.', ephemeral: true });
        return true;
      }

      if (parsed.action === 'close' && interaction.isButton()) {
        await interaction.deferUpdate();
        sessions.delete(session.id);
        await interaction.editReply({ content: 'Preview closed.', files: [], components: [] });
        return true;
      }
    } catch (err) {
      console.error('roster_ui component failed:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `Interaction failed: ${err.message}`, ephemeral: true }).catch(() => {});
      } else {
        await interaction.followUp({ content: `Interaction failed: ${err.message}`, ephemeral: true }).catch(() => {});
      }
      return true;
    }

    return false;
  },
};
