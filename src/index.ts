import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
dotenv.config();

import { GatewayIntentBits } from 'discord.js';
import { DiscordClient } from './discordClient';
import { doUpdate, doUpdateLoop } from './database';
import redisClient from './redis';
import { getLivingTokenSupply, sleep } from './utility';

const token = process.env.DISCORD_TOKEN

const client = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const updateStatus = async () => {
  if (client.user) client.user.setActivity(`living tokens: ${await getLivingTokenSupply()}`)
}
const updateStatusLoop = async () => {
  await sleep(3600000);
  updateStatus().then(() => updateStatusLoop());
}

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

doUpdate()
  .then(async () => {
    await client.login(token)
      .then(() => updateStatus())
      .catch(err => console.log(`Error logging into discord! ${err}`))
  })
  .then(() => {
    updateStatusLoop();
    doUpdateLoop();
  })
  .finally(async () => {
    // Disconnect from redis
    await redisClient.disconnect();
  })