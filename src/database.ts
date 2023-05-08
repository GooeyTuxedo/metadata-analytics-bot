import 'dotenv/config.js'
import axios from 'axios';
import { chunk } from 'lodash';

import { getTokenIndex, replaceAtIndex, sleep } from './utility';
import { Gooey, FlatGooey, RawGooey } from "../types/gooey";
import redisClient from './redis';

const flattenGooey = (token: RawGooey): FlatGooey => {
  const flattenedToken: FlatGooey = {
    tokenID: token.tokenID,
    name: token.name,
    description: token.description,
    image: token.image,
  };
  token.attributes.forEach((attribute) => {
    flattenedToken[attribute.trait_type] = attribute.value;
  });
  return flattenedToken;
};

const hydrateGooey = (token: FlatGooey): Gooey => {
  const {
    tokenID,
    name,
    description,
    image,
    generation,
    health,
    disposition,
    age,
    isAwake,
    isBuried,
    mitosisCredits,
    ETHGobbled = 0,
    parentID = null,
    body = null,
    Background = null,
    Sidekick = null,
    accessory = null,
    food = null,
    wings = null,
    weather = null,
    cushion = null,
    freeSlot = null
  } = token;
  return {
    tokenID,
    name,
    description,
    image,
    generation,
    health,
    disposition,
    age,
    isAwake,
    isBuried,
    mitosisCredits,
    ethGobbled: parseFloat(ETHGobbled),
    parentID,
    body,
    background: Background,
    sidekick: Sidekick,
    accessory,
    food,
    wings,
    weather,
    cushion,
    freeSlot,
    last_update: Date.now()
  } as Gooey;
}

const makeIDListBySupply = (totalSupply: number): number[] => Array.from({ length: totalSupply }, (_, i) => i);

const getGooeyById = async (tokenId: number): Promise<Gooey | null> => {
  try {
    const response = await axios.get(`https://ethgobblers.com/metadata/${tokenId}`)
    const raw = response.data as RawGooey;
    
    const flat = flattenGooey(raw);
    return hydrateGooey(flat);
  } catch (error) {
//    quiet down logs for a bit
//    console.error(`Error fetching with id ${tokenId}: ${error}`);
    return null;
  }
}

const getGooeyMetadataListByIdList = async (idList: number[]): Promise<(Gooey|null)[]> => {
  const chunkedIDs = chunk(idList, 10);
  let gooList = [];

  for (const c of chunkedIDs) {
    const goos = await Promise.all(c.map(getGooeyById)).then(list => list);
    gooList.push(goos);
  }

  return Promise.resolve(gooList.flat());
}

const getGooeyCollectionBySupply = async (totalSupply: number): Promise<(Gooey | null)[]> => {
  console.log(`Building gooey dataset, this may take a while`);
  return getGooeyMetadataListByIdList(makeIDListBySupply(totalSupply));
}

const retryFailuresInList = async (gooList: (Gooey | null)[]): Promise<(Gooey | null)[]> => {
  const failureIds = gooList.reduce((fails, goo, i) => goo ? fails : fails.concat([i]), [] as number[]);
  if (failureIds.length == 0) return gooList;

  console.log("Failed to fetch these tokens, retrying: \n", failureIds)
  const retries = await getGooeyMetadataListByIdList(failureIds);
  const gooListWithRetries = retries.reduce((gooeys, goo): (Gooey | null)[] =>
    goo ? replaceAtIndex(gooeys, goo.tokenID, goo) : gooeys
  , gooList);
  return gooListWithRetries
}

const filterFailures = (maybeGooeyList: (Gooey | null)[]): Gooey[] =>
  maybeGooeyList.filter(goo => goo !== null) as Gooey[];

const updateGooeyCollection = async (gooeys: Gooey[]) => {
  if (!redisClient.isOpen) await redisClient.connect()
    .catch((reason) => console.log("Error connecting to redis!\n", reason));

  gooeys.forEach(async (gooey) => {
      await redisClient.hSet('gooeys', `${gooey.tokenID}`, JSON.stringify(gooey));
  });
};

export function doUpdate() {
  return getTokenIndex()
  .then(getGooeyCollectionBySupply)
  .then(retryFailuresInList)
  .then(filterFailures)
  .then(updateGooeyCollection)
  .then(() => console.log(`Updated gooey database at ${new Date().toUTCString()}`))
  .catch(() => console.log(`db update failed!`));
}

export async function doUpdateLoop(): Promise<void> {
  await sleep(900000);
  doUpdate().then(() => doUpdateLoop()) // run another update after 15 minutes
}
