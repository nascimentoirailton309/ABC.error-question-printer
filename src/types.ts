export interface WordItem {
  word: string;
  sentence: string;
  translation: string;
  def: string;      // Child-friendly English definition/explanation
  keyword: string;  // Keyword for Unsplash query
}

export interface Unit {
  id: number;
  name: string;
  words: WordItem[];
}

export interface UserProgress {
  learnedWords: { [word: string]: boolean }; // word -> learned
  testScores: { [unitId: number]: number };   // unitId -> high score percentage
  stickers: string[];                        // list of earned sticker IDs
}

export interface TestQuestion {
  id: number;
  type: 'listening' | 'spelling' | 'context';
  word: WordItem;
  prompt: string;                        // e.g. "聽聲音，選出正確的單詞" or "拼寫這個單詞" or Fill in the blank sentence
  options?: string[];                    // for listening or context
  answer: string;                        // correct spelling or selected word
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  color: string;
}
