import { strikethrough, underscore } from 'discord.js';
import { last, sortBy } from 'lodash';
import { Gooey } from '../types/gooey';
import { oneOfOneIDs } from './lib';

export const splitToGenerations = (gooeys: Gooey[]): { [key: number]: Gooey[] } =>
  gooeys.reduce((dict, goo) => {
    const { generation } = goo;
    dict[generation] = dict[generation] ? [...dict[generation], goo] : [goo];
    return dict;
  }, {} as { [key: number]: Gooey[] });

const splitToBodyTypes = (gooeys: Gooey[]): { [key: string]: Gooey[] } =>
  gooeys.reduce((dict, goo) => {
    const { body } = goo;
    if (!body) { return dict }
    dict[body] = dict[body] ? [...dict[body], goo] : [goo];
    return dict;
  }, {} as { [key: string]: Gooey[] });

const splitToChildren = (gooeys: Gooey[]): { [key: number]: Gooey[] } =>
  gooeys.reduce((dict, goo) => {
    const { parentID } = goo;
    if (!parentID) { return dict }
    dict[parentID] = dict[parentID] ? [...dict[parentID], goo] : [goo];
    return dict;
  }, {} as { [key: number]: Gooey[] });

const mapChildrenToGooey =
  (allGooeys: Gooey[], gooeys: Gooey[]): ({ parent: Gooey, children: Gooey[] })[] => {
    const childrenMap = splitToChildren(allGooeys);
    return gooeys.map((parent) => {
      const children = childrenMap[parent.tokenID] || [];
      return { parent, children }
    })
      .filter(({children}) => children.length > 0);
  }

export const findUnburiedDead = (gooeys: Gooey[]): number[][][] => {
  const deads = gooeys.filter(({health,isBuried}) => !isBuried && health == 0);
  const deadsByGen = splitToGenerations(deads)
  return Object.entries(deadsByGen)
    .map(([gen, goos]) => ([[parseInt(gen)], goos.map(goo => goo.tokenID)]))
}

export const findLowHealth = (gooeys: Gooey[]): number[][][] => {
  const sads = gooeys.filter(({health}) => health > 0 && health <= 7 );
  const sadsByGen = splitToGenerations(sads)
  return Object.entries(sadsByGen)
    .map(([gen, goos]) => ([[parseInt(gen)], goos.map(goo => goo.tokenID)]))
}

export const findAsleeps = (gooeys: Gooey[]): number[][][] => {
  const asleeps = gooeys
    .filter(({age}) => age != 'deceased')
    .filter(({isAwake}) => !isAwake);
  const asleepsByGen = splitToGenerations(asleeps)
  return Object.entries(asleepsByGen)
    .map(([gen, goos]) => ([[parseInt(gen)], goos.map(goo => goo.tokenID)]))
}

export const findAndSortByMitosisCredits = (gooeys: Gooey[]): Gooey[] =>
  gooeys.filter(({mitosisCredits}) => mitosisCredits > 0)
    .sort((a, b) => b.mitosisCredits - a.mitosisCredits);

export const findAndSortByETHGobbled = (gooeys: Gooey[]): Gooey[] =>
  gooeys.filter(goo => goo.ethGobbled !== null)
    .filter(({ethGobbled}) => ethGobbled > 0)
    .sort((a, b) => b.ethGobbled - a.ethGobbled);

export const findAndSortByNumberOfOffspring = (allGooeys: Gooey[]) =>
  (gooeys: Gooey[]): ({ parent: Gooey, children: Gooey[] })[] => 
    mapChildrenToGooey(allGooeys, gooeys)
      .filter(({children}) => children.length > 0)
      .sort((a, b) => b.children.length - a.children.length)

export const findPopulationDistribution =
  (gooeys: Gooey[]): string[] => {
    const alive = gooeys.filter(({age}) => age != 'deceased').length;
    const dead = gooeys.filter(({age}) => age == 'deceased').length;
    const percent = alive ? Math.round(alive / gooeys.length * 100) : 0;
    const overall = `${underscore('Overall Population:')}\n${alive} left alive, ${dead} out of ${gooeys.length} dead: ${percent}%`;

    const generations = splitToGenerations(gooeys);

    const genStrings = Object.entries(generations)
      .map(([gen, goos]) => {
        const alive = goos.filter(({age}) => age != 'deceased').length;
        const dead = goos.filter(({age}) => age == 'deceased').length;
        const percent = alive ? Math.round(alive / goos.length * 100) : 0;
        return `Gen ${gen}: ${alive} left alive, ${dead} of ${goos.length} 🪦: ${percent}%`
      })

      return [overall].concat(genStrings);
  }

