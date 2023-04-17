import { EmbedBuilder, bold, underscore } from 'discord.js';
import { chunk } from 'lodash';

import { Gooey } from "../types/gooey";
import { oneOfOneIDs } from './lib';


const separatedStringBlock = (strings: string[]): string => {
    const separator = bold(' ⦚⦚ ');
    return chunk(strings, 3)
      .map(([one, two, three]) => `${one}${two ? `${separator}${two}` : ''}${three ? `${separator}${three}` : ''}`)
      .join('\n');
  }
  
const emboldenOneOfOne = (id: number): string => {
    const oneOfOnes = oneOfOneIDs[2].concat(oneOfOneIDs[3]);
    return oneOfOnes.includes(id) ? bold(`${id}`) : `${id}`;
}

export const mkUnburiedEmbed = (list: number[][][], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`${list.reduce(
      (deadCount, gen) => deadCount + gen[1].length
    , 0 as number)} unburied Gooeys with 0 health ☠️`)
    .setDescription(list.length ? list
      .map(([gen, goos]) => ([gen, goos.map(emboldenOneOfOne)]))
      .map(([[gen], deadGoos]) =>
        `${bold(underscore(`Gen ${gen}:`))}\n${deadGoos.join(', ')}`
      ).join('\n') :
      'All gooeys healthy! :tada:'
    )
    .setThumbnail('https://ethgobblers.com/bury-icon.svg')
    .setFooter({text: timeStr});

export const mkLowHealthEmbed = (list: number[][][], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`${list.reduce(
      (sadCount, gen) => sadCount + gen[1].length
    , 0 as number)} Gooeys with low health 🤒`)
    .setDescription(list.length ? list
      .map(([gen, goos]) => ([gen, goos.map(emboldenOneOfOne)]))
      .map(([[gen], sadGoos]) =>
      `${bold(underscore(`Gen ${gen}:`))}\n${sadGoos.join(', ')}`
      ).join('\n') :
      'All gooeys healthy! :tada:'
    )
    .setFooter({text: timeStr});

export const mkAsleepsEmbed =
  (list: number[][][], timeStr: string) =>
    new EmbedBuilder()
      .setTitle(`${list.reduce(
        (deadCount, gen) => deadCount + gen[1].length
      , 0 as number)} Gooeys are sleeping :shushing_face:`)
      .setDescription(list.length ? list
        .map(([gen, goos]) => ([gen, goos.map(emboldenOneOfOne)]))
        .map(([[gen], asleepGoos]) =>
          `${bold(underscore(`Gen ${gen}:`))}\n${asleepGoos.join(', ')}`
        ).join('\n') :
        'All gooeys awake! :sunny:'
      )
      .setFooter({text: timeStr});  

export const mkEthLeaderboardEmbed = (set: string, list: Gooey[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`${set} Gooey Leaderboard by ETH Gobbled 🎨`)
    .addFields(...list.map(({name, ethGobbled}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${ethGobbled} ETH`,
      inline: true
    })))
    .setFooter({text: timeStr});

export const mkMCLeaderboardEmbed = (set: string, list: Gooey[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`${set} Gooey Leaderboard by Mitosis Credits 🤰`)
    .addFields(...list.map(({name, mitosisCredits}, i) => ({
      name: `${i + 1}) ${name}`,
      value: `${mitosisCredits} MCs`,
      inline: true
    })))
    .setFooter({text: timeStr});

export const mkOffspringLeaderboardEmbed =
  (set: string, list: ({ parent: Gooey, children: Gooey[] })[], timeStr: string) =>
    new EmbedBuilder()
      .setTitle(`${set} Gooey Leaderboard by Offspring 👩‍👧‍👧`)
      .addFields(...list.map(({ parent: {name}, children }, i) => ({
        name: `${i + 1}) ${name}`,
        value: `${children.length} kid${children.length > 1 ? "s" : ""}`,
        inline: true
      })))
      .setFooter({text: timeStr});

export const mkExtinctionEmbed = (list: string[], timeStr: string) => 
  new EmbedBuilder()
    .setTitle(`Found ${list.length} extinct gooey types 🦖`)
    .setDescription(separatedStringBlock(list.sort()))
    .setFooter({text: timeStr});

export const mkSingletonsEmbed = (list: string[], timeStr: string) => 
  new EmbedBuilder()
    .setTitle(`Found ${list.length} singleton gooey bodies 🩱`)
    .setDescription(separatedStringBlock(list.sort()))
    .setFooter({text: timeStr});

export const mkCensusEmbed = (list: string[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Gooey Generation Report 📜`)
    .setDescription(list.join('\n'))
    .setFooter({text: timeStr});

export const mkFullSetsEmbed = (list: string[], timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Found ${list.length} gen 1 body types with all 4 left living :mirror_ball:`)
    .setDescription(list.length ?
      list.sort().join('\n') :
      `No full genesis sets left  😭`)
    .setFooter({text: timeStr});

export const mkOneOfOnesEmbed = (gen: number, list: string[], timeStr: string) => {
  const [live, ded] = list.reduce<number[]>(
    ([alive, dead], str) => 
      str.match(/~~(.*?)~~/) ? [alive, dead + 1] : [alive + 1, dead]
    , [0, 0]
  )
  const percent = live / list.length * 100;
  const livingCountStr = `${underscore('Body Count:')} ${live} left alive, ${ded} dead: ${percent}%\n`;

  return new EmbedBuilder()
    .setTitle(`${list.length} 1/1 gooeys in Generation ${gen} 🦄`)
    .setDescription(livingCountStr + separatedStringBlock(list))
    .setFooter({text: timeStr});
}

export const mkClansEmbed = (clans: ({ [key: string]: number }), timeStr: string) =>
  new EmbedBuilder()
    .setTitle(`Gooey clans of largest size  👩‍👩‍👧‍👧`)
    .addFields(...Object.entries(clans).slice(0, 25)
      .map((value, i) => ({
        name: `${i + 1}) ${value[0]}`,
        value: `${value[1]} members`,
        inline: true
      })))
    .setFooter({text: timeStr});