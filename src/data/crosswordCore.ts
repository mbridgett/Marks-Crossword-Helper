import { DictionaryEntry } from '../types';

export const SCRABBLE_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

export function calculateWordScore(word: string): number {
  let score = 0;
  for (const ch of word.toUpperCase()) {
    score += SCRABBLE_VALUES[ch] || 0;
  }
  return score;
}

export const FAMOUS_CROSSWORDESE: Record<string, DictionaryEntry> = {
  ALOE: {
    word: "ALOE",
    partOfSpeech: "noun",
    definitions: [
      "A succulent plant with thick spiny leaves containing a soothing gel.",
      "Lotion ingredient prized for relieving sunburns and skin irritation."
    ],
    synonyms: ["succulent", "aloe vera", "lotion plant"],
    crosswordNote: "Appears frequently in puzzles due to its rich vowel density (A-L-O-E). Common clues: 'Burn soother', 'Succulent', 'Healing plant'.",
    source: "offline-core"
  },
  EDAM: {
    word: "EDAM",
    partOfSpeech: "noun",
    definitions: [
      "A round Dutch cheese made from cow's milk, characterized by a red paraffin wax coating.",
      "A town in North Holland from which the cheese takes its name."
    ],
    synonyms: ["Dutch cheese", "Gouda cousin"],
    crosswordNote: "Very frequent crossword answer for clues like 'Red-coated cheese' or 'Dutch export'.",
    source: "offline-core"
  },
  ETUI: {
    word: "ETUI",
    partOfSpeech: "noun",
    definitions: [
      "A small, ornamental case for holding needles, cosmetics, or other small sewing articles."
    ],
    synonyms: ["needle case", "sewing kit"],
    crosswordNote: "Classic old-school crosswordese. Common clues: 'Needle case', 'Small sewing box', 'Notions holder'.",
    source: "offline-core"
  },
  ERNE: {
    word: "ERNE",
    partOfSpeech: "noun",
    definitions: [
      "A sea eagle, especially the white-tailed sea eagle (Haliaeetus albicilla)."
    ],
    synonyms: ["sea eagle", "osprey cousin"],
    crosswordNote: "One of the most famous crossword birds alongside NENE. Common clues: 'Sea eagle', 'Coastal raptor', 'Bird of prey'.",
    source: "offline-core"
  },
  NENE: {
    word: "NENE",
    partOfSpeech: "noun",
    definitions: [
      "The endangered Hawaiian goose (Branta sandvicensis), the state bird of Hawaii."
    ],
    synonyms: ["Hawaiian goose"],
    crosswordNote: "A beloved 4-letter staple. Common clues: 'State bird of Hawaii', 'Rare goose', 'Aloha State avian'.",
    source: "offline-core"
  },
  SERE: {
    word: "SERE",
    partOfSpeech: "adjective",
    definitions: [
      "Dry, withered, or parched, particularly describing vegetation or arid landscapes."
    ],
    synonyms: ["arid", "parched", "withered", "dry"],
    crosswordNote: "Literary word frequently tested. Common clues: 'Dry as a bone', 'Withered', 'Arid'.",
    source: "offline-core"
  },
  OBOE: {
    word: "OBOE",
    partOfSpeech: "noun",
    definitions: [
      "A woodwind instrument with a double reed, a slender conical wooden tube, and a distinctive plaintive tone.",
      "The instrument that traditionally sounds the tuning pitch (A440) for an orchestra."
    ],
    synonyms: ["woodwind", "double reed"],
    crosswordNote: "Common clues: 'Orchestral tuner', 'Double-reed instrument', 'Concert pitch giver'.",
    source: "offline-core"
  },
  OREO: {
    word: "OREO",
    partOfSpeech: "noun",
    definitions: [
      "A trademark sandwich cookie consisting of two embossed chocolate wafers separated by a sweet creme filling."
    ],
    synonyms: ["sandwich cookie", "twistable treat"],
    crosswordNote: "Counted among the top 10 most common 4-letter crossword answers in history. Common clues: 'Twist-apart treat', 'Milk's favorite cookie'.",
    source: "offline-core"
  },
  OLEO: {
    word: "OLEO",
    partOfSpeech: "noun",
    definitions: [
      "Margarine; an older term for an artificial butter substitute made from vegetable oils."
    ],
    synonyms: ["margarine", "butter substitute"],
    crosswordNote: "Common clues: 'Toast spread', 'Butter alternative', 'Old spread'.",
    source: "offline-core"
  },
  ACME: {
    word: "ACME",
    partOfSpeech: "noun",
    definitions: [
      "The point at which someone or something is best, most perfect, or highest; zenith.",
      "Fictional corporation famous in Road Runner and Wile E. Coyote cartoons."
    ],
    synonyms: ["peak", "zenith", "pinnacle", "apex"],
    crosswordNote: "Common clues: 'Highest point', 'Apex', 'Zenith', 'Coyote's supplier'.",
    source: "offline-core"
  },
  APEX: {
    word: "APEX",
    partOfSpeech: "noun",
    definitions: [
      "The highest part or summit of something, especially one forming a point.",
      "The tip of a pyramid, cone, or mountain."
    ],
    synonyms: ["summit", "top", "pinnacle", "vertex"],
    crosswordNote: "Common clues: 'Mountain peak', 'Top of the pyramid', 'Peak'.",
    source: "offline-core"
  },
  ARIA: {
    word: "ARIA",
    partOfSpeech: "noun",
    definitions: [
      "A long, accompanied song for a solo voice, typically in an opera or oratorio."
    ],
    synonyms: ["solo", "operatic piece", "song"],
    crosswordNote: "Common clues: 'Opera solo', 'Diva's song', 'Puccini delivery'.",
    source: "offline-core"
  },
  AREA: {
    word: "AREA",
    partOfSpeech: "noun",
    definitions: [
      "The extent or measurement of a surface or piece of land (length × width).",
      "A particular region or field of activity."
    ],
    synonyms: ["region", "zone", "domain", "expanse"],
    crosswordNote: "Appears in crosswords constantly because of vowels A-E-A. Common clues: 'Square footage', 'Neighborhood', 'Zone'.",
    source: "offline-core"
  },
  ANOA: {
    word: "ANOA",
    partOfSpeech: "noun",
    definitions: [
      "A small wild buffalo native to Sulawesi, Indonesia."
    ],
    synonyms: ["dwarf buffalo"],
    crosswordNote: "A classic obscure animal crossword puzzle clue. Clue: 'Sulawesi ox' or 'Indonesian buffalo'.",
    source: "offline-core"
  },
  ELAN: {
    word: "ELAN",
    partOfSpeech: "noun",
    definitions: [
      "Energy, style, flair, and enthusiasm."
    ],
    synonyms: ["flair", "dash", "vigor", "verve"],
    crosswordNote: "Common clues: 'French flair', 'Verve', 'Spirited style'.",
    source: "offline-core"
  },
  EPEE: {
    word: "EPEE",
    partOfSpeech: "noun",
    definitions: [
      "A sharp-pointed dueling sword without a cutting edge, used in Olympic fencing."
    ],
    synonyms: ["fencing sword", "rapier variant"],
    crosswordNote: "Common clues: 'Olympic blade', 'Fencing weapon', 'Sword with a bell guard'.",
    source: "offline-core"
  },
  ODOR: {
    word: "ODOR",
    partOfSpeech: "noun",
    definitions: [
      "A distinctive smell, especially an unpleasant one."
    ],
    synonyms: ["scent", "smell", "aroma", "stench"],
    crosswordNote: "Common clues: 'Skunk defense', 'Aroma', 'Nose sensation'.",
    source: "offline-core"
  },
  TIARA: {
    word: "TIARA",
    partOfSpeech: "noun",
    definitions: [
      "A jeweled ornamental headpiece traditionally worn by women on formal occasions.",
      "A three-tiered crown formerly worn by popes."
    ],
    synonyms: ["coronet", "crown", "diadem"],
    crosswordNote: "Common clues: 'Pageant crown', 'Princess topper', 'Sparkling headpiece'.",
    source: "offline-core"
  },
  TREK: {
    word: "TREK",
    partOfSpeech: "noun",
    definitions: [
      "A long, arduous journey, typically made on foot.",
      "Short for 'Star Trek', the influential sci-fi franchise."
    ],
    synonyms: ["hike", "march", "expedition"],
    crosswordNote: "Common clues: 'Himalayan journey', 'Hike through the wilderness', 'Sci-fi franchise with Enterprise'.",
    source: "offline-core"
  }
};
