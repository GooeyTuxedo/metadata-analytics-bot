import { Client, Collection } from "discord.js";

export class DiscordClient extends Client {
  public commands: Collection<string, any> = new Collection();
}