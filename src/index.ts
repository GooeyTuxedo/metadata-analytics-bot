import fs from 'node:fs';
import path from 'node:path';
import { CronJob } from 'cron';
import * as dotenv from 'dotenv';
dotenv.config();

import { GatewayIntentBits } from 'discord.js';
import { DiscordClient } from './discordClient';
import { doUpdate } from './database';

const token = process.env.DISCORD_TOKEN

const client = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

console.log('Booting up discord bot')

// Log in to Discord with your client's token after db has been initalized
doUpdate()
  .then(async () => {
    await client.login(token)
      .catch(err => console.log(`Error logging into discord! ${err}`))
  })
  .then(() => new CronJob({
    cronTime: `*/15 * * * *`,
    onTick: doUpdate,
    start: true
  }));