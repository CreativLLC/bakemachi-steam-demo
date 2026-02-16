# Bakemachi — Design Notes (Future Features)

> Written 2026-02-13 based on brainstorming + codebase analysis

## A. Third Station Event: The Monster Reveal ("The Vending Machine Incident")

### Trigger
Player has `stationFoodBought`, `stationDrinkBought`, AND `stationOmiyageBought` all true.

### Sequence
1. Player returns to Tanaka-san after buying omiyage. He says "Let's go to ouchi!"
2. As they walk toward exit, **lights flicker** (camera flash effect). Strange sounds.
3. **Pink-pigtails NPC** at (30,33) transforms — eyes distorted, repeats "ジュース...ジュース...ジュースください..." (vocabulary the player already learned)
4. Tanaka reacts with surprise but NOT confusion — he already knows about bakemono (secret society connection). Says: "化け物...! ここで?! だいじょうぶ. 戦う!" (A bakemono...! Here?! It's okay. Fight!)
5. **First combat** triggers against `bakemono_vending` (easy enemy, HP 40, uses juice/person vocabulary)
6. Post-combat: NPC snaps back to normal. Tanaka says "I'll explain at おうち. Don't tell anyone. わかった?" (quiz choice)
7. Station exit unlocked.

### New Enemy: bakemono_vending
- HP: 40, Attack: 6, Defense: 2 (easy tutorial fight)
- True identity: 人 (hito/person) — uses w_hito wordId
- Clues use station vocabulary player already knows (ジュース, 人)
- Reveal options: 人 (correct), 店員, 学生, 子供
- Combat dialogue: "ジュース...ください...!"

### New Vocabulary
- 化け物 (w_bakemono) — formally introduced
- 戦う (w_tatakau) — "fight!"
- わかった (new) — "understood"

### Implementation: New cutscene method `playMonsterRevealCutscene()` in OverworldScene, camera flash/shake effects, new dialogue nodes, new enemy in enemies.ts

---

## B. Combat System: Language-Driven Investigation

### Core Philosophy
Every combat action involves a Japanese language challenge. Player's Japanese ability IS their combat ability.

### Redesigned Actions

**Investigate (調べる) — Vocabulary Challenge**
- Enemy speaks garbled/partial sentence → player fills in the blank
- Example: "コンビニに___ます" → pick from [います, たべます, いきます, あります]
- Correct: earn a clue. Wrong: enemy attacks, no clue.

**Attack (攻撃) — Sentence Scramble**
- Scrambled word tiles (2-4 words), arrange in correct order
- Correct: full damage. Wrong/timeout: 50% damage.
- Reuses the sentence scramble mechanic!

**Defend (防御) — Reading Comprehension**
- Enemy attacks and says something in Japanese
- Player interprets: "What did the enemy say?" (multiple choice English)
- Correct: full defense bonus. Wrong: partial defense.

**Reveal (正体) — Identity Quiz** (same as current design)
- After gathering clues, guess the bakemono's true identity
- 4 choices, correct = massive damage + stun

### Difficulty Scaling
- Ch1: 2-word scrambles, single-word vocab quizzes, binary reading. Generous timing.
- Ch3-5: 3-4 word scrambles, particle fill-in, ambiguous readings.
- Ch8-10: Full sentences, grammar patterns, nuanced interpretation.

### Data Changes
Add `investigateChallenges`, `attackChallenges`, `defendChallenges` arrays to BakemonoEnemy — each with challenge type (vocab_match, scramble, reading) and associated data.

### UI
Reskin CombatUI with PixelPanel theming. Split layout: enemy (top) + challenge area (middle) + action buttons (bottom). Timer bar for timed challenges. Full gamepad support.

---

## C. Vocab Book (ことばのほん)

### Access
New menu option: ことば [V key]. `activeMenu: 'vocabbook'`.

### Layout
- Filter tabs: [All] [New] [Learning] [Known] + word counter "34/71"
- Scrollable word list grouped by category (Greetings, People, Places, etc.)
- Each entry shows: mastery stars (0-3), kanji/kana, romaji, meaning, stats (Seen Nx, Tapped Nx, JLPT level)
- Tap to expand: example sentence, part of speech, first seen date, progress bar
- Export to Anki button at bottom

### Mastery Stars
- 0 stars: new (never encountered)
- 1 star: seen (1-2 encounters)
- 2 stars: learning (3+ encounters, still tapping)
- 3 stars: known (10+ encounters, rarely tapping)

### Prerequisites
1. **Vocab persistence in Dexie** — currently in-memory only. Add vocabulary table to database.ts (version 3 schema upgrade, ~30 lines).
2. New component: `VocabBookScreen.tsx`
3. Extend activeMenu type in uiStore
4. Add V key binding in OverworldScene
5. Add to GameContainer render

---

## Implementation Order (Recommended)

1. **Vocab persistence in Dexie** (small, unblocks C)
2. **Vocab Book** (C) — standalone, useful immediately
3. **Monster Reveal** (A) — triggers first combat
4. **Combat redesign** (B) — largest scope, iterative
