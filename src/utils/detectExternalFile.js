import * as fs from 'fs';
import Promise from 'pinkie';

const parseJSON = async fd =>
    new Promise((resolve, reject) => {
        try {
            const parsedData = JSON.parse(fd);

            resolve(parsedData);
        }
        catch (err) {
            reject(err);
        }
    });

const getExternalConfigContent = filename =>
    new Promise((resolve, reject) => {
        fs.open(filename, 'r', async (err, fd) => {
            if (err) {
                if (err.code === 'ENOENT') reject('File does not exists');

                reject(err);
            }

            try {
                const parsedData = await parseJSON(fd);

                resolve(parsedData);
            }
            catch (parseError) {
                reject(parseError);
            }
        });
    });

module.exports = { getExternalConfigContent };
