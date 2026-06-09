import { WordItem, TestQuestion } from '../types';

// Let's generate a randomized set of child-friendly interactive questions!
export function generateTestQuestions(words: WordItem[]): TestQuestion[] {
  if (words.length === 0) return [];

  const list = [...words];
  // Shuffle list
  const shuffled = list.sort(() => 0.5 - Math.random());
  
  // Choose up to 8 words for a single test session, keeping it short and kid-friendly
  const targetWords = shuffled.slice(0, Math.min(8, shuffled.length));
  
  return targetWords.map((word, index) => {
    // Generate type randomly based on index to ensure balanced distribution
    const types: ('listening' | 'spelling' | 'context')[] = ['listening', 'spelling', 'context'];
    const type = types[index % types.length];

    // Build options (distractors)
    const options: string[] = [word.word];
    const otherWords = list.filter(w => w.word !== word.word).map(w => w.word);
    const shuffledOthers = otherWords.sort(() => 0.5 - Math.random());
    
    // Add 2 random distractor words
    shuffledOthers.slice(0, 2).forEach(item => options.push(item));
    // reshuffle options
    const finalOptions = options.sort(() => 0.5 - Math.random());

    let prompt = "";
    if (type === 'listening') {
      prompt = "👂 听声音，选出正确的单词！";
    } else if (type === 'spelling') {
      prompt = "✏️ 拼写魔法：请根据中文拼写出对应的单词！";
    } else {
      prompt = "📖 句子挑战：选出合适词语填空！";
    }

    return {
      id: index + 1,
      type,
      word,
      prompt,
      options: finalOptions,
      answer: word.word
    };
  });
}
