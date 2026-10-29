/**
 * signLibrary — reference data source for the Learn ISL page.
 *
 * Today this returns a locally curated reference list. Later this can be
 * backed by a database or CMS (sign metadata, images, datasets) by replacing
 * the body of `getSigns()`. Components must not read the array directly.
 */

export type SignCategory =
  | "Alphabet"
  | "Numbers"
  | "Greetings"
  | "Basic Needs"
  | "Questions"
  | "Common Words";

export const SIGN_CATEGORIES: SignCategory[] = [
  "Alphabet",
  "Numbers",
  "Greetings",
  "Basic Needs",
  "Questions",
  "Common Words",
];

export interface SignEntry {
  id: string;
  name: string;
  category: SignCategory;
  description: string;
  example?: string;
  /** Reference illustration URL. `null` until a media source is connected. */
  imageUrl: string | null;
  /** Description of the handshape, used as accessible alt text. */
  imageAlt: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const alphabet: SignEntry[] = LETTERS.map((letter) => ({
  id: `alphabet-${letter.toLowerCase()}`,
  name: letter,
  category: "Alphabet",
  description: `Fingerspelling handshape for the letter ${letter}. Indian Sign Language fingerspelling uses both hands.`,
  example: `Spell your name letter by letter, starting with ${letter}.`,
  imageUrl: null,
  imageAlt: `Reference illustration for the Indian Sign Language fingerspelling handshape for the letter ${letter}`,
}));

const numbers: SignEntry[] = NUMBERS.map((digit) => ({
  id: `number-${digit}`,
  name: digit,
  category: "Numbers",
  description: `Hand configuration for the number ${digit}, shown with the palm facing the viewer.`,
  example: `Used for counting, prices, and time — for example "${digit} o'clock".`,
  imageUrl: null,
  imageAlt: `Reference illustration for the Indian Sign Language handshape for the number ${digit}`,
}));

const words: Omit<SignEntry, "imageUrl" | "imageAlt">[] = [
  {
    id: "greet-hello",
    name: "HELLO",
    category: "Greetings",
    description: "Open palm raised near the head, moved outward in a short arc.",
    example: "HELLO — used to open a conversation.",
  },
  {
    id: "greet-thankyou",
    name: "THANK YOU",
    category: "Greetings",
    description: "Both palms brought together at chest level with a slight forward bow.",
    example: "THANK YOU HELP — thanking someone for their help.",
  },
  {
    id: "greet-please",
    name: "PLEASE",
    category: "Greetings",
    description: "Flat hand circling over the chest.",
    example: "PLEASE WAIT.",
  },
  {
    id: "greet-sorry",
    name: "SORRY",
    category: "Greetings",
    description: "Closed hand circling over the chest, with an apologetic expression.",
    example: "SORRY LATE.",
  },
  {
    id: "need-water",
    name: "WATER",
    category: "Basic Needs",
    description: "Index and middle finger tap the lips, indicating drinking.",
    example: "I WANT WATER.",
  },
  {
    id: "need-food",
    name: "FOOD",
    category: "Basic Needs",
    description: "Fingertips gathered and moved towards the mouth.",
    example: "I WANT FOOD.",
  },
  {
    id: "need-medicine",
    name: "MEDICINE",
    category: "Basic Needs",
    description: "Index finger presses into the open palm with a small circular motion.",
    example: "I NEED MEDICINE.",
  },
  {
    id: "need-toilet",
    name: "TOILET",
    category: "Basic Needs",
    description: "Closed hand with the thumb between the fingers, shaken slightly.",
    example: "WHERE TOILET?",
  },
  {
    id: "need-help",
    name: "HELP",
    category: "Basic Needs",
    description: "One closed hand rests on the open palm of the other and both lift together.",
    example: "PLEASE HELP ME.",
  },
  {
    id: "q-what",
    name: "WHAT",
    category: "Questions",
    description: "Both palms turned upward with a questioning facial expression.",
    example: "WHAT NAME?",
  },
  {
    id: "q-where",
    name: "WHERE",
    category: "Questions",
    description: "Index finger raised and moved side to side.",
    example: "WHERE HOSPITAL?",
  },
  {
    id: "q-when",
    name: "WHEN",
    category: "Questions",
    description: "Index finger circles once and lands on the other index finger.",
    example: "WHEN DOCTOR COME?",
  },
  {
    id: "q-how",
    name: "HOW",
    category: "Questions",
    description: "Both curved hands rotate outward to face upward.",
    example: "HOW YOU?",
  },
  {
    id: "word-i",
    name: "I",
    category: "Common Words",
    description: "Index finger points towards the signer's own chest.",
    example: "I WANT WATER.",
  },
  {
    id: "word-you",
    name: "YOU",
    category: "Common Words",
    description: "Index finger points towards the person being addressed.",
    example: "YOU UNDERSTAND?",
  },
  {
    id: "word-want",
    name: "WANT",
    category: "Common Words",
    description: "Both open hands pull inward towards the body.",
    example: "I WANT FOOD.",
  },
  {
    id: "word-yes",
    name: "YES",
    category: "Common Words",
    description: "Closed hand nods forward from the wrist.",
    example: "YES, I UNDERSTAND.",
  },
  {
    id: "word-no",
    name: "NO",
    category: "Common Words",
    description: "Index and middle finger close onto the thumb once.",
    example: "NO, NOT NOW.",
  },
  {
    id: "word-name",
    name: "NAME",
    category: "Common Words",
    description: "Two fingers of each hand tap together twice.",
    example: "WHAT YOUR NAME?",
  },
  {
    id: "word-understand",
    name: "UNDERSTAND",
    category: "Common Words",
    description: "Index finger flicks upward beside the forehead.",
    example: "I UNDERSTAND.",
  },
];

const catalogue: SignEntry[] = [
  ...words.map((entry) => ({
    ...entry,
    imageUrl: null,
    imageAlt: `Reference illustration for the Indian Sign Language sign for ${entry.name}: ${entry.description}`,
  })),
  ...alphabet,
  ...numbers,
];

export interface SignQuery {
  category?: SignCategory | "All";
  search?: string;
}

/** Returns reference signs. Swap the body to read from a real data source. */
export async function getSigns(query: SignQuery = {}): Promise<SignEntry[]> {
  const search = query.search?.trim().toLowerCase() ?? "";
  return catalogue.filter((entry) => {
    const matchesCategory =
      !query.category || query.category === "All" || entry.category === query.category;
    const matchesSearch =
      !search ||
      entry.name.toLowerCase().includes(search) ||
      entry.description.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}
