import type { TextSegment } from './types';
import { getWord } from './vocabularyDB';

/** Join segments into a plain string */
export function parseSegments(segments: TextSegment[]): string {
  return segments.map((s) => s.text).join('');
}

/**
 * Returns the display form of a segment based on the player's current chapter.
 * Words with introductionLevel <= playerChapter show in kanji.
 * Words above the player's level show in kana (gradual rollout).
 */
export function getDisplayText(segment: TextSegment, playerChapter: number): string {
  if (!segment.wordId || segment.type !== 'word') {
    return segment.text;
  }

  const word = getWord(segment.wordId);
  if (!word) return segment.text;

  // Show kanji form if the player has reached this word's introduction level
  if (playerChapter >= word.introductionLevel) {
    return word.kanji;
  }

  // Otherwise show kana form
  return word.kana;
}

/**
 * Render a full array of segments with appropriate display forms.
 */
export function renderSegments(segments: TextSegment[], playerChapter: number): string {
  return segments.map((s) => getDisplayText(s, playerChapter)).join('');
}
