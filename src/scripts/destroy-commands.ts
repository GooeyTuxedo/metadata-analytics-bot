import * as dotenv from 'dotenv';
dotenv.config();
import { ApplicationCommand, REST, Routes } from 'discord.js';

const clientId = process.env.DISCORD_CLIENT || "";
const token = process.env.DISCORD_TOKEN || "";

const [ guildId ] = process.argv.slice(2);

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		if (guildId) {
			console.log(`Started destroying guild (/) commands.`);

			await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: [] },
			) as ApplicationCommand[];

			console.log(`Successfully destroyed guild (/) commands.`);
		} else {
			console.log(`Started destroying global application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			await rest.put(
				Routes.applicationCommands(clientId),
				{ body: [] },
			) as ApplicationCommand[];

			console.log(`Successfully destroyed global application (/) commands.`);
		}
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();