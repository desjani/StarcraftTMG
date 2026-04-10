/**
 * StarCraft TMG Discord Bot — entry point.
 * Run with: node bot/bot.js
 * Requires: DISCORD_TOKEN in .env
 */
import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { rosterCommand } from './commands/roster-ui.js';

import { REST, Routes } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register commands
client.commands = new Collection();
client.commands.set(rosterCommand.data.name, rosterCommand);

client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`   Commands: ${[...client.commands.keys()].join(', ')}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
    for (const command of client.commands.values()) {
      if (typeof command.canHandleComponent !== 'function') continue;
      if (!command.canHandleComponent(interaction)) continue;
      await command.handleComponent(interaction);
      return;
    }
    return;
  }

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

// On startup, register commands for all existing guilds (fixes old servers)
client.once('ready', async () => {
  const { DISCORD_CLIENT_ID, DISCORD_TOKEN } = process.env;
  if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN) {
    console.error('❌ Missing DISCORD_CLIENT_ID or DISCORD_TOKEN for command registration');
    return;
  }
  const rest = new REST().setToken(DISCORD_TOKEN);
  const commands = [rosterCommand.data.toJSON()];
  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guild.id),
        { body: commands }
      );
      console.log(`✅ Registered commands for existing guild ${guild.id}`);
    } catch (err) {
      console.error(`❌ Failed to register commands for guild ${guild.id}:`, err);
    }
  }
});

// Automatically register commands for new guilds (instant availability)
client.on('guildCreate', async (guild) => {
  const { DISCORD_CLIENT_ID, DISCORD_TOKEN } = process.env;
  if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN) {
    console.error('❌ Missing DISCORD_CLIENT_ID or DISCORD_TOKEN for command registration');
    return;
  }
  const rest = new REST().setToken(DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guild.id),
      { body: [rosterCommand.data.toJSON()] }
    );
    console.log(`✅ Registered commands for guild ${guild.id}`);
  } catch (err) {
    console.error(`❌ Failed to register commands for guild ${guild.id}:`, err);
  }
});
