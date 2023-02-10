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

export const replaceAtIdx = <T extends unknown>(list: T[], i: number, item: T) => [
  ...list.slice(0, i),
  item,
  ...list.slice(i + 1)
]