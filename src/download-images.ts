import fs from 'fs';
import Axios from'axios'
import { chunk } from 'lodash';

import { oneOfOneIDs } from './lib';

async function downloadImage(url: string, filepath:string) {
    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}

const getGooeyMetadataListByIdList = async (idList: number[]) => {
    const chunkedIDs = chunk(idList, 10);
    let imgList = [];
  
    for (const c of chunkedIDs) {
      const imgs = await Promise.all(c.map(i => downloadImage(`https://ethgobblers.com/image/${i}`, `./images/${i}.gif`))).then(list => list);
      imgList.push(imgs);
    }
  
    return Promise.resolve(imgList.flat());
}
  

(function () {
    getGooeyMetadataListByIdList(oneOfOneIDs[3])
})();