export const findSingletonBodyTypes = (gooeys: Gooey[]): string[] => {
  const bodyTypes = splitToBodyTypes(gooeys);
  const children = splitToChildren(gooeys);
  const oneOfOnes = oneOfOneIDs[2].concat(oneOfOneIDs[3])
  const oneOfOneTypes = gooeys
    .filter(({tokenID}) => oneOfOnes.includes(tokenID))
    .map(({body}) => body);

  const hasLivingChildren = (tokenID: number): boolean =>
    (children[tokenID]) ?
      children[tokenID].reduce((didFindLivingDescendant, child) =>
        (didFindLivingDescendant || !child.isBuried || hasLivingChildren(child.tokenID))
      , false) : false;

  return Object.entries(bodyTypes)
    .map(([body, gooeys]) => ([ body, gooeys.filter(goo => !goo.isBuried) ]))
    .filter(([_, aliveGooeys]) => aliveGooeys.length == 1)
    .map(([singletonBodyType]) => singletonBodyType as string)
    .filter(body => !oneOfOneTypes.includes(body));
}

export const findExtinctBodyTypes = (gooeys: Gooey[]): string[] => {
  const oneOfOnes = oneOfOneIDs[2].concat(oneOfOneIDs[3])
  const gooeysNoOneOfOnes = gooeys.filter(({tokenID}) => !oneOfOnes.includes(tokenID))
  const bodyTypes = splitToBodyTypes(gooeysNoOneOfOnes);
  const children = splitToChildren(gooeys);

  const hasLivingChildren = (tokenID: number): boolean =>
    (children[tokenID]) ?
      children[tokenID].reduce((didFindLivingDescendant, child) =>
        (didFindLivingDescendant || !child.isBuried || hasLivingChildren(child.tokenID))
      , false) : false;

  return Object.entries(bodyTypes)
    .map(([body, gooeys]) => ([
      body,
      gooeys.reduce((aliveList, goo) =>
        (!goo.isBuried || (goo.isBuried && hasLivingChildren(goo.tokenID))) ? aliveList.concat([goo]) : aliveList
      , [] as Gooey[])
    ]))
    .filter(([_, aliveGooeys]) => aliveGooeys.length == 0)
    .map(([extinctBodyType]) => extinctBodyType as string);
}

export const findFullGenesisSets = (gooeys: Gooey[]): string[] => {
  const gen1 = splitToGenerations(gooeys)[1];
  const bodyTypes = splitToBodyTypes(gen1);
  return Object.entries(bodyTypes)
    .reduce(
      (acc, [body, goos]) => goos.filter(({isBuried}) => !isBuried).length == 4 ? acc.concat([body]) : acc
    , [] as string[])
}

// export const findFamilyTree =
//   (gooeys: Gooey[]) => (gooId: number) => {
//     const pluckById = (id: number) => gooeys.find(({tokenID}) => id == tokenID);

//     const children = mapChildrenToGooey(gooeys, gooeys);

//     const findAncestors = (goo: Gooey): Gooey[] => {
//       const { parentID } = goo;
//       return parentID ? findAncestors : goo;
//     }
//   }

export const findOneOfOnesByGen =
  (gooeys: Gooey[]) => (gen: number) => {
    const oneOfOneTypes = gooeys
      .filter(({tokenID}) => oneOfOneIDs[gen].includes(tokenID))
      .sort((a, b) => (a.body as string) > (b.body as string) ? 1 : -1)
      .map(({body, isBuried}) => isBuried ? strikethrough(body as string) : body as string);
    return oneOfOneTypes;
  }

export const findClanSizes =
  (gooeys: Gooey[]): { [key: string]: number } => {
    const bodies = splitToBodyTypes(gooeys)
    return Object.entries(bodies)
      .map(([body, members]) => [body, members.filter(({isBuried}) => !isBuried).length])
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .reduce((acc, [body, count]) => ({ ...acc, [body]: count }), {})
  }

export const fetchSnapshotTimestamp = (gooeys: Gooey[]): Date => {
  const recentGooey = last(sortBy(gooeys, 'last_update'));
  if (!recentGooey) throw new Error('Failed to fetch timestamp!');
  const { last_update } = recentGooey;
  return new Date(last_update);
}