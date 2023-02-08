import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, APIEmbedField, APIEmbed } from 'discord.js';

import { fetchTokenCollection, fetchSnapshotTimestamp } from '../utility';
import { Gooey } from '../../types/gooey';
import {
  findAndSortByETHGobbled,
  findAndSortByMitosisCredits,
  findAndSortByNumberOfOffspring,
  findExtinctBodyTypes,
  findSingletonBodyTypes,
  findUnburiedDead
} from '../transformations';

const mkUnburiedEmbed = (list: number[]) =>
  new EmbedBuilder()
    .setTitle(`${list.length} unburied Gooeys with 0 health`)
    .setDescription(list.join(' '))
    .setThumbnail('https://ethgobblers.com/bury-icon.svg');

const mkEthLeaderboardEmbed = (list: Gooey[]) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by ETH Gobbled`)
    .addFields(...list.map(({name, ethGobbled}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${ethGobbled} ETH`,
      inline: true
    })))
    .setThumbnail('https://ethereum.org/static/655aaefb744ae2f9f818095a436d38b5/e1ebd/eth-diamond-purple-purple.png');

const mkMCLeaderboardEmbed = (list: Gooey[]) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by Mitosis Credits`)
    .addFields(...list.map(({name, mitosisCredits}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${mitosisCredits} MCs`,
      inline: true
    })))

const mkOffspringLeaderboardEmbed = (list: ({ parent: Gooey, children: Gooey[] })[]) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by number of Offspring`)
    .addFields(...list.map(({ parent: {name}, children }, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${children.length} kids`,
      inline: true
    })))

const mkExtinctionEmbed = (list: string[]) =>
    new EmbedBuilder()
      .setTitle(`Found ${list.length} extinct gooey types`)
      .setDescription(list.join('\n'));

const mkSingletonsEmbed = (list: string[]) =>
    new EmbedBuilder()
      .setTitle(`Found ${list.length} singleton gooey bodies`)
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
        .setName('update-db')
        .setDescription('Fetch a new gooey collection snapshot and commit to db'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('unburied')
        .setDescription('Print a list of all Gooeys at zero health that have not been buried'))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('Top 25 gooey leaderboard')
        .addStringOption(option => 
          option.setName('field')
            .setDescription('The field to filter by')
            .setRequired(true)
            .addChoices(
              { name: 'ETHGobbled', value: 'ethGobbled' },
              { name: 'MitosisCredits', value: 'mitosisCredits' },
              { name: 'Offspring', value: 'offspring' }
            )))

    .addSubcommand(subcommand =>
      subcommand
        .setName('extinct-types')
        .setDescription('Print a list of all gooey body types with no living members'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('singletons')
        .setDescription('Print a list of all gooey body types with only 1 gooey left living')),
    

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const gooeys = await fetchTokenCollection()


      if (subcommand == 'updated-at') {
        const rawTimestamp =  await fetchSnapshotTimestamp();
        const snapshotTimestamp = new Date(rawTimestamp);
    
        return await interaction.reply(`Gooey database last updated at ${snapshotTimestamp.toUTCString()}`);

      } else if (subcommand == 'update-db') {
          return await interaction.reply(`TODO: remove, this does nothing`);

      } else if (subcommand == 'unburied') {
        const unburiedDead = findUnburiedDead(gooeys)
        const unburiedEmbed = mkUnburiedEmbed(unburiedDead)

        return await interaction.reply({ embeds: [unburiedEmbed] });

      } else if (subcommand == 'leaderboard') {
        const field = interaction.options.getString('field')

        if (field == 'ethGobbled') {
          const top25ETHGobbled = findAndSortByETHGobbled(gooeys).slice(0, 25);
          const leaderboardEmbed = mkEthLeaderboardEmbed(top25ETHGobbled);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        } else if (field == 'mitosisCredits') {
          const top25MitosisCredits = findAndSortByMitosisCredits(gooeys).slice(0, 25);
          const leaderboardEmbed = mkMCLeaderboardEmbed(top25MitosisCredits);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        } else {
          const top25ByOffspring = findAndSortByNumberOfOffspring(gooeys).slice(0, 25);
          const leaderboardEmbed = mkOffspringLeaderboardEmbed(top25ByOffspring);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        }
      } else if (subcommand == 'extinct-types') {
        const extinctBodyTypes = findExtinctBodyTypes(gooeys);
        const extinctionEmbed = mkExtinctionEmbed(extinctBodyTypes);

        return await interaction.reply({ embeds: [extinctionEmbed] });

      } else if (subcommand == 'singletons') {
        const singletonBodyTypes = findSingletonBodyTypes(gooeys);
        const singletonsEmbed = mkSingletonsEmbed(singletonBodyTypes);

        return await interaction.reply({ embeds: [singletonsEmbed] });
      } else {
        return await interaction.reply(`Could not find command for subcommand "${subcommand}"`);
      }

  }
}
