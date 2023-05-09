import { Alchemy, Network, Nft } from 'alchemy-sdk';
import { each, forEach, sortBy } from 'lodash';

import redisClient from "./redis";
import { Gooey } from "../types/gooey";


export const fetchTokenCollection = async (): Promise<Gooey[]> => {
  const gooeys = (await redisClient.hVals('gooeys'))
    .map((goo) => JSON.parse(goo) as Gooey);

  console.log(`fetched ${gooeys.length} gooeys`)
  return sortBy(gooeys, 'tokenID');
}

export const getTokenIndex = async (): Promise<number> => {
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

export const replaceAtIndex = <T extends unknown>(list: T[], i: number, item: T) => [
  ...list.slice(0, i),
  item,
  ...list.slice(i + 1)
]

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getTokensInDeadAddress = async (): Promise<number[]> => {
  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  }
  const alchemy = new Alchemy(settings);

  const tokens = alchemy.nft.getNftsForOwnerIterator('0x000000000000000000000000000000000000dead', { contractAddresses: ['0x0a8d311b99ddaa9ebb45fd606eb0a1533004f26b'] });
  const tokenIds: number[] = [];
  for await (const token of tokens) {
    const { tokenId } = token;
    tokenIds.push(parseInt(tokenId));
  }
  return tokenIds;
}