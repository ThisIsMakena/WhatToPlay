import fs from 'fs';
import { parse } from 'csv-parse';
import { timeData, outputPath, reviewData, resultList } from './variables.js';
import { SteamUser } from './GameCollector.js';

export async function finalSortResult() {
  try {
    const timeDataSort = await readCSV(outputPath + timeData);
    const reviewDataRecords = await readCSV(outputPath + reviewData);

    const reviewDataMap = new Map(reviewDataRecords.map(record => [record[0], { column2: record[1], column3: record[2] }]));

    // Sort by gameplayMain duration, with some chatgpt witchcraft to put stuff with no number at the end
    const sortedTimeData = timeDataSort.sort((a, b) => {
      const keyA = a[0]; 
      const keyB = b[0]; 

      const durationA = parseFloat(a[2].trim()); 
      const durationB = parseFloat(b[2].trim()); 

      if (!isNaN(durationA) && !isNaN(durationB)) {
        return durationA - durationB;
      } else if (isNaN(durationA) && isNaN(durationB)) {
        return 0; 
      } else if (isNaN(durationA)) {
        return 1; 
      } else {
        return -1; 
      }
    });

    const csvRows = [];

    // steamreview > 7 and similarity > 0.9 (HLTB search results being closer)
    sortedTimeData.forEach((record, index) => {
      const key = record[0];
      const reviewDataRecord = reviewDataMap.get(key);

      const column6Value = parseFloat(record[5].trim());

      if (reviewDataRecord.column2 >= 7 && column6Value > 0.9) {
        const newRow = [...record, reviewDataRecord.column2, reviewDataRecord.column3];
        csvRows.push(newRow);
        console.log(`Rank ${index + 1}: AppID - ${key}, GameName - ${record[1]}, gameplayMain - ${record[2]}, Column2 - ${reviewDataRecord.column2}, Column3 - ${reviewDataRecord.column3}`);
      }
    });

    // writes to file
    const csvString = csvRows.map(row => row.join(',')).join('\n');
    fs.writeFileSync(`${outputPath}${SteamUser}.csv`, csvString);
    console.log(`Filtered and sorted results (where Column2 >= 7 and Column6 > 0.9) written to ${outputPath}${SteamUser}.csv`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function readCSV(filePath) {
  const fileData = fs.readFileSync(filePath, 'utf8');

  return new Promise((resolve, reject) => {
    parse(fileData, { columns: false }, (err, records) => {
      if (err) {
        reject(err);
      } else {
        // Filter out empty records
        const nonEmptyRecords = records.filter(record => record.some(value => value !== ''));
        resolve(nonEmptyRecords);
      }
    });
  });
}
