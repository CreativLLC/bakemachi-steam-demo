import { VOCABULARY } from '../../../japanese/vocabularyDB';
import { useVocabularyStore } from '../../../store/vocabularyStore';
import type { Word } from '../../../japanese/types';

/** Get words the player has encountered at least once, optionally filtered by minimum encounters */
export function getLearnedWords(minEncounters = 1): Word[] {
  const progress = useVocabularyStore.getState().progress;
  return VOCABULARY.filter(w => {
    const p = progress[w.id];
    return p && p.timesEncountered >= minEncounters;
  });
}

/** Get N random learned words. Falls back to any words if not enough learned. */
export function getRandomLearnedWords(count: number, exclude?: string[]): Word[] {
  let pool = getLearnedWords();
  if (exclude) pool = pool.filter(w => !exclude.includes(w.id));
  // If not enough learned words, add unlearned ones as fallback
  if (pool.length < count) {
    const extra = VOCABULARY.filter(w => !pool.some(p => p.id === w.id) && (!exclude || !exclude.includes(w.id)));
    pool = [...pool, ...extra];
  }
  // Fisher-Yates shuffle and take first N
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
