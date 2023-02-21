import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, APIEmbedField, APIEmbed, underscore } from 'discord.js';

import { fetchTokenCollection, fetchSnapshotTimestamp } from '../utility';
import { Gooey } from '../../types/gooey';
import {
  findAndSortByETHGobbled,
  findAndSortByMitosisCredits,
  findAndSortByNumberOfOffspring,
  findExtinctBodyTypes,
  findFullGenesisSets,
  findOneOfOnesByGen,
  findPopulationDistribution,
  findSingletonBodyTypes,
  findUnburiedDead
} from '../transformations';

const mkUnburiedEmbed = (list: number[][][], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`${list.reduce(
      (deadCount, gen) => deadCount + gen[1].length
    , 0 as number)} unburied Gooeys with 0 health. ☠️`)
    .setDescription(list.length ? list.map(([[gen], deadGoos]) =>
      `${underscore(`Gen ${gen}:`)}\n${deadGoos.join(', ')}`
    ).join('\n') : 'All gooeys healthy! :tada:')
    .setThumbnail('https://ethgobblers.com/bury-icon.svg')
    .setFooter({text: timeStr});

const mkEthLeaderboardEmbed = (list: Gooey[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by ETH Gobbled 🎨`)
    .addFields(...list.map(({name, ethGobbled}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${ethGobbled} ETH`,
      inline: true
    })))
    .setFooter({text: timeStr});

const mkMCLeaderboardEmbed = (list: Gooey[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Top 25 Gooey Leaderboard by Mitosis Credits 🤰`)
    .addFields(...list.map(({name, mitosisCredits}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${mitosisCredits} MCs`,
      inline: true
    })))
    .setFooter({text: timeStr});

const mkOffspringLeaderboardEmbed =
  (list: ({ parent: Gooey, children: Gooey[] })[], timeStr: string) =>
    new EmbedBuilder()
      .setTitle(`Top 25 Gooey Leaderboard by number of Offspring 👩‍👧‍👧`)
      .addFields(...list.map(({ parent: {name}, children }, i) => ({
        name: `${i + 1}) ${name}`,
        value: `${children.length} kids`,
        inline: true
      })))
      .setFooter({text: timeStr});

const mkExtinctionEmbed = (list: string[], timeStr: string) =>
    new EmbedBuilder()
      .setTitle(`Found ${list.length} extinct gooey types. 🦖`)
      .setDescription(list.sort().join('\n'))
      .setFooter({text: timeStr});

const mkSingletonsEmbed = (list: string[], timeStr: string) =>
    new EmbedBuilder()
      .setTitle(`Found ${list.length} singleton gooey bodies. 🩱`)
      .setDescription(list.sort().join('\n'))
      .setFooter({text: timeStr});

const mkCensusEmbed = (list: string[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Gooey Generation Report 📜`)
    .setDescription(list.join('\n'))
    .setFooter({text: timeStr});

const mkFullSetsEmbed = (list: string[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Found ${list.length} gen 1 body types with all 4 left living`)
    .setDescription(list.sort().join('\n'))
    .setFooter({text: timeStr});

const mkOneOfOnesEmbed = (gen: number, list: string[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`1/1 gooeys in Generation ${gen}`)
    .setDescription(list.sort().join('\n'))
    .setFooter({text: timeStr});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gooey')
    .setDescription('Run a query on the gooey-db')

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
        .setName('extinct')
        .setDescription('Print a list of all gooey body types with no living members'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('full-sets')
        .setDescription('Print a list of genesis body types with all members still living'))

        .addSubcommand(subcommand =>
          subcommand
            .setName('one-of-ones')
            .setDescription('Print a list of 1/1 body types')
            .addStringOption(option => 
              option.setName('generation')
                .setDescription('The generation to print')
                .setRequired(true)
                .addChoices(
                  { name: '2', value: '2' }
                )))

    .addSubcommand(subcommand =>
      subcommand
        .setName('singles')
        .setDescription('Print a list of all gooey body types with only 1 gooey left living'))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Print a report of the living and dead gooeys by generation')),
    

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const gooeys = await fetchTokenCollection()
    const rawTimestamp =  await fetchSnapshotTimestamp();
    const snapshotTimestampStr = `Gooey database last updated at ${new Date(rawTimestamp).toUTCString()}`;


      if (subcommand == 'unburied') {
        const unburiedDead = findUnburiedDead(gooeys)
        const unburiedEmbed = mkUnburiedEmbed(unburiedDead, snapshotTimestampStr)

        return await interaction.reply({ embeds: [unburiedEmbed] });

      } else if (subcommand == 'leaderboard') {
        const field = interaction.options.getString('field')

        if (field == 'ethGobbled') {
          const top25ETHGobbled = findAndSortByETHGobbled(gooeys).slice(0, 25);
          const leaderboardEmbed = mkEthLeaderboardEmbed(top25ETHGobbled, snapshotTimestampStr);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        } else if (field == 'mitosisCredits') {
          const top25MitosisCredits = findAndSortByMitosisCredits(gooeys).slice(0, 25);
          const leaderboardEmbed = mkMCLeaderboardEmbed(top25MitosisCredits, snapshotTimestampStr);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        } else {
          const top25ByOffspring = findAndSortByNumberOfOffspring(gooeys).slice(0, 25);
          const leaderboardEmbed = mkOffspringLeaderboardEmbed(top25ByOffspring, snapshotTimestampStr);

          return await interaction.reply({ embeds: [leaderboardEmbed] });
        }
      } else if (subcommand == 'extinct') {
        const extinctBodyTypes = findExtinctBodyTypes(gooeys);
        const extinctionEmbed = mkExtinctionEmbed(extinctBodyTypes, snapshotTimestampStr);

        return await interaction.reply({ embeds: [extinctionEmbed] });

      } else if (subcommand == 'full-sets') {
        const fullSets = findFullGenesisSets(gooeys);
        const fullSetsEmbed = mkFullSetsEmbed(fullSets, snapshotTimestampStr);

        return await interaction.reply({ embeds: [fullSetsEmbed] });

      } else if (subcommand == 'one-of-ones') {
      const gen = interaction.options.getString('generation')
      const findByGen = findOneOfOnesByGen(gooeys)

        if (gen == '2') {
          const gen2OneOfOnes = findByGen(2)
          const oneOfOneEmbed = mkOneOfOnesEmbed(2, gen2OneOfOnes, snapshotTimestampStr);

          return await interaction.reply({ embeds: [oneOfOneEmbed] });
        } else if (gen == '3') {
          const gen2OneOfOnes = findByGen(3)
          const oneOfOneEmbed = mkOneOfOnesEmbed(3, gen2OneOfOnes, snapshotTimestampStr);

          return await interaction.reply({ embeds: [oneOfOneEmbed] });
        }

      } else if (subcommand == 'singles') {
        const singletonBodyTypes = findSingletonBodyTypes(gooeys);
        const singletonsEmbed = mkSingletonsEmbed(singletonBodyTypes, snapshotTimestampStr);

        return await interaction.reply({ embeds: [singletonsEmbed] });
      } else if (subcommand == 'stats') {
        const populationStrings = findPopulationDistribution(gooeys);
        const censusEmbed = mkCensusEmbed(populationStrings, snapshotTimestampStr);

        return await interaction.reply({ embeds: [censusEmbed] });
      }
  }
}
