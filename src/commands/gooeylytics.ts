import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// @ts-ignore
import page from 'discord-pagination-advanced';

import { fetchTokenCollection } from '../utility';
import {
  splitToGenerations,
  findAndSortByETHGobbled,
  findAndSortByMitosisCredits,
  findAndSortByNumberOfOffspring,
  findExtinctBodyTypes,
  findFullGenesisSets,
  findLowHealth,
  findAsleeps,
  findOneOfOnesByGen,
  findPopulationDistribution,
  findSingletonBodyTypes,
  findUnburiedDead,
  findClanSizes,
  fetchSnapshotTimestamp
} from '../transformations';
import {
  mkUnburiedEmbed,
  mkLowHealthEmbed,
  mkAsleepsEmbed,
  mkEthLeaderboardEmbed,
  mkMCLeaderboardEmbed,
  mkOffspringLeaderboardEmbed,
  mkExtinctionEmbed,
  mkSingletonsEmbed,
  mkCensusEmbed,
  mkFullSetsEmbed,
  mkOneOfOnesEmbed,
  mkClansEmbed
} from '../embeds';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gooey')
    .setDescription('Run a query on the gooey-db')

    .addSubcommand(subcommand =>
      subcommand
        .setName('unburied')
        .setDescription('List all Gooeys at zero health that have not been buried'))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName('low-health')
        .setDescription('List all Gooeys under 8 health'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('asleeps')
        .setDescription('List all sleeping Gooeys'))
    
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
              { name: 'Offspring', value: 'offspring' },
              { name: 'Clans', value: 'clans' }
            )))

    .addSubcommand(subcommand =>
      subcommand
        .setName('extinct')
        .setDescription('List all gooey body types with no living members'))

    .addSubcommand(subcommand =>
      subcommand
        .setName('full-sets')
        .setDescription('List genesis body types with all members still living'))

        .addSubcommand(subcommand =>
          subcommand
            .setName('one-of-ones')
            .setDescription('List 1/1 body types')
            .addStringOption(option => 
              option.setName('generation')
                .setDescription('The generation to print')
                .setRequired(true)
                .addChoices(
                  { name: '2', value: '2' },
                  { name: '3', value: '3' }
                )))

    .addSubcommand(subcommand =>
      subcommand
        .setName('singles')
        .setDescription('List all body types with only 1 gooey left living'))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Report living and dead gooeys by generation')),
    

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const gooeys = await fetchTokenCollection();
    const timestamp = fetchSnapshotTimestamp(gooeys);
    const snapshotTimestampStr = `Gooey database last updated at ${timestamp.toUTCString()}`;

      if (subcommand == 'unburied') {
        const unburiedDead = findUnburiedDead(gooeys)
        const unburiedEmbed = mkUnburiedEmbed(unburiedDead, snapshotTimestampStr)

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [unburiedEmbed] });

      } else if (subcommand == 'low-health') {
          const sadGooeys = findLowHealth(gooeys)
          const lowHealthEmbed = mkLowHealthEmbed(sadGooeys, snapshotTimestampStr)

          console.log(`Replying to command "/gooey ${subcommand}"...`);
          return await interaction.reply({ embeds: [lowHealthEmbed] });

      } else if (subcommand == 'asleeps') {
        const asleepGooeys = findAsleeps(gooeys)
        const asleepsEmbed = mkAsleepsEmbed(asleepGooeys, snapshotTimestampStr)

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [asleepsEmbed] });

      } else if (subcommand == 'leaderboard') {
        const field = interaction.options.getString('field');

        if (field == 'clans') {
          const clans = findClanSizes(gooeys);
          const clansEmbed = mkClansEmbed(clans, snapshotTimestampStr);
  
          console.log(`Replying to command "/gooey ${subcommand} ${field}"...`);
          return await interaction.reply({ embeds: [clansEmbed] });
        }

        const generations = splitToGenerations(gooeys);
        const gen1 = generations[1];
        const gen2 = generations[2];
        const gen3 = generations[3];
        const gen4 = generations[4];
        const gens = [ gen1, gen2, gen3, gen4 ];
        const overallWithGens = [ gooeys, ...gens ];

        if (field == 'ethGobbled') {
          const ethGobbledEmbeds = overallWithGens
            .map(goos => findAndSortByETHGobbled(goos).slice(0, 25))
            .map((goos, i) => ({
              goos,
              set: i == 0 ? 'Overall' : `Gen ${i}`
            }))
            .filter(({goos}) => goos.length)
            .map(({goos, set}) => mkEthLeaderboardEmbed(set, goos, snapshotTimestampStr));

          console.log(`Replying to command "/gooey ${subcommand} ${field}"...`);
          return await page(interaction, ethGobbledEmbeds);
        } else if (field == 'mitosisCredits') {
          const mitosisCreditEmbeds = overallWithGens
            .map(goos => findAndSortByMitosisCredits(goos).slice(0, 25))
            .map((goos, i) => ({
              goos,
              set: i == 0 ? 'Overall' : `Gen ${i}`
            }))
            .filter(({goos}) => goos.length)
            .map(({goos, set}) => mkMCLeaderboardEmbed(set, goos, snapshotTimestampStr));

          console.log(`Replying to command "/gooey ${subcommand} ${field}"...`);
          return await page(interaction, mitosisCreditEmbeds);

        } else {
          const mapFn = findAndSortByNumberOfOffspring(gooeys);
          const offspringEmbeds = overallWithGens
            .map(goos => mapFn(goos).slice(0, 25))
            .map((goos, i) => ({
              goos,
              set: i == 0 ? 'Overall' : `Gen ${i}`
            }))
            .filter(({goos}) => goos.length)
            .map(({goos, set}) => mkOffspringLeaderboardEmbed(set, goos, snapshotTimestampStr));
            
          console.log(`Replying to command "/gooey ${subcommand} ${field}"...`);
          return await page(interaction, offspringEmbeds);

        }
      } else if (subcommand == 'extinct') {
        const extinctBodyTypes = findExtinctBodyTypes(gooeys);
        const extinctionEmbed = mkExtinctionEmbed(extinctBodyTypes, snapshotTimestampStr);

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [extinctionEmbed] });

      } else if (subcommand == 'full-sets') {
        const fullSets = findFullGenesisSets(gooeys);
        const fullSetsEmbed = mkFullSetsEmbed(fullSets, snapshotTimestampStr);

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [fullSetsEmbed] });

      } else if (subcommand == 'one-of-ones') {
        const gen = interaction.options.getString('generation')
        const findByGen = findOneOfOnesByGen(gooeys)

        if (gen == '2') {
          const gen2OneOfOnes = findByGen(2)
          const oneOfOneEmbedDuex = mkOneOfOnesEmbed(2, gen2OneOfOnes, snapshotTimestampStr);

          console.log(`Replying to command "/gooey ${subcommand} ${gen}"...`);
          return await interaction.reply({ embeds: [oneOfOneEmbedDuex] });

        } else if (gen == '3') {
          const gen3OneOfOnes = findByGen(3)
          const oneOfOneEmbedTrois = mkOneOfOnesEmbed(3, gen3OneOfOnes, snapshotTimestampStr);

          console.log(`Replying to command "/gooey ${subcommand} ${gen}"...`);
          return await interaction.reply({ embeds: [oneOfOneEmbedTrois] });
        }

      } else if (subcommand == 'singles') {
        const singletonBodyTypes = findSingletonBodyTypes(gooeys);
        const singletonsEmbed = mkSingletonsEmbed(singletonBodyTypes, snapshotTimestampStr);

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [singletonsEmbed] });

      } else if (subcommand == 'stats') {
        const populationStrings = findPopulationDistribution(gooeys);
        const censusEmbed = mkCensusEmbed(populationStrings, snapshotTimestampStr);

        console.log(`Replying to command "/gooey ${subcommand}"...`);
        return await interaction.reply({ embeds: [censusEmbed] });
      }
  }
}
