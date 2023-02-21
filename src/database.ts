import axios from 'axios';
import { Database } from 'sqlite3';
import { Alchemy, Network } from 'alchemy-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

import { Gooey, FlatGooey, RawGooey } from "../types/gooey";
import { replaceAtIdx } from './utility';
import { chunk } from 'lodash';

export const db = new Database(":memory:", (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log("Connected to the gooey database.");
});

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
    ETHGobbled,
    parentID = null,
    body = null
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
    body
  } as Gooey;
}

const getTokenIndex = async (): Promise<number> => {
  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  }
  const alchemy = new Alchemy(settings);

  const { totalSupply = '2000' } = await alchemy.nft.getContractMetadata('0x0a8d311b99ddaa9ebb45fd606eb0a1533004f26b')
  if (totalSupply == '2000') console.log('FETCHING SUPPLY FAILED')
  console.log(`Collection total supply: ${totalSupply} tokens`)
  return parseInt(totalSupply);
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
  const chunkedIDs = chunk(idList, 100);
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

  console.log("Failed to fetch these tokens, retrying: ", failureIds)
  const retries = await getGooeyMetadataListByIdList(failureIds);
  const gooListWithRetries = retries.reduce((gooeys, goo): (Gooey | null)[] =>
    goo ? replaceAtIdx(gooeys, goo.tokenID, goo) : gooeys
  , gooList);
  return gooListWithRetries
}

const filterFailures = (maybeGooeyList: (Gooey | null)[]): Gooey[] =>
  maybeGooeyList.filter(goo => goo !== null) as Gooey[];

const updateGooeyCollection = (gooeys: Gooey[]) => {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS tokens (
        tokenID INTEGER PRIMARY KEY,
        updated_at INT,
        name TEXT,
        description TEXT,
        image TEXT,
        generation INTEGER,
        health INTEGER,
        disposition TEXT,
        age TEXT,
        isAwake BOOL,
        isBuried BOOL,
        mitosisCredits INTEGER,
        parentID INTEGER,
        body TEXT,
        ethGobbled FLOAT
      )`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );

    const stmt = db.prepare(
      `INSERT OR REPLACE INTO tokens (
        tokenID,
        updated_at,
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
        parentID,
        body,
        ethGobbled
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );

    const timestamp = Date.now();
    gooeys.forEach((gooey) => {
      stmt.run(
        gooey.tokenID,
        timestamp,
        gooey.name,
        gooey.description,
        gooey.image,
        gooey.generation,
        gooey.health,
        gooey.disposition,
        gooey.age,
        gooey.isAwake,
        gooey.isBuried,
        gooey.mitosisCredits,
        gooey.parentID,
        gooey.body,
        gooey.ethGobbled
      );
    });

    stmt.finalize();
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function doUpdateLoop(): Promise<void> {
  await sleep(900000);
  doUpdate().then(() => doUpdateLoop()) // run another update after 15 minutes
}
