import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Fetching wordlist and dictionary data...');
  const [wordText, dictRaw] = await Promise.all([
    fetch('https://raw.githubusercontent.com/raun/Scrabble/master/words.txt').then(r => r.text()),
    fetch('https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json').then(r => r.json())
  ]);

  const allWords = wordText
    .split(/\r?\n/)
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length >= 2 && w.length <= 15 && /^[A-Z]+$/.test(w));

  console.log(`Loaded ${allWords.length} valid uppercase words.`);

  // Ensure public/data and public/data/dict exist
  fs.mkdirSync(path.resolve('public/data/dict'), { recursive: true });

  // Save compact wordlist as JSON array
  fs.writeFileSync(path.resolve('public/data/words.json'), JSON.stringify(allWords));
  console.log('Saved public/data/words.json');

  // Group definitions by first letter A-Z
  const letterBuckets = {};
  for (let i = 65; i <= 90; i++) {
    letterBuckets[String.fromCharCode(i)] = {};
  }

  // Parse Webster's definitions
  let totalDefs = 0;
  for (const [key, rawDef] of Object.entries(dictRaw)) {
    const wordUpper = key.trim().toUpperCase();
    if (!wordUpper || wordUpper.length < 2) continue;
    const firstLetter = wordUpper[0];
    if (letterBuckets[firstLetter]) {
      // Clean definition: remove multiple spaces, cap at 350 chars
      let cleanDef = String(rawDef)
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (cleanDef.length > 350) {
        cleanDef = cleanDef.slice(0, 347) + '...';
      }
      letterBuckets[firstLetter][wordUpper] = cleanDef;
      totalDefs++;
    }
  }

  // Also include custom crosswordese and definitions from base
  const customDefs = JSON.parse(fs.readFileSync('scripts/base-defs.json', 'utf8'));
  for (const [w, item] of Object.entries(customDefs)) {
    const firstLetter = w[0];
    if (letterBuckets[firstLetter]) {
      letterBuckets[firstLetter][w] = item.defs[0];
    }
  }

  // Write a.json through z.json
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const lower = letter.toLowerCase();
    fs.writeFileSync(
      path.resolve(`public/data/dict/${lower}.json`),
      JSON.stringify(letterBuckets[letter])
    );
  }
  console.log(`Saved 26 letter dictionary files. Total definitions: ${totalDefs}`);
}

main().catch(console.error);
