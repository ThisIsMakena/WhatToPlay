import axios from 'axios';
import fs from 'fs';
import { parse } from 'csv-parse';  
import { promisify } from 'util';
import { gameList, reviewData } from './variables.js'; 
import { outputPath } from './variables.js';
const parseAsync = promisify(parse);

const inputCSVPath = outputPath + gameList;

function objToCSV(reviewDataSum) {
    return reviewDataSum.map(r => {
        return r.appID + ',' + r.reviewScore + ',' + r.reviewScoreDesc;
    }).join('\n');
}

async function reviewDataResult() {
    try {
        const data = fs.readFileSync(inputCSVPath, 'utf8');
        const records = await parseAsync(data);

        let gameReviewPromiseList = [];

        records.forEach(record => {
            const title = record[0];
            const appID = record[1];

            const apiUrl = `https://store.steampowered.com/appreviews/${appID}?json=1`;

            const steamReviewItem = axios.get(apiUrl)
                .then(response => {
                    const data = response.data;

                    if (data.query_summary) {
                        const reviewScore = data.query_summary.review_score;
                        const reviewScoreDesc = data.query_summary.review_score_desc;

                       // console.log(`Review data for ${title} (AppID: ${appID}):`);
                       // console.log('Review Score:', reviewScore);
                       // console.log('Review Score Description:', reviewScoreDesc);

                        return {
                            appID: appID,
                            reviewScore: reviewScore,
                            reviewScoreDesc: reviewScoreDesc
                        };
                    } else {
                        console.log(`No review data found for ${title} (AppID: ${appID}).`);
                        return {
                          appID: appID,
                          reviewScore: 'Not Found'
                        };
                    }
                })
                .catch(error => {
                    console.error(`Axios error for ${title} (AppID: ${appID}):`, error);
                });

            gameReviewPromiseList.push(steamReviewItem);
        });

        const gameReviewList = await Promise.all(gameReviewPromiseList);

        // Write review data to CSV
        fs.writeFileSync(outputPath + reviewData, objToCSV(gameReviewList));
        console.log('CSV file updated successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}

export { reviewDataResult };