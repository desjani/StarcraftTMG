/**
 * StarCraft TMG Discord Bot — entry point.
 * Run with: node bot/bot.js
 * Requires: DISCORD_TOKEN in .env
 */
import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { rosterCommand } from './commands/roster.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register commands
client.commands = new Collection();
client.commands.set(rosterCommand.data.name, rosterCommand);

client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`   Commands: ${[...client.commands.keys()].join(', ')}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const errReply = { content: '❌ An unexpected error occurred.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errReply).catch(() => {});
    } else {
      await interaction.reply(errReply).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
