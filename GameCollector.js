import axios from 'axios';
import fs from 'fs';
import { parseString } from 'xml2js';
import { gameList, outputPath } from './variables.js';
import readlineSync from 'readline-sync'

// Prompt the user to enter their Steam ID
const SteamUser = readlineSync.question('Enter your Steam Username (eg https://steamcommunity.com/id/ThisIsMakena/ would enter ThisIsMakena): ');

function objToCSV(games) {
    const filteredGames = games.filter(g => {
        // Exclude games with non-zero hours played
        if (parseFloat(g.HoursPlayed) !== 0) {
            return false;
        }
        return true;
    });

    return filteredGames.map(g => {
  
        let cleanedName = g.Name.replace(/™/g, '').replace(/®/g, '');

        // Replace "GOTY Edition" and "Game Of The Year Edition" with an empty string
        //cleanedName = cleanedName.replace(/GOTY Edition/gi, '').replace(/Game Of The Year Edition/gi, '').replace(/(1993)/gi, '1993');

        return "\"" + cleanedName.trim() + '\",' + g.appID;
    }).join('\n');
}

async function fetchData() {
    try {
        const response = await axios.get(`https://steamcommunity.com/id/${SteamUser}/games?xml=1`);
        const xmlData = response.data;

        parseString(xmlData, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }

            const games = result.gamesList.games[0].game.map(game => {
                return {
                    Name: game.name[0] || '',
                    HoursPlayed: game.hoursOnRecord ? game.hoursOnRecord[0] : 0,
                    appID: game.appID || ''
                }
            });

            fs.writeFileSync(outputPath + gameList, objToCSV(games));
        });

    } catch (error) {
        console.error(error);
    }
}

export { fetchData, SteamUser };