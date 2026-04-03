/**
 * Register (or update) the bot's slash commands with Discord.
 *
 * Guild commands (DISCORD_GUILD_ID set): update instantly — use during development.
 * Global commands (no DISCORD_GUILD_ID): propagate within ~1 hour — use for production.
 *
 * Run with: node bot/deploy-commands.js
 */
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { rosterCommand } from './commands/roster.js';
import { rosterUiCommand } from './commands/roster-ui.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('❌  Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const commands = [rosterCommand.data.toJSON(), rosterUiCommand.data.toJSON()];
const rest     = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} command(s)…`);

    let data;
    if (DISCORD_GUILD_ID) {
      // Instant guild-scoped deployment (development)
      data = await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: commands }
      );
      console.log(`✅  Registered ${data.length} guild command(s) → guild ${DISCORD_GUILD_ID}`);
    } else {
      // Global deployment (production, up to 1 h to propagate)
      data = await rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(`✅  Registered ${data.length} global command(s)`);
    }
  } catch (err) {
    console.error('❌  Failed to register commands:', err);
    process.exit(1);
  }
})();
