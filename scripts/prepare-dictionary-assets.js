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

  console.log(`Loaded ${allWords.length} valid uppercase words from Scrabble list.`);

  // Ensure public/data and public/data/dict exist
  fs.mkdirSync(path.resolve('public/data/dict'), { recursive: true });

  const wordSet = new Set(allWords);

  // Parse Webster's definitions
  let totalDefs = 0;
  for (const [key, rawDef] of Object.entries(dictRaw)) {
    const wordUpper = key.trim().toUpperCase();
    if (!wordUpper || wordUpper.length < 2) continue;
    if (wordUpper.length <= 15 && /^[A-Z]+$/.test(wordUpper)) {
      wordSet.add(wordUpper);
    }
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
    const clean = w.trim().toUpperCase();
    if (/^[A-Z]{2,15}$/.test(clean)) {
      wordSet.add(clean);
    }
    const firstLetter = clean[0];
    if (letterBuckets[firstLetter]) {
      letterBuckets[firstLetter][clean] = item.defs[0];
    }
  }

  // Save full compact wordlist as JSON array (sorted)
  const combinedWords = Array.from(wordSet).sort();
  fs.writeFileSync(path.resolve('public/data/words.json'), JSON.stringify(combinedWords));
  console.log(`Saved public/data/words.json with ${combinedWords.length} words (2-15 letters).`);

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
