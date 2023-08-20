import 'dotenv/config.js'
import { exit } from "process";
import { chown, writeFile } from 'fs/promises';

import { Gooey, RawGooey } from "../../types/gooey";
import redisClient from '../redis';

const gooeyToRawGooey = (goo: Gooey): RawGooey => {
    const traitToAttr = (name: string, value: any) => ({ trait_type: name, value });
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
        parentID,
        body,
        background,
        sidekick,
        ethGobbled
    } = goo;
    return ({
        tokenID,
        name,
        description,
        image,
        attributes: [
            traitToAttr(`generation`, generation),
            traitToAttr(`health`, health),
            traitToAttr(`disposition`, disposition),
            traitToAttr(`age`, age),
            traitToAttr(`isAwake`, isAwake),
            traitToAttr(`isBuried`, isBuried),
            traitToAttr(`mitosisCredits`, mitosisCredits),
            traitToAttr(`parentID`, parentID),
            traitToAttr(`background`, background),
            traitToAttr(`sidekick`, sidekick),
            traitToAttr(`body`, body),
            traitToAttr(`ethGobbled`, ethGobbled)
        ]
    })
}

(async function() {
    console.log("CONNECTING TO REDIS.....");
    await redisClient.connect();

    console.log("EXPORTING GOOEY METADATA FROM REDIS...");
    const gooeys = (await redisClient.hVals('gooeys'))
        .map((goo) => JSON.parse(goo) as Gooey)
        .map(gooeyToRawGooey);
    
    console.log("WRITING TO FILE...");
    await writeFile("/usr/data/export.json", JSON.stringify(gooeys));

    console.log("FIXING FILE PERMISSIONS...");
    await chown("/usr/data", 1000, 1000);
    await chown("/usr/data/export.json", 1000, 1000);

    console.log("DONE.");
    exit(0);
})();