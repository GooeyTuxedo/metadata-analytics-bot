import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, APIEmbedField, APIEmbed } from 'discord.js';

import { fetchTokenCollection, fetchSnapshotTimestamp } from '../utility';
import { findAndSortByETHGobbled, findExtinctBodyTypes, findUnburiedDead } from '../transformations';
import { Gooey } from '../../types/gooey';

const mkUnburiedEmbed = (list: number[]) =>
  new EmbedBuilder()
    .setTitle(`${list.length} unburied Gooeys with 0 health`)
    .setDescription(list.join(' '))
    .setImage('https://ethgobblers.com/bury-icon.svg');

const mkMCLeaderboardEmbed = (list: Gooey[]) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by ETH Gobbled`)
    .setImage('https://ethereum.org/static/655aaefb744ae2f9f818095a436d38b5/e1ebd/eth-diamond-purple-purple.png')
    .addFields(...list.map(({name, ethGobbled}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${ethGobbled} ETH`,
      inline: true
    })));

const mkExtinctionEmbed = (list: string[]) =>
    new EmbedBuilder()
      .setTitle(`Found ${list.length} extinct gooey types`)
      .setDescription(list.join('\n'));


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
        .setDescription('Print a list of all Gooeys at zero health that have not been buried'))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('Top gooeys by ETHGobbled'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('extinct-types')
        .setDescription('Print a list of all gooey body types with no living members')),
    

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const gooeys = await fetchTokenCollection()


      if (subcommand == 'updated-at') {
        const rawTimestamp =  await fetchSnapshotTimestamp();
        const snapshotTimestamp = new Date(rawTimestamp);
    
        return await interaction.reply(`Gooey database last updated at ${snapshotTimestamp.toUTCString()}`);

      } else if (subcommand == 'unburied') {
        const unburiedDead = findUnburiedDead(gooeys)
        const unburiedEmbed = mkUnburiedEmbed(unburiedDead)

        return await interaction.reply({ embeds: [unburiedEmbed] });

      } else if (subcommand == 'leaderboard') {
        const top25ETHGobbled = findAndSortByETHGobbled(gooeys).slice(0, 24);
        const leaderboardEmbed = mkMCLeaderboardEmbed(top25ETHGobbled);

        return await interaction.reply({ embeds: [leaderboardEmbed] });

      } else if (subcommand == 'extinct-types') {
        const extinctBodyTypes = findExtinctBodyTypes(gooeys);
        const extinctionEmbed = mkExtinctionEmbed(extinctBodyTypes);

        return await interaction.reply({ embeds: [extinctionEmbed] });

      } else {
        return await interaction.reply(`Could not find command for subcommand "${subcommand}"`);
      }

  }
}
