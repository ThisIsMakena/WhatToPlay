import fs from 'fs';
import hltb from 'howlongtobeat';
import { gameList, timeData } from './variables.js';
import { outputPath } from './variables.js';

let hltbService = new hltb.HowLongToBeatService();

function objToCSV(hltbData) {
    return hltbData.map(t => {
        return t.appid + ',\"' + t.name + '\",' + t.gameplayMain + ',' + t.gameplayMainExtra + ',' + t.gameplayCompletionist + ',' + t.similarity;
    }).join('\n');
}

function formatErrorLogEntry(gameName) {
    return `"${gameName}"`;
}

async function timeDataResult() {
    try {
        const games = fs.readFileSync(outputPath + gameList, 'utf8').split('\n').filter(Boolean);
        console.log('Games to search:', games);

        // check if we have some timedata already to lower how often we hit HLTB, unsure of API limites
        let existingTimeData = [];
        if (fs.existsSync(outputPath + timeData)) {
            existingTimeData = fs.readFileSync(outputPath + timeData, 'utf8').split('\n').filter(Boolean).map(line => {
                const [appid] = line.split(',').map(info => info.trim());
                return appid;
            });
        }

        // if the file exists, don't check the items that already have entry (This is based off steam appID, I refuse to elaborate on how janky my method is)
        const appIDsToSearch = games.map(gameInfo => {
            const [cleanedGameName, appid] = gameInfo.match(/"([^"]*)",([^,]*)/).slice(1, 3);
            return appid;
        }).filter(appid => !existingTimeData.includes(appid));

      //  console.log('New AppIDs to search:', appIDsToSearch);

        let allHltbData = [];

        await Promise.all(appIDsToSearch.map(async appid => {
            const gameInfo = games.find(game => {
                const [, currentAppID] = game.match(/"([^"]*)",([^,]*)/).slice(1, 3);
                return currentAppID === appid;
            });

            const [cleanedGameName] = gameInfo.match(/"([^"]*)"/).slice(1, 2);

            try {
                const results = await hltbService.search(cleanedGameName);

                if (Array.isArray(results) && results.length > 0) {
                    const hltbData = results.map(result => {
                        return {
                            appid: appid || '',
                            name: result.name || '',
                            gameplayMain: result.gameplayMain || '',
                            gameplayMainExtra: +result.gameplayMainExtra || '',
                            gameplayCompletionist: +result.gameplayCompletionist || '',
                            similarity: result.similarity || ''
                        };
                    });

                    allHltbData.push(...hltbData);

                    console.log(`Data fetched for ${cleanedGameName}`);
                } else {
                    if (existingTimeData.includes(appid)) {
                        console.log(`Skipping duplicate entry for ${cleanedGameName}`);
                    } else {
                        console.error(`No valid results found for ${cleanedGameName}`);
                        fs.appendFileSync(outputPath + 'error_log.csv', formatErrorLogEntry(cleanedGameName) + '\n');
                    }
                }
            } catch (error) {
                console.error(`Error fetching data for ${cleanedGameName}:`, error);
            }
        }));

        const newDataCSV = objToCSV(allHltbData);
        if (newDataCSV) {
            const fileContent = fs.existsSync(outputPath + timeData)
                ? '\n' + newDataCSV
                : newDataCSV;

            fs.appendFileSync(outputPath + timeData, fileContent);
            console.log('New data fetched and appended to the file.');
        } else {
            console.log('No new data to append.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

export { timeDataResult };