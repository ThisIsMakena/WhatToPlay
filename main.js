import { fetchData } from './GameCollector.js';
import { timeDataResult } from './HowLongToBeat.js';
import { reviewDataResult } from './SteamReviews.js';
import { finalSortResult } from './FinalSort.js';
import { gameList, outputPath } from './variables.js';

async function run() {
  try {

    await fetchData();
    console.log(`Data fetched and saved to: ${outputPath + gameList}`);

    await timeDataResult();
    console.log('HowLongToBeat routine completed.');

    await reviewDataResult();
    console.log('SteamReviews routine completed.');

    await finalSortResult();
    console.log('Final sorting is complete');

    console.log('All routines completed successfully.');
  } catch (error) {
    console.error(error);
  }
}

run();
