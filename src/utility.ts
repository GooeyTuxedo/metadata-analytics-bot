import { db } from "./database";
import { Gooey } from "../types/gooey";


export const fetchTokenCollection = (): Promise<Gooey[]> => {
  return new Promise((resolve, reject) => {
    return db.all(
      `SELECT tokenID, name, description, image, generation, health, disposition, age, isAwake, isBuried, mitosisCredits, parentID, body, ethGobbled
      FROM tokens`,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const gooeys = rows.map(goo => ({
            ...goo,
            isAwake: goo.isAwake == 1 ? true : false,
            isBuried: goo.isBuried == 1 ? true : false,
            ethGobbled: goo.ethGobbled ? goo.ethGobbled : 0
          }))
          resolve(gooeys as Gooey[]);
        }
      }
    );
  });
}


export const fetchSnapshotTimestamp = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    return db.get('SELECT MAX(updated_at) as last_update FROM tokens', [], (err, row) => {
      if (err) {
        reject(err)
      }
      resolve(row.last_update);
    });
  });
}

export const replaceAtIdx = <T extends unknown>(list: T[], i: number, item: T) => [
  ...list.slice(0, i),
  item,
  ...list.slice(i + 1)
]