import { Database } from "sqlite3";

import { Gooey } from "../types/gooey";


export const fetchTokenCollection = (): Promise<Gooey[]> => {
  const db = new Database("./db/tokens.db");

  return new Promise((resolve, reject) => {
    db.all(
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

    return db.close();
  });
}


export const fetchSnapshotTimestamp = (): Promise<number> => {
  const db = new Database("./db/tokens.db");

  return new Promise((resolve, reject) => {
    db.get('SELECT MAX(updated_at) as last_update FROM tokens', [], (err, row) => {
      if (err) {
        reject(err)
      }
      resolve(row.last_update);
    });

    return db.close();
  });
}

export async function promiseAllInBatches(task: any, items: any, batchSize: number) {
  let position = 0;
  let results: any[] = [];
  while (position < items.length) {
      const itemsForBatch = items.slice(position, position + batchSize);
      results = [...results, ...await Promise.all(itemsForBatch.map((item: any) => task(item)))];
      position += batchSize;
  }
  return results;
}