/**
 * /roster slash command.
 * Looks up a StarCraft TMG army list by seed code and posts a compact
 * ANSI-coloured summary within Discord's 2000-character message limit.
 */
import { SlashCommandBuilder } from 'discord.js';
import { fetchRoster, fetchTacticalCards }   from '../../lib/firestoreClient.js';
import { parseRoster }   from '../../lib/rosterParser.js';
import { formatCompact } from '../../lib/formatter.js';

export const rosterCommand = {
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('Display a StarCraft TMG army list from a seed code')
    .addStringOption(opt =>
      opt.setName('seed')
        .setDescription('The roster seed code shown in the Army Builder (e.g. TRN9X2)')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(10)
    )
    .addBooleanOption(opt =>
      opt.setName('plain')
        .setDescription('Use plain text with no ANSI colouring (default: false)')
    )
    .addBooleanOption(opt =>
      opt.setName('stats')
        .setDescription('Include unit stats (HP, Armor, Evade, Speed) (default: false)')
    )
    .addBooleanOption(opt =>
      opt.setName('abbr_upgrades')
        .setDescription('Inline paid upgrades as abbreviations (e.g. {HB, BA, TC})')
    )
    .addBooleanOption(opt =>
      opt.setName('tact_per_line')
        .setDescription('Show tactical cards one per line')
    )
    .addBooleanOption(opt =>
      opt.setName('abbr_tact')
        .setDescription('Abbreviate tactical card names')
    )
    .addBooleanOption(opt =>
      opt.setName('tact_supply')
        .setDescription('Show tactical supply types per card (e.g. [S+2])')
    )
    .addBooleanOption(opt =>
      opt.setName('slot_breakdown')
        .setDescription('Move supply to its own line with slot used/total breakdown')
    ),

  async execute(interaction) {
    // Defer so we have up to 15 minutes to fetch + respond.
    await interaction.deferReply();

    const rawSeed  = interaction.options.getString('seed', true);
    const plain    = interaction.options.getBoolean('plain') ?? false;
    const showStats = interaction.options.getBoolean('stats') ?? false;
    const abbreviateUpgrades = interaction.options.getBoolean('abbr_upgrades') ?? false;
    const tacticalPerLine = interaction.options.getBoolean('tact_per_line') ?? false;
    const abbreviateTacticalCards = interaction.options.getBoolean('abbr_tact') ?? false;
    const showTacticalSupplyTypes = interaction.options.getBoolean('tact_supply') ?? false;
    const showSlotBreakdown = interaction.options.getBoolean('slot_breakdown') ?? false;

    try {
      const flat   = await fetchRoster(rawSeed);
      const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
      const roster = parseRoster(flat, { tacticalCards });
      const output = formatCompact(roster, {
        plain,
        showStats,
        abbreviateUpgrades,
        tacticalPerLine,
        abbreviateTacticalCards,
        showTacticalSupplyTypes,
        showSlotBreakdown,
        charLimit: 2000,
      });
      await interaction.editReply(output);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('NOT_FOUND')) {
        await interaction.editReply(
          `❌ No roster found with seed **${rawSeed.trim().toUpperCase()}**.\n` +
          `Check that the seed is correct and the list has been saved in the Army Builder.`
        );
      } else {
        console.error('Roster fetch error:', err);
        await interaction.editReply('❌ Could not load the roster. Please try again later.');
      }
    }
  },
};
