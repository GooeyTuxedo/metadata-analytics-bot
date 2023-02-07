import { Events } from "discord.js";
import { DiscordClient } from "../discordClient";

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: DiscordClient) {
    if (client.user) return console.log(`Ready! Logged in as ${client.user.tag}`);
  }
};