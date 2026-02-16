# Bakemachi (化ke Town) — Game Design Document

## Scope & Goals

### Target Vocabulary
- **~400 words across 10 chapters** (~40 words per chapter)
- Covers the most essential/common N5 vocabulary — not the full 800
- Priority: fun first, learning second. Players who feel overwhelmed quit. Players who have fun keep playing.
- Story dialogue teaches ~15 words/chapter; minigames + exploration teach ~25 words/chapter
- Players who want more can grind SRS on the side (the full N5 list lives in the SRS deck)
- Current story outline (story-outline.md) is good but needs expanded learning mechanics per chapter

### Setting Constraint
- **Everything happens in Bakemachi** — one city, many interiors, a few adjacent zones
- Keeps visual work manageable (shared tilesets, reused building interiors)
- Adjacent zones: graveyard, sports field, festival grounds, shrine forest, etc.
- Interior maps are small (12x10 tiles typical) and fast to produce

### Progressive Immersion (Critical Design Pillar)
**The game gradually shifts from English to Japanese. The player doesn't even notice the transition.**

- **Early game (Ch 1-3)**: Mostly English with Japanese words highlighted/bolded. Dialogue is SIMPLE.
  - "The shopkeeper says: これは 200円 です (This is 200 yen)"
  - Player sees English translation right next to every Japanese phrase
  - Dialogue choices show Japanese with English underneath
  - Keep it dead simple: "I want this." "Thank you." "More please." "Stop!" "Run!"
- **Mid game (Ch 4-6)**: Mixed. Known words appear in Japanese without translation. New words still get English.
  - "おにぎり を ください (onigiri please)" — player already knows おにぎり and ください, so no English needed for those
  - English hints get smaller, tucked under the text
  - Player starts recognizing patterns without consciously studying
- **Late game (Ch 7-10)**: Mostly Japanese with furigana. English only for new/complex words.
  - Full Japanese dialogue feels natural because every word was introduced gradually
  - Player is READING JAPANESE and it feels normal
  - The "aha" moment: "Wait, I just read that whole sentence without help"

**Dialogue simplicity rule**: Early dialogue should feel like a phrase book, not a novel.
- Good: 「これ、ください」「ありがとう」「にげて！」「だいじょうぶ？」
- Bad: 「この店のおにぎりはとてもおいしいと思いますが、値段が少し高いですね」(save this for Ch 8+)

### Map Production
- **Tiled editor** for all maps (exports JSON + tileset PNGs, Phaser native support)
- **GuttyKreum Kanagawa tileset** (32x32, Japanese suburban) for exteriors
- **PixelLab.ai** for supplementary terrain generation
- Pipeline: Make map in Tiled → export → drop in project folder → wire up in code

---

## Core Systems

### 1. Yen Economy (Stakes & Motivation)
**Everything revolves around yen (円). Yen gives Japanese answers real consequences.**

- **Why the player cares about yen:**
  - **Gear & combat power** — Buy weapons, armor, accessories that make combat easier. Classic RPG progression. Without gear upgrades, later bakemono are genuinely hard.
  - **Healing items** — Food/drinks heal HP. Running low on healing before a boss fight = real tension. Creates resource management ("do I buy potions or save for that sword?")
  - **Quest items** — Omiyage, supplies Okaasan asks for, gifts that unlock NPC subplots
  - **Cosmetics (bonus layer)** — Room decorations, character outfits. Nice-to-have, not essential.

- **Earning yen:**
  - Answering dialogue choices correctly on first try
  - Winning combat encounters (scales with difficulty)
  - Completing minigames with good scores
  - Finishing quests
  - Daily SRS review streaks (bonus yen)

- **Spending yen:**
  - Gear: weapons, armor, accessories (from blacksmith/shop)
  - Consumables: healing food/drinks, combat items
  - Quest items: omiyage, groceries, supplies
  - Cosmetics: room decorations, outfits (stretch goal)

- **Penalty model:** Getting answers wrong doesn't block progress — you can always retry or move on after a second attempt. But you DON'T get yen for wrong-first-try answers. This keeps the game non-punishing while rewarding mastery. The player who nails every answer has better gear and an easier time in combat.

### 2. SRS / Flashcard System
**A Duolingo/Anki-style review system built into the game.**

- **When:** Available anytime from the pause menu or at specific locations (Tanaka house study desk, school)
- **Session start prompt:** If the player hasn't played in 24+ hours, gently prompt "Want to review before continuing?" (2-3 min session, optional)
- **Format:** Show Japanese → pick English (or vice versa). Timed for bonus yen. Multiple rounds.
- **Spaced repetition:** Words the player gets wrong come back sooner. Mastered words fade out.
- **Integration:** Words learned through story/minigames automatically enter the SRS deck
- **Reward:** Yen for correct answers. Streak bonuses for consecutive days.

### 3. Story Journal
**A "Previously on Bakemachi..." catch-up system.**

- Accessible from pause menu at any time
- Auto-updates after each story beat / chapter completion
- Short summaries: "You arrived in Bakemachi by train. The Tanaka family's fixer met you at the station. You bought food at the konbini and met a strange clerk..."
- Also tracks current quest objective ("Go buy omiyage for your host family")
- Helps returning players who took a break remember where they are

### 4. Quest System (Chapter Progression)
**Simple quest markers guide the player through each chapter's content.**

- Each chapter has a sequence of quests (some linear, some parallel)
- Player must complete all chapter quests before the chapter-ending story event triggers
- Quests naturally lead the player through: story dialogue → exploration → minigames → combat
- Examples: "Buy food at the konbini", "Find omiyage for the Tanaka family", "Talk to Sensei after school"
- Quest log visible in journal / HUD

---

## Minigame Catalog

All minigames follow the same reward model: yen for good performance, no yen (but still progress) for mistakes. Combat is just one minigame among many — the game is NOT primarily a combat game.

### CORE MINIGAMES (build these first, reuse everywhere)

#### 1. Shopping / Buying
**Where:** Konbini, station shops, market stalls, restaurants, festival stalls, gift shops
**How:** Pick items from shelves/menu → transaction dialogue → pay with yen
**Game element:** Shopkeeper says price in Japanese, you pick the right yen amount from your wallet. Get it right = bonus yen. Wrong = overpay (lose yen but still get the item).
**Variants:** Simple item pick (Ch1) → read a menu and order (Ch4) → haggle at market (Ch6) → read-only Japanese menu (Ch8+)
**Chapters:** ALL — this is the most reusable minigame

#### 2. Conversation / Dialogue
**Where:** Every NPC interaction that requires a response
**How:** NPC speaks → player picks from 2-4 response options (in Japanese)
**Game element:** First try correct = yen. Wrong first try = can retry but no yen. Some convos branch based on answer (flavor only, not game-breaking).
**Variants:** Simple greetings (Ch1) → opinions (Ch4) → complex multi-turn (Ch7+)
**Chapters:** ALL

#### 3. Combat (Bakemono Encounters)
**Where:** Story-triggered encounters, optional roaming bakemono in later chapters
**How:** TBD — needs more design work. Current concept: investigate → reveal → fight
**Game element:** Vocabulary-powered somehow. Details to be figured out — combat should feel fun on its own merits, not just "quiz with HP bars"
**Design note:** Combat is ONE minigame, not the core of the game. Keep it tight and fast. A single encounter should be 2-3 minutes, not 10.
**Variants:** Tutorial fight (Ch1) → solo fights (Ch2-5) → party fights with Kenji (Ch6+) → boss fights (Ch3,6,8,10)
**Chapters:** ALL (1-2 per chapter minimum)

#### 4. SRS / Flashcard Review
**Where:** Study desk at Tanaka house, school, pause menu
**How:** Duolingo/Anki style — see word, pick meaning. Spaced repetition scheduling.
**Game element:** Streak bonuses (consecutive days = bonus yen). Timed mode for extra yen. Optional but incentivized.
**Chapters:** Available from Ch1 onward, never required

### SECONDARY MINIGAMES (build as needed per chapter)

#### 5. Reading Signs / Environmental Text
**Where:** Signs, posters, letters, menus, labels around town
**How:** Examine an object → Japanese text appears → multiple choice question about what it says
**Game element:** Yen reward. Some signs give hints for quests or secrets.
**Chapters:** ALL (passive, player-initiated)

#### 6. Cooking / Recipe Following
**Where:** Tanaka house kitchen, cooking class, restaurant back kitchen
**How:** Follow a recipe written in Japanese — pick the right ingredients, do steps in order
**Game element:** Timer, accuracy. Good dish = yen + healing item. Bad dish = funny result + less yen.
**Chapters:** Ch4+ (home life focus)

#### 7. Direction Following / Giving
**Where:** Town exploration, quest objectives
**How:** NPC gives directions in Japanese ("go right, then straight, it's on the left") → you navigate there. Or reverse: someone asks YOU for directions and you pick the right Japanese response.
**Game element:** Find the destination = yen. Wrong turns = you get lost (minor time penalty).
**Chapters:** Ch1 (simple), Ch5+ (complex routes)

#### 8. Part-Time Job
**Where:** Konbini, restaurant, festival stall, post office
**How:** Job-specific tasks that require reading Japanese — stock shelves (match labels), take restaurant orders (listen + write), sort mail (read addresses)
**Game element:** Performance-based yen pay. Great way to grind yen AND vocab.
**Chapters:** Ch3+ (after settling into town life)

#### 9. Phone / Text Messages
**Where:** Player's phone (accessible from menu)
**How:** Receive texts from Kenji, Okaasan, etc. Read Japanese messages, pick responses.
**Game element:** Builds relationships. Wrong answers = funny misunderstandings. Right answers = yen tips or quest hints.
**Chapters:** Ch2+ (after getting a phone)

#### 10. Festival Booth Games
**Where:** Festival chapter (Ch6), but could appear at school events too
**How:** Carnival-style games with vocab twist — ring toss at kanji targets, goldfish scooping where fish have words on them, shooting gallery with vocab
**Game element:** Pure fun + yen prizes. Lighthearted break from story tension.
**Chapters:** Ch6 primarily

#### 11. Scavenger Hunt / Fetch Quest
**Where:** Various — town-wide, school, festival, station
**How:** Given a list of items in Japanese → find them around the map → bring them back
**Game element:** Exploration + reading comprehension. Rewards scale with speed.
**Chapters:** Any chapter as side content

#### 12. Eavesdropping / Listening
**Where:** Overhear NPC conversations in public places (future — requires audio)
**How:** Audio plays a conversation → player answers questions about what was said
**Game element:** Bonus yen for catching details. Not required for progression.
**Chapters:** Ch3+ (stretch goal, needs audio assets)

#### 13. Matching / Memory Card Game
**Where:** School club activity, festival booth, Tanaka house (board game with Yuu)
**How:** Classic memory match — flip cards to match Japanese word with English meaning (or kanji with kana)
**Game element:** Timed, fewest flips = more yen. Good review mechanic disguised as a game.
**Chapters:** Ch2+ as optional side activity

#### 14. Calligraphy / Writing Practice
**Where:** School, cultural club with Sensei
**How:** Trace kana/kanji on screen (touch/mouse input)
**Game element:** Accuracy score. Beautiful visual feedback. Meditative pace — contrast to combat.
**Chapters:** Ch3+ (stretch goal, needs stroke-order data)

### MINIGAME PRIORITY FOR DEVELOPMENT
| Priority | Minigame | Why |
|----------|----------|-----|
| P0 | Shopping/Buying | Used in Ch1, reusable everywhere |
| P0 | Conversation/Dialogue | Every NPC interaction |
| P0 | Combat | Core story mechanic |
| P0 | SRS Flashcards | Retention system |
| P1 | Reading Signs | Easy to build, passive learning |
| P1 | Direction Following | Natural for exploration |
| P1 | Phone/Text Messages | Great Ch2+ engagement loop |
| P2 | Cooking | Ch4 feature, fun but scoped |
| P2 | Part-Time Job | Great yen grind mechanic |
| P2 | Matching/Memory | Easy to build, good review |
| P3 | Festival Booths | Ch6 specific |
| P3 | Scavenger Hunt | Side content |
| P3 | Eavesdropping | Needs audio |
| P3 | Calligraphy | Needs stroke data |

---

## Chapter 1 Detailed Design: Welcome to Bakemachi

### Target: ~40 words
### Locations: Train, Train Station, Town (brief walk), Konbini, Tanaka House
### Design philosophy: PLAY first, learn along the way. Each scene has gameplay THEN introduces a few words naturally. Never more than 6-8 new words before the player gets to DO something fun.

### Flow

#### Scene 1: Train Ride — "Phrasebook" Tutorial
**Words: 6 (greetings + survival basics)**
- Player is on the train heading to Bakemachi
- **SRS Tutorial minigame**: Flashcard-style "you're flipping through your phrasebook"
  - こんにちは (hello), ありがとう (thanks), すみません (excuse me)
  - はい (yes), いいえ (no), お願いします (please)
- Short and sweet — just enough to survive a basic greeting
- Train announcement: 「次は、化け町」 (Next stop: Bakemachi)
- Player arrives at the platform

#### Scene 2: Train Station — Meeting the Fixer
**Words: 0 new (reinforcement only)**
- Fixer meets you at the platform
- **Conversation minigame**: Uses the 6 words you just learned
  - Fixer: 「こんにちは！」 → Player picks response
  - Player practices greetings in a real context
- This is GAMEPLAY, not a vocab dump — the player is testing what they just learned
- Fixer: "You must be hungry. Let me show you around the station."

#### Scene 3: Train Station — Buying Food
**Words: 8 (food, drink, basic transaction phrases)**
- Fixer walks you to a station food stall
- Yen tutorial: Fixer hands you 5000円
- **Shopping minigame**: Pick food items, complete the transaction
  - みず (water), おちゃ (tea), おにぎり (onigiri), パン (bread)
  - これ (this), ください (please), いくら (how much), 円 (yen)
- The GAME part: shopkeeper says a price in Japanese, you pick the right yen amount from your wallet. Get it right = bonus yen. Get it wrong = you still get the food but overpay.
- Player eats, gets to explore the station a bit freely

#### Scene 4: Train Station — Omiyage Quest
**Words: 4 (gift/politeness)**
- Fixer: "Oh! We should buy おみやげ for your host family. It's polite."
  - おみやげ (gift/souvenir), おかし (sweets), どれ (which one), いい (good)
- **Shopping minigame (variant)**: Pick a gift from a small shop
- Lighter than Scene 3 — only 4 new words because the shopping mechanic is already familiar
- Player is practicing the BUY flow again but with confidence now

#### Scene 5: Walk to Tanaka House
**Words: 8 (directions, family, house)**
- Walk through town — fixer points things out as you go (brief, scenic, no minigame)
  - みぎ (right), ひだり (left), まっすぐ (straight), ここ (here)
- Arrive at Tanaka house
  - おかあさん (host mom), うち (home), おじゃまします (pardon the intrusion)
  - はじめまして (nice to meet you)
- **Conversation minigame**: Introduce yourself to Okaasan
- Okaasan is warm, shows you your room. You settle in. Quiet moment.

#### Scene 6: Konbini Evening — The Calm Before the Storm
**Words: 6 (evening routine, konbini items)**
- Okaasan: "Can you go buy a few things for ばんごはん (dinner)?"
  - ばんごはん (dinner), ぎゅうにゅう (milk), たまご (egg)
  - いくつ (how many), ひとつ (one), ふたつ (two)
- Walk to konbini on your own for the first time (player explores freely!)
- **Shopping minigame (hardest yet)**: Buy from a short list, count items, handle prices
- You complete the purchase. The clerk smiles.

#### Scene 7: First Bakemono Encounter
**Words: 8 (combat, emotions, supernatural)**
- The clerk's eyes go dark. Transformation. First bakemono.
  - こわい (scary), だいじょうぶ (it's okay), あぶない (dangerous)
  - たたかう (fight), まもる (defend)
  - ばけもの (monster), へん (strange), なに (what)
- **Combat tutorial**: Guided first fight. Learn the investigate → reveal → fight loop.
- Player wins. Clerk snaps back. Nobody noticed.
- Walk home shaken. Look out window — was that someone watching?

#### Scene 8: End of Day — Breathe
**Words: 0 new (review + consolidation)**
- At Tanaka house:
  - **SRS review at study desk** (optional — review the 40 words from today)
  - **Journal updates** with story summary
  - Explore the house freely (environmental labels on objects, no pressure)
- Chapter 1 complete. Chapter 2 unlocks.

### Chapter 1 Word Count Breakdown
| Scene | New Words | Cumulative | Primary Method |
|-------|-----------|------------|----------------|
| Train ride | 6 | 6 | SRS flashcard tutorial |
| Meet fixer | 0 | 6 | Conversation minigame (reinforcement) |
| Buy food | 8 | 14 | Shopping minigame |
| Omiyage | 4 | 18 | Shopping minigame (light) |
| Walk + house | 8 | 26 | Dialogue + conversation minigame |
| Konbini evening | 6 | 32 | Shopping minigame (advanced) |
| First combat | 8 | 40 | Combat tutorial |
| End of day | 0 | **40** | SRS review (optional) |

**Pacing note:** Never more than 8 new words between gameplay segments. The player spends more time PLAYING (shopping, exploring, fighting) than studying. Words are introduced in context, then reinforced by the minigame immediately after. By the end, the player has used each word 2-3 times minimum.

---

## Resolved Design Decisions

- **Word count**: ~40 per chapter, ~400 total. Fun > completeness. SRS has the full N5 list for grinders.
- **Yen purpose**: Gear + healing (RPG loop), with cosmetics as a stretch goal. Yen = combat power.
- **Scope**: All in Bakemachi. One city, many interiors, a few adjacent zones. 10 chapters.
- **Progressive immersion**: English-heavy early, gradually shifting to Japanese-dominant. Player reads Japanese naturally by late game.
- **Dialogue simplicity**: Early chapters use phrasebook-level sentences. "I want this." "Run!" "Thank you." No complex grammar until it's been taught.
- **Combat is a minigame**: Not the core identity. The game is an RPG with many minigames, combat being one. Keep encounters short (2-3 min).

## Open Design Questions

1. **Combat design**: Current investigate→reveal→fight concept needs fleshing out. How do we make it FUN, not just a vocab quiz with HP? What makes a player WANT to fight? (Answer probably: yen + gear + story.)
2. **Gear system**: What kinds of gear? Weapon + armor + accessory? Or simpler? How does gear tie to Japanese learning (if at all)?
3. **Time-of-day system**: Should the game have morning/afternoon/evening cycles that gate content? (Persona-style)
4. **Difficulty settings**: Should there be a "I know some Japanese" mode that skips easier words?
5. **Voice acting**: Even partial VA (greetings, key phrases) would help listening. AI-generated?
6. **Mobile**: Touch controls? (Phaser supports it, but UI needs thought)
7. **Chapter 1 word list**: Need to finalize the exact 40 words for train station + konbini + home.
8. **Part-time jobs**: When do these unlock? What jobs? How do they scale with language level?
9. **Phone system**: When does the player get a phone? Who texts them? How does this drive engagement between play sessions?
