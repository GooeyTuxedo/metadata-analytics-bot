import * as dotenv from 'dotenv';
dotenv.config();
import { ApplicationCommand, REST, Routes } from 'discord.js';

const clientId = process.env.DISCORD_CLIENT || "";
const token = process.env.DISCORD_TOKEN || "";

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started destroying application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: [] },
		) as ApplicationCommand[];

		console.log(`Successfully destroyed application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();