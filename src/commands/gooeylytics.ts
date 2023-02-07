import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

import { fetchTokenCollection, fetchSnapshotTimestamp } from '../utility';
import { findAndSortByETHGobbled, findUnburiedDead } from '../transformations';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gooeylytics')
    .setDescription('Run a query on the gooey-db')

    .addSubcommand(subcommand => 
      subcommand
        .setName('updated-at')
        .setDescription('Print the time of last db update'))

    .addSubcommand(subcommand =>
      subcommand
      .setName('unburied')
      .setDescription('Print a list of all Gooeys at zero HP that have not been buried'))
    
      .addSubcommand(subcommand =>
        subcommand
          .setName('leaderboard')
          .setDescription('Top gooeys by ETHGobbled')),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const gooeys = await fetchTokenCollection()

    switch (subcommand) {
      case 'updated-at':
        const rawTimestamp =  await fetchSnapshotTimestamp();
        const snapshotTimestamp = new Date(rawTimestamp).getDate();
    
        await interaction.reply(`Gooey database last updated at ${snapshotTimestamp}`)
        break;

      case 'unburied':
        const unburiedDead = findUnburiedDead(gooeys)

        await interaction.reply(`Found ${unburiedDead.length} unburied dead \n${unburiedDead}`)
        break;

      case 'leaderboard':
        const top25ETHGobbled = findAndSortByETHGobbled(gooeys).slice(0, 24)
          .map(({tokenID, ethGobbled}) => `#${tokenID}: ${ethGobbled} ETH\n`)

        await interaction.reply(`TOP 25 GOOEY by ETH Gobbled\n${top25ETHGobbled}`)
        break;
  
  
      default:
        await interaction.reply(`Could not find command for subcommand "${subcommand}"`)
        break;
    }
  }

}