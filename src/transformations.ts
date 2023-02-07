import { Gooey } from '../types/gooey';

const splitToGenerations = (gooeys: Gooey[]): { [key: number]: Gooey[] } =>
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

const mapChildrenToGooey = (gooeys: Gooey[]): ({ parent: Gooey, children: Gooey[] })[] => {
  const childrenMap = splitToChildren(gooeys);
  return gooeys.map((parent) => {
    const children = childrenMap[parent.tokenID] || [];
    return { parent, children }
  })
    .filter(({children}) => children.length > 0);
}

export const findUnburiedDead = (gooeys: Gooey[]): number[] =>
  gooeys.filter(({health,isBuried}) => !isBuried && health == 0)
    .map(goo => goo.tokenID);

export const findAndSortByMitosisCredits = (gooeys: Gooey[]): Gooey[] =>
  gooeys.filter(({mitosisCredits}) => mitosisCredits > 0)
    .sort((a, b) => b.mitosisCredits - a.mitosisCredits);

export const findAndSortByETHGobbled = (gooeys: Gooey[]): Gooey[] =>
  gooeys.filter(goo => goo.ethGobbled !== null)
    .sort((a, b) => b.ethGobbled - a.ethGobbled);

export const findAndSortByNumberOfOffspring = (gooeys: Gooey[]): Gooey[] => 
  mapChildrenToGooey(gooeys)
    .sort((a, b) => b.children.length - a.children.length)
    .map(({parent}) => parent);
    
export const findExtinctBodyTypes = (gooeys: Gooey[]): string[] => {
  const bodyTypes = splitToBodyTypes(gooeys);
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


