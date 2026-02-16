# Bakemachi (化け町) — Development Progress

> Last updated: 2026-02-15 (fortieth session — Quest tracker HUD, journal menu tab, vendor consolidation, sister's present scramble, reading game polish)

## Quick Status
- **Current Phase**: Chapter 1 implementation (station + town exploration) + Combat system + XP/level progression + NPC-initiated random encounters
- **Playable Flow**: Title → Train tutorial → Station arrival cutscene → Station exploration (food/drink buying, vending machine interactions, matching minigame, sentence scramble minigame, reading comprehension minigame, omiyage quest, phone call scene, 5 NPCs, combat encounter + quest arrow tutorial system) → Tiled train station (32px Modern Exteriors, 33x24 tiles, 18 interaction zones, foreground overlay layer) → Town outdoor (walk around, talk to NPCs, enter konbini/house)
- **Chapter 1 Completion**: ~70% (station done with 4 minigames + quests + phone call scene + combat + NPC-based random encounters + XP system, town map built, konbini/house interiors exist, story scripting incomplete)
- **Combat**: Full mini-game-based turn-based combat system with 3 attack types, timer mechanics, weakness system, item usage, victory rewards, XP rewards, and level-up system
- **Progression**: XP/level system grants stat increases (max energy, combat HP), character status menu shows level/HP/energy/vocab progress
- **Menu System**: Title screen, dialogue box, unified RPG menu (status/inventory/vocab/journal/settings tabs), quest tracker HUD, gamepad support
- **Map Rendering**: Hybrid approach — Tiled editor for creating/exporting maps + composite PNG rendering for initial integration. Player uses LPC generator spritesheet (64px, 4-direction). All NPCs now use LPC spritesheets loaded from a data-driven registry (`LPC_NPC_REGISTRY` in BootScene). Old rotation-based 8-direction PNG system fully removed.

---

## Chapter Implementation Status

### Chapter 1: Welcome to Bakemachi (ようこそ、化け町へ)
- [x] Train ride vocabulary tutorial — `src/game/scenes/TrainRideScene.ts`
- [x] Train station map (26x25 tiles) — `src/game/maps/chapter1/trainStation.ts`
- [x] Station arrival cutscene (Tanaka-san greeting, dialogue choices) — `src/game/scenes/OverworldScene.ts`
- [x] Food stall + vending machine purchasing system — `src/ui/components/FoodSelectionMenu.tsx`, `src/data/foodMenuData.ts`
- [x] Food matching minigame (3 food stalls + 1 gift shop with first-try bonus) — `src/ui/components/FoodMatchingGame.tsx`
- [x] Sentence scramble minigame (omiyage vendor, teaches particles を and の) — `src/ui/components/SentenceScramble.tsx`
- [x] Reading comprehension minigame (postcard shop, read Japanese text and pick correct answer) — `src/ui/components/ReadingGame.tsx`
- [x] Phone call scene (after cowlick fight, player calls Mom before leaving station) — 15-node dialogue chain, quest-gates gift shop & postcard quests
- [x] Gift shop quest (sister's present) — Sentence scramble minigame for buying pocket creature toy
- [x] Postcard quest (grandma's postcard) — Reading comprehension minigame with 4 postcards
- [x] Station NPC dialogue (welcome, food prompt, food reminder, food done, omiyage quest chain, phone call, gift shop, postcard shop)
- [x] Dialogue quiz system (Tanaka greeting quiz with first-try ¥50 bonus)
- [x] Omiyage quest chain (Tanaka prompts → buy dango from vendor → complete quest)
- [x] Town outdoor map (70x55 tiles) — `src/game/maps/chapter1/townOutdoor.ts`
- [x] Konbini interior map (12x10 tiles, cooler walls, real NPC sprites) — `src/game/maps/chapter1/konbiniInterior.ts`
- [x] Tanaka house interior map (12x10 tiles) — `src/game/maps/chapter1/tanakaHouse.ts`
- [ ] Town flavor NPCs (removed old rotation-based NPCs, will be rebuilt with LPC spritesheets when town is redesigned)
- [x] Map transitions: station ↔ town ↔ konbini, town ↔ Tanaka house
- [x] Combat system — Full mini-game-based turn-based combat with 3 attack types, timer mechanics, weakness system
- [x] First combat encounter — 化けメガネくん (Possessed Glasses Guy) at train station
- [x] Random encounter NPC system — NPCs approach player, transform into monsters, combat, post-combat dialogue, walk off
- [ ] Konbini clerk transformation sequence (second combat encounter — design exists but not implemented)
- [ ] Chapter 1 story scripting — `src/data/chapters/chapter1.ts` (file exists, empty)
- [ ] Tanaka house arrival sequence
- [ ] End-of-chapter scene (watching from window)

### Chapters 2-10
Not started. See `docs/story-outline.md` for full plan.

---

## Systems & Features

### Core Engine
- [x] Phaser 3.90 + React 19 integration — `src/App.tsx`, `src/game/config.ts` (RESIZE scale mode for full viewport rendering)
- [x] Zustand state management bridging Phaser ↔ React — `src/store/gameStore.ts`, `src/store/uiStore.ts`
- [x] Dexie.js IndexedDB persistence — `src/store/database.ts` (yen, questStates, inventory auto-save with 500ms debounce)
- [x] Scene management: BootScene → TitleScene → TrainRideScene → OverworldScene
- [x] Asset loading pipeline — `src/game/scenes/BootScene.ts`
- [x] Gamepad/controller support — `src/game/inputBus.ts`, `src/ui/hooks/useInputAction.ts` (event bus pattern, A/B/Start button mapping, D-pad + left stick navigation, dynamic input hints)

### Overworld
- [x] Tile-based map rendering with ground/object/decoration layers — `src/game/maps/TownMap.ts`
- [x] Composite PNG ground layer rendering (PixelLab.ai exports) — `src/game/scenes/OverworldScene.ts`
  - If `map.groundImage` is set, renders pre-rendered PNG as ground layer with scaling from source tile size to 64px game tiles
  - Collision derived from terrain data (grass=blocked, concrete/paths=walkable)
- [x] Foreground PNG layer rendering — `src/game/scenes/OverworldScene.ts`
  - If `map.foregroundImage` is set, renders PNG at depth 999998 (above characters, below UI)
  - Supports manual Tiled layer exports for overlays like roofs/signs
- [x] Collision system (walkable, blocked, soft)
- [x] Map transitions between areas
- [x] Y-depth sorting for sprite overlap
- [x] 8-directional player movement (WASD + arrow keys + gamepad D-pad/left stick)
- [x] NPC rendering and interaction (Space key + gamepad A button)
- [x] Cutscene system (walkNPC, dialogue sequencing, camera fades)
- [x] Decoration system with widthTiles-based scaling

### Dialogue
- [x] Multi-line dialogue with segmented Japanese text — `src/ui/components/DialogueBox.tsx`
- [x] Press-and-hold word info popup — `src/ui/components/WordPopup.tsx`
- [x] Choice branching in dialogue nodes
- [x] Dialogue triggers for combat and food menus
- [x] Speaker name display

### Japanese Learning
- [x] 79-word vocabulary database — `src/japanese/vocabularyDB.ts`
- [x] 7 grammar patterns — `src/japanese/grammarDB.ts`
- [x] Text parser with word/particle/grammar segment types — `src/japanese/textParser.ts`
- [x] Vocabulary progress tracking — `src/store/vocabularyStore.ts`
- [x] Vocabulary persistence to IndexedDB — `src/store/database.ts` (auto-save/load)
- [x] Anki export capability — `src/japanese/ankiExporter.ts`
- [x] Gradual kanji rollout via introductionLevel
- [x] Dialogue quiz system with first-try bonus tracking — `src/japanese/types.ts`, `src/ui/components/DialogueBox.tsx`
- [x] Sentence scramble minigame — `src/ui/components/SentenceScramble.tsx`, `src/data/scrambleData.ts`
- [x] Reading comprehension minigame — `src/ui/components/ReadingGame.tsx`, `src/data/readingData.ts` (read Japanese passages, pick correct answer)
- [x] Energy system — Learning mechanic that drives game loop and SRS repetition
  - `energy` and `maxEnergy` fields in gameStore — `src/store/gameStore.ts`
  - Default: 100/100 energy at start of chapter
  - **Energy drain**: Every new word encountered costs 2 energy (`ENERGY_PER_NEW_WORD = 2` in vocabularyStore)
  - Drain happens automatically via `markEncountered()` — no per-word configuration needed
  - Train tutorial words are exempt (checks `currentScene !== 'TrainRideScene'`)
  - **Visual feedback**: PlayerHUD displays blue energy bar with lightning icon — `src/ui/components/PlayerHUD.tsx`
  - Energy bar uses pixel art base (`bar-energy-blue.png`) with `bar-energy-empty-section.png` overlay images (4 sections at 25% each, stacked right-to-left)
  - **Future design**: When energy hits 0 → NPCs say "You look tired" → modal forces player to return home, review words via SRS, and sleep to restore energy
- [x] Unified RPG Menu (ゲームメニュー) — `src/ui/components/GameMenu.tsx` (~659 lines, classic RPG layout: left tabs + right content)
  - もちもの (Inventory) tab: item grid with quantities
  - ことば (Vocab Book) tab: encountered words, filter by mastery level, tap to expand
  - せってい (Settings) tab: romaji toggle + combat difficulty selector (easy/medium/hard segmented control)
  - Opens via I key (keyboard) / Y button (gamepad) / メニュー button in MenuBar
  - V key opens directly to Vocab tab, Select button opens Settings tab
  - Esc / B closes menu

### Combat
- [x] Turn-based combat system — Mini-game-based combat with phase state machine — `src/store/combatStore.ts`
- [x] Enemy configuration system — `src/data/combatConfig.ts`
- [x] Combat UI component — Full-screen JRPG arena with actual LPC sprites and visual effects — `src/ui/components/CombatScreen.tsx` (1422 lines)
  - **Full-screen black arena** replacing old PixelPanel-wrapped layout
  - **Actual LPC character sprites** for both player and enemy (192x192px rendered at 3x scale from 64x64 source)
    - Player on RIGHT side facing left (LPC west row)
    - Enemy on LEFT side facing right (LPC east row)
  - **Combat entry transition**: white flash + screen shatter effect (6x4 grid of shards flying outward)
  - **Idle animation**: both sprites breathe/bob using 2-frame idle spritesheet loop
    - Player uses `combat` spritesheet for idle pose (standing battle stance) instead of regular idle
    - Enemy uses `combat` spritesheet for idle pose (standing battle stance) instead of regular idle
    - Between victory jump cycles, player reverts to regular `idle` standing pose (not combat stance)
  - **Attack animations** for both player and enemy:
    - Sprite slides toward opponent (300ms CSS transition)
    - Plays 8-frame slash animation from `1h_slash.png` at ~12fps
    - At impact frame: target flashes white, floating damage number appears
    - Screen shake + red flash overlay when player takes damage
    - Sprite slides back to position
  - **Floating damage numbers** that float upward with fade-out
  - **Compact top HUD** — HP bars moved from inline to top-of-screen panels — `src/ui/components/CombatHUD.tsx`
    - Heart icon + character name + HP numbers (current/max)
    - Color-coded HP bar: green → orange → red with low-HP pulse animation
    - HUDBar component renders inline HP bar — `src/ui/components/combat/HUDBar.tsx`
  - **Clean arena** — No inline name labels or HP bars beside sprites, just floating damage numbers
  - **Compact bottom panel** — Reduced padding/gaps throughout action buttons and mini-games
  - **Animation sequencer** (`useAnimSequencer` hook) manages all timing
  - **Victory animations**:
    - Enemy plays 6-frame `hurt` animation and collapses
    - Player plays continuous jump celebration (5 frames from `jump.png`, 120ms/frame, 500ms pause between loops)
    - React Strict Mode compatible fire-and-forget setTimeout pattern with ref guard
  - **NPC transform-back flicker** — Post-victory visual effect for possessed NPC enemies
    - `npcSpriteBase` optional field on CombatEnemy (e.g., cowlick_npc has NPC4 sprite path)
    - After enemy collapse, screen flickers between goblin and NPC sprite with accelerating pattern
    - Ends showing NPC sprite (de-possession visual feedback)
    - System is reusable for all future NPC-based encounters
- [x] Timer mechanic — Per-minigame timers with 3 damage tiers (fast/medium/slow) + timer off accessibility mode — `src/ui/components/combat/CombatTimer.tsx`
  - **Per-minigame base timers** (medium difficulty): Vocab Quiz 10s, Quick Match 15s, Word Scramble 20s — `GAME_TIMERS` in `src/data/combatConfig.ts`
  - **4 difficulty settings**: Timer Off (no timer, always fast tier), Easy (1.5x time), Medium (1.0x), Hard (0.7x time)
  - **Timer Off mode**: No timer bar shown, player always receives 1.5x damage (best tier) — accessibility/chill mode
  - Difficulty stored in uiStore, selectable from Settings tab via 4-button segmented control — `src/ui/components/GameMenu.tsx`
  - `getGameTimer()` returns `totalMs: 0` for 'off' difficulty — all 3 minigames conditionally hide CombatTimer when totalMs === 0
  - `getTierFromElapsed()` in CombatTimer accepts optional custom thresholds for per-game tier calculations
- [x] Attack types — 3 Japanese learning mini-games:
  - **ことばクイズ** (Vocabulary Quiz) — 4-choice quiz from learned words — `src/ui/components/combat/VocabQuizBattle.tsx`
  - **マッチング** (Quick Match) — Match 2 word-meaning pairs quickly — `src/ui/components/combat/QuickMatchBattle.tsx`
  - **ならべかえ** (Word Scramble) — Unscramble kana to form word — `src/ui/components/combat/WordScrambleBattle.tsx`
- [x] Weakness system — Enemies randomly weak to one attack type per round (1.5x bonus)
- [x] Damage formula — Base 25 × tier multiplier (1.5x/1.0x/0.5x) × weakness bonus
- [x] Enemy AI — Random attacks with 15 base damage, 0.8-1.2x variance
- [x] Item usage — Food/drink items heal HP during combat
- [x] Victory rewards — 500 yen for first enemy
- [x] First enemy — 化けメガネくん (Possessed Glasses Guy), 120 HP, triggered via NPC dialogue at station
- [x] Quest gating — `battle_cowlick_npc_done` prevents re-triggering combat
- [x] Learned words system — `getLearnedWords.ts` utility fetches encountered vocabulary for quiz generation
- [x] Pre-battle dialogue improvements — NPC transformation sequence with monster transformation visual narration
  - **nextDialogue chaining**: `nextDialogue` field on DialogueNode type allows dialogue to automatically chain to next dialogue
  - **npcDialogue.ts**: Rewrote cowlick-glasses dialogue to show NPC dramatically transforming into a monster ("ばけもの に なった！")
  - **uiStore.ts**: Added nextDialogue handling — when current dialogue ends, chains to next dialogue instead of closing
  - **Player reaction**: Player character reacts with scared portrait: "ばけもの！？ たたかう！" before combat starts
- [x] Random encounter NPC system — Step-based random battles using NPC approach sequences
  - **Encounter flow**: Step counter → spawn LPC NPC at camera viewport edge → walk to player → pre-combat dialogue → NPC transforms → combat → post-combat dialogue → walk off
  - **NPC sprite pool**: `EncounterConfig.npcSprites` field specifies LPC spritesheet prefixes for disguised yokai appearance
  - **Pre-combat dialogues**: 4 variations (headache, lost, sudden, polite snap) — `RANDOM_ENCOUNTER_PRE_COMBAT` in `npcDialogue.ts`
  - **Post-combat dialogues**: 4 variations (confused, hurt, sorry, what happened) — `RANDOM_ENCOUNTER_POST_COMBAT` in `npcDialogue.ts`
  - **isRandomEncounter flag**: Prevents CombatScreen from duplicating post-combat dialogue already shown in sequence
  - **Enemy sprites**: All combat enemies now use `goblin2` sprite from `public/assets/sprites/NPCs/generic/goblin2/standard/`
  - **Cleanup**: Encounter NPCs removed from scene and destroyed after walk-off, also cleaned up on map transition

### UI
- [x] Title screen — `src/ui/components/TitleScreen.tsx` (gamepad D-pad navigation + A button selection, full viewport scaling)
- [x] Train ride tutorial overlay — `src/ui/components/TrainTutorial.tsx` (full viewport scaling)
- [x] Dialogue box with Japanese text segments — `src/ui/components/DialogueBox.tsx` (reskinned with Limezu Modern UI, DotGothic16 font, enlarged portrait, thicker borders, quiz feedback with bounce/shake animations, yen gain animation, gamepad D-pad choice navigation + A button confirm, dynamic input hints)
- [x] Word popup (press-and-hold) — `src/ui/components/WordPopup.tsx` (reskinned with Limezu Modern UI, DotGothic16 font, thicker borders, conditional romaji display)
- [x] Food/drink selection menu — `src/ui/components/FoodSelectionMenu.tsx` (reskinned with Limezu Modern UI, DotGothic16 font, yen coin icon)
- [x] Food matching game — `src/ui/components/FoodMatchingGame.tsx` (reset-on-wrong mechanic, first-try ¥100 bonus, dark text, yen coin icon, feedbackKey counter for animation re-triggering, faster timers, inventory + notification integration)
- [x] Player HUD — `src/ui/components/PlayerHUD.tsx` (enlarged portrait with rounded PixelPanel, yen coin icon, yen spend/gain animations)
- [x] Menu bar — `src/ui/components/MenuBar.tsx` (bottom-right floating メニュー button, opens unified RPG menu, keyboard/gamepad hints, hidden during dialogue/matching/menus)
- [x] Item toast notifications — `src/ui/components/ItemToast.tsx` (shows item icon + name when purchased, auto-dismisses, aligned with PlayerHUD)
- [x] Tutorial overlay system — `src/ui/components/TutorialOverlay.tsx` (reusable step-by-step tutorial component)
  - **Spotlight highlighting**: Steps can target elements via `data-tutorial` attributes with CSS box-shadow cutout effect
  - **Callout positioning**: Automatically positions callout above/below highlighted elements, centered for general steps
  - **Step indicators**: Dot-based progress indicators showing current position in tutorial
  - **Gamepad support**: A button advances tutorial steps
  - **Auto-repositioning**: Spotlight adjusts position on window resize
  - **3 tutorial sequences implemented**:
    - **Matching Game Tutorial** (3 steps): Shown on first FoodMatchingGame open — explains concept, highlights grid, mentions first-try bonus. Tracked via `questStates.tutorial_matching_done`
    - **Sentence Scramble Tutorial** (4 steps): Shown on first SentenceScramble open — explains tile pool, answer area, correct arrangement. Tracked via `questStates.tutorial_scramble_done`
    - **Combat Tutorial** (6 steps): Shown during first combat encounter at action-select phase — explains attack types, weakness system, items, timer speed, damage tiers. Tracked via `questStates.tutorial_combat_done`
  - All tutorial text in English for clarity (Japanese learners need guidance in native language)
  - **Gold-themed buttons**: "Next" / "Got it!" buttons with gold background
  - **Gamepad support**: Confirm action advances steps via `useInputAction`
  - **Responsive spotlight**: Updates on window resize, re-measures after layout shifts
  - **Integrated into**: FoodMatchingGame (3 steps), SentenceScramble (4 steps), CombatScreen (6 steps)
  - **Quest state tracking**: Each tutorial tracked separately (`tutorial_matching_done`, `tutorial_scramble_done`, `tutorial_combat_done`) — only shows once per save
- [x] Main menu — `src/ui/components/MainMenu.tsx`
- [x] Anki export modal — `src/ui/components/AnkiExportModal.tsx`
- [x] Pixel-art UI theme system — `src/ui/pixelTheme.ts` (color palette, DotGothic16 font, panel origins, thicker borders)
- [x] Reusable 9-slice panel component — `src/ui/components/PixelPanel.tsx` (runtime tile extraction, data URL caching, CSS border-image, configurable border widths)
- [x] Gamepad button icons — `src/ui/components/GamepadIcon.tsx` (A/B/Start/Y/Select/X button icons from Modern_UI_Gamepad_32x32.png spritesheet)
- [x] Yen coin pixel art icon — `public/assets/ui/32x32/yen-coin.png` (32x32px)
- [x] Menu icons — `public/assets/ui/32x32/icon-backpack.png` (64x64px, resized to 40x40 in MenuBar), `public/assets/ui/32x32/icon-gear.png` (32x32px)
- [x] Gamepad button icons — `public/assets/ui/32x32/icon-gp-a.png`, `icon-gp-b.png`, `icon-gp-start.png`, `icon-gp-y.png`, `icon-gp-select.png`, `icon-gp-x.png` (extracted from Modern_UI_Gamepad_32x32.png)
- [x] Heart icon — `public/assets/ui/32x32/icon-heart.png` (extracted from Modern_UI_Style_2_32x32.png tile 11,9)
- [x] Lightning icon — `public/assets/ui/32x32/icon-lightning.png` (extracted from Modern_UI_Style_2_32x32.png tile 10,10)
- [x] Pixel art HP/Energy bars — Extracted from Modern_UI_Style_2_32x32.png:
  - `public/assets/ui/32x32/bar-hp-red.png` (96x32px, red HP fill, tile 16,13)
  - `public/assets/ui/32x32/bar-energy-blue.png` (96x32px, blue energy fill, tile 16,16)
  - `public/assets/ui/32x32/bar-empty.png` (96x32px, empty bar frame, tile 15,14)
  - Uses CSS `clipPath: inset()` for dynamic width animation

---

## Maps Summary

| Map | Size | File | Status |
|-----|------|------|--------|
| Train Station (old) | 26x25 | `chapter1/trainStation.ts` | Legacy (procedural tile-by-tile), no longer used as starting map |
| Tiled Train Station | 33x24 | `chapter1/tiledTrainStation.ts` | Tiled-exported, Modern Exteriors 32px tileset, composite PNG ground layer, **current starting map**, playable |
| Town Outdoor | 70x55 | `chapter1/townOutdoor.ts` | Redesigned (4th iteration) with fence boundary system, placeholder assets, playable |
| Konbini Interior | 12x10 | `chapter1/konbiniInterior.ts` | Layout done, needs story integration |
| Tanaka House | 12x10 | `chapter1/tanakaHouse.ts` | Layout done, needs story integration |
| PixelLab Test Map | 35x28 | `test/pixellabTest.ts` | Composite PNG proof-of-concept, accessible from town, playable |

---

## NPCs & Sprites Loaded

### LPC Spritesheet System (Universal LPC Generator)
All NPCs now use LPC spritesheets loaded via `LPC_NPC_REGISTRY` in BootScene. Old 8-direction rotation-based PNG system fully removed.

- **Player character** — `new-main-character-lpc/standard/walk.png`, 64px sprites, 4-direction walk animation: 8 frames at 10 FPS, idle uses frame 0, diagonal movement mapped to nearest cardinal direction
- **Named: Tanaka-san** (`lpc-named-tanaka`) — `NPCs/named/tanaka/`, walk + sit + hurt sheets. Fixer/guide character.
- **Vendors** (`lpc-vendor-1` to `lpc-vendor-3`) — `NPCs/vendors/NPC1-3/`, walk sheet only. Used for food stall workers, omiyage vendors, konbini workers.
- **Generic NPCs** (`lpc-generic-4` to `lpc-generic-29`) — `NPCs/generic/NPC4-29/`, optimized sheet loading per NPC role:
  - **NPC4**: walk + sit + hurt sheets (reserved for cowlick possession cutscene)
  - **NPC5-15**: sit sheet only (11 sitting background NPCs at train station)
  - **NPC16-23**: walk sheet only (8 standing background NPCs at train station)
  - **NPC24-29**: walk sheet only (6 patrol NPCs at train station)
  - **Total**: 25 unique background NPCs at station + 1 cutscene NPC. No sprite reuse.
  - **Encounter pool**: NPC16-19 (walking generic NPCs used for random encounter disguises)
- **Enemies** — `NPCs/generic/goblin2/`, all combat enemies use goblin2 sprite (was skeleton-basic).

**Folder structure**:
```
public/assets/sprites/NPCs/
  named/tanaka/standard/     (Tanaka, the fixer/guide)
  vendors/NPC1-3/standard/   (shop workers)
  generic/NPC4-29/standard/  (background NPCs, cutscenes, encounter disguises)
  generic/goblin2/standard/  (combat enemy sprite)
  archive/                   (old rotation-based sprites, not loaded)
```

**NPC Sprite Convention**: LPC NPCs use `sprite: 'lpc:{sheetKey}'` format in MapNPC data. OverworldScene detects the `lpc:` prefix and renders them as LPC spritesheets (64x64 frames, 13 cols x 4 rows) instead of individual PNGs. LPC NPCs support optional `facing: 'up' | 'down' | 'left' | 'right'` field (defaults to 'down') to set initial direction.

---

## Known Issues
- None currently reported

---

## Next Steps (Priority Order)
1. **Combat Polish & Balance** — Tune combat mechanics based on playtesting
   - Tune HP/damage values for better pacing
   - Add more enemy types with varied stats and weaknesses
   - Implement escape/run option
   - Gamepad support for combat UI navigation (partially done, needs polish)
2. **Zero Energy Modal & Home Return** — Implement energy depletion mechanic
   - When energy hits 0: NPCs refuse to talk or show "You look tired" dialogue
   - Modal appears: "You need to go back to おうち, review and rest for the night"
   - Player must navigate to Tanaka house
   - Trigger SRS review minigame before sleep
   - Full energy restore after successful review
3. **SRS Study Feature in Vocab Book** — Spaced repetition review for encountered words
   - Access via Vocab tab → "Review" button (shows cards with furigana reveal)
   - Quiz format: see kanji, guess reading/meaning, flip to check
   - Tracks review history and study intervals
   - Integrates with vocabulary mastery system
4. **Equipment / Outfits Menu** — Cosmetic character customization
   - Change character appearance (clothing, hair color, accessories)
   - Store outfit selections
5. **Settings screen content expansion** — Text speed slider, furigana toggle, translation visibility toggle, reset progress button (romaji toggle + difficulty selector already implemented)
6. **Settings persistence** — Save romaji toggle, difficulty, and future settings to IndexedDB (currently resets on page reload)
7. **Platform deployment investigation** — Electron for Steam (desktop builds), Capacitor for iOS/Android (mobile app stores)
8. **Add more quiz encounters** — Apply quiz system to food stall interactions, konbini scenes, other key learning moments
9. **Build town outdoor map in Tiled** — Design with Modern Exteriors tileset, export composite PNG, create `tiledTownOutdoor.ts` with collision and transitions
10. Implement proper Tiled JSON native rendering (instead of composite PNG) for future maps — will enable direct Tiled → game without manual PNG export step
12. Script konbini clerk transformation sequence (second combat encounter)
13. Script Tanaka house arrival (Chapter 1 evening)
14. Script Chapter 1 ending (watching from window)
15. Begin Chapter 2 planning (school map, Kenji introduction)

---

## Recent Changes

### 2026-02-15 (Fortieth Session)
- **Quest Tracker HUD (NEW)** — Top-right overlay showing active quest progress with completion animations
  - **Component**: `src/ui/components/QuestTracker.tsx` — floating quest list with checkmark animations
  - **9 quest definitions**: arrive_station, buy_food, buy_drink, talk_tanaka_omiyage, buy_omiyage, talk_tanaka_home, follow_tanaka, buy_sister_present, buy_postcard
    - *Plus* leave_station (always shown after sister & postcard gifts completed; never "completes")
  - **Quest chaining**: Quests become active only when prerequisites are met (e.g., follow_tanaka active after cowlick cutscene played, before phone call)
  - **Auto-hide logic**: Hidden during combat, dialogue, menus, and minigames (visibility checks activeMenu, isDialogueOpen, isCombatActive, activeMatchingGame, activeScrambleGame, activeReadingGame)
  - **Completion animation**: Checkmark sprite (`/assets/ui/32x32/checkmark.png`) slides in and pulses when quest completes
  - **Styling**: Semi-transparent dark background (rgba(0,0,0,0.5)), white text, positioned at top: 8px, right: 8px, maxWidth: 220px
  - **Visual design**: Each quest shows text + checkmark icon (green when done, arrow when incomplete), completed quests fade out after 2s
- **Journal Menu Tab (NEW)** — ジャーナル tab added to unified RPG menu
  - **Tab added**: Fifth tab in GameMenu.tsx (Status/Inventory/Vocab/Journal/Settings order)
  - **JournalContent component**: Shows expandable quest entries with detail text and checkmark icons
  - **8 journal entries** (newest first): buy_postcard, buy_sister_present, phone_call, cowlick_fight, buy_omiyage, buy_drink, buy_food, arrive_station
    - *Note*: follow_tanaka and talk phases intentionally omitted from journal (transient quest steps)
  - **Entry states**: Completed entries show checkmark and can be expanded to read detail text; incomplete entries show open circle
  - **Expandable details**: Each entry has flavor text explaining what happened (e.g., "Called Mom to let her know I arrived safely...")
  - **uiStore integration**: Added 'journal' to activeMenu type in `src/store/uiStore.ts`
  - **Implementation**: JournalContent in `src/ui/components/GameMenu.tsx` (inline component, not separate file)
- **Vendor Consolidation** — Reduced station NPCs from 3 vendors to 2 vendors
  - **Removed NPCs**: Separate gift shop vendor at (51,8) and old postcard shop vendor at (51,14) removed from tiledTrainStation.ts
  - **Postcard vendor repositioned**: Moved to (53,8) at computer desk area — reuses existing bg_npc slot
  - **Interaction zones updated**: Zone coordinates and quest arrow targets adjusted for new layout
  - **foodMenuData cleanup**: Removed `gift_shop` menu entry (only vending_machine and food_stall remain)
  - **Files modified**: `src/game/maps/chapter1/tiledTrainStation.ts`, `src/data/foodMenuData.ts`, `src/game/scenes/OverworldScene.ts`
- **Sister's Present Quest Redesign** — Changed from matching game to sentence scramble minigame
  - **New scramble set**: `sister_present` in `src/data/scrambleData.ts` — 3 N5-level sentences about buying toy for sister
  - **Sentences**: "おもちゃをください" (Please give me a toy), "いもうとのおみやげです" (It's a souvenir for my sister), "これをおねがいします" (This one, please)
  - **New vocabulary**: 3 words added to vocabularyDB.ts (79 → 82 total)
    - w_omocha (おもちゃ) — toy
    - w_imouto (いもうと) — younger sister
    - w_onegaishimasu (おねがいします) — please (formal request)
  - **Quest state field**: Added `questState?: string` to ScrambleSet interface in `src/data/scrambleData.ts` — makes scrambles data-driven for quest completion tracking
  - **Dialogue update**: Changed `gift_shop_active` from menuTrigger to scrambleTrigger in `src/data/npcDialogue.ts`
  - **Purchase item**: Pocket creature toy (ポケットクリーチャー ぬいぐるみ, ¥500)
  - **Quest state**: Now sets `stationSisterPresentBought` via scramble's questState field (was via matching game)
  - **Omiyage vendor chaining**: Updated zone handler to use scrambleTrigger for sister's present quest
- **Reading Game Polish** — Improved beginner-friendliness of postcard reading challenge
  - **Vocabulary simplification**: Rewrote `postcard_grandma` challenge to only use words from preceding dialogue
  - **Words used**: げんき (doing well), だいじょうぶ (okay/fine), おなか すいた (hungry), さようなら (goodbye), すみません (excuse me)
  - **Header text simplified**: Removed confusing Japanese header ("よんで えらんで！"), now English-only prompt
  - **Prompt improved**: "Read the postcards below. Which one says 'I'm doing well. Every day is fun!'?" — clearer for beginners
  - **File modified**: `src/data/readingData.ts`
- **Postcard Image Path Migration** — Fixed postcard sprite path in database.ts
  - **Migration added**: `/assets/sprites/objects/items/postcard.png` → `/assets/sprites/objects/various/postcard.png`
  - **Location**: `src/store/database.ts` in IMAGE_MIGRATIONS map for backwards compatibility with existing saves
  - **Impact**: Ensures old inventory items with stale paths are transparently migrated to new asset location
- **Archived Maps Documentation** — Clarified map organization in technical guide
  - **Archive location**: `src/game/maps/archive/` contains old rotation-based map systems (not loaded)
  - **Active maps**: Only `tiled_train_station.ts` currently in use (Tiled format with collision/NPC/decoration layers)
  - **Offline tools**: Maps still support old PixelLab composite system (reference only, no runtime usage)
- **TypeScript Clean** — All changes compile with zero TypeScript errors
- **Files Created**:
  - `src/ui/components/QuestTracker.tsx` — Quest tracker HUD component with 9 quest definitions, checkmark animations, auto-hide logic
- **Files Modified**:
  - `src/ui/components/GameMenu.tsx` — Added Journal tab with JournalContent component (8 journal entries, newest-first, expandable details)
  - `src/store/uiStore.ts` — Added 'journal' to activeMenu type union
  - `src/game/maps/chapter1/tiledTrainStation.ts` — Vendor consolidation (removed 2 NPCs at old positions, repositioned postcard vendor to 53,8)
  - `src/data/foodMenuData.ts` — Removed gift_shop menu entry (only vending_machine and food_stall remain)
  - `src/game/scenes/OverworldScene.ts` — Updated NPC interaction zones and quest arrow targets for new vendor layout
  - `src/data/scrambleData.ts` — Added sister_present scramble set, added questState field to ScrambleSet interface for data-driven completion tracking
  - `src/japanese/vocabularyDB.ts` — Added 3 new words (w_omocha, w_imouto, w_onegaishimasu)
  - `src/data/npcDialogue.ts` — Changed gift_shop_active from menuTrigger to scrambleTrigger
  - `src/data/readingData.ts` — Simplified postcard_grandma challenge to use only dialogue words, changed header from Japanese to English
  - `src/store/database.ts` — Added postcard image path migration in IMAGE_MIGRATIONS map

### 2026-02-15 (Thirty-Ninth Session)
- **Phone Call Scene** — After cowlick battle, MC stops to call Mom before leaving station
  - **Trigger location**: Station exits (stairs at row 2, elevator at row 2) — blocks exit until call is done
  - **15-node dialogue chain**: All English dialogue between "You" and "Mom" speakers
  - **Phone portraits**: `main-character-male-on-phone.png` and `mother-on-phone.png` in SPEAKER_PORTRAITS map
  - **Topics covered**: Safe arrival, town impressions, meeting Tanaka-sensei, sister's present quest, grandma's postcard quest
  - **Quest gate**: Sets `phoneCallDone` state, gates gift shop and postcard shop interactions
  - **Implementation**: OverworldScene checks battle done + not phoneCallDone + approaching transition tiles → shows phone call dialogue instead of allowing transition
- **Gift Shop Quest (Sister's Present)** — New vendor NPC and matching game for buying gift
  - **Vendor NPC**: lpc-vendor-2 sprite at tile (51, 8) in train station
  - **Interaction zone**: (49, 6, 6x4) — 6 tiles wide, 4 rows deep
  - **Minigame**: Uses existing FoodMatchingGame component with new `gift_shop` menu ID
  - **Items**: キーホルダー (keychain, ¥300), ぬいぐるみ (plushie, ¥500), ステッカー (sticker, ¥200)
  - **Quest state**: `stationSisterPresentBought`
  - **Quest gating**: Only shows active dialogue after phone call done
  - **Vocabulary**: 3 new words (w_keychain, w_nuigurumi, w_sticker)
- **Postcard Quest (Grandma's Postcard)** — New vendor NPC and reading comprehension minigame
  - **Vendor NPC**: lpc-vendor-3 sprite at tile (51, 14) in train station
  - **Interaction zone**: (49, 12, 6x4) — 6 tiles wide, 4 rows deep
  - **Minigame**: NEW ReadingGame component — read Japanese text on cards, pick correct one
  - **First challenge**: `postcard_grandma` — read 4 postcards, pick the one saying "I'm doing well. Every day is fun!" (げんきです。まいにちたのしいです。)
  - **Quest state**: `stationPostcardBought`
  - **Quest gating**: Only shows active dialogue after phone call done
  - **Vocabulary**: 4 new words (w_hagaki, w_genki, w_mainichi, w_tanoshii)
- **Reading Comprehension Minigame (NEW)** — Fourth station minigame, teaches reading skills
  - **Component**: `src/ui/components/ReadingGame.tsx` — new full-screen overlay minigame
  - **Data file**: `src/data/readingData.ts` — challenge definitions with Japanese passages
  - **UI pattern**: Same as FoodMatchingGame/SentenceScramble (PixelPanel overlay, phases, first-try bonus, purchase flow)
  - **Gameplay**: Show 4 cards with Japanese text, player reads and picks the one matching a specific description/question
  - **Tutorial**: 3-step TutorialOverlay on first play (tracked via `tutorial_reading_done`)
    - Step 1: "Reading Comprehension" intro explaining concept
    - Step 2: Highlights card grid — "Read each card carefully"
    - Step 3: "Pick the correct one! First try = bonus!"
  - **Gamepad support**: Full D-pad navigation with A/B button support
  - **Trigger**: New `readingTrigger` field on DialogueNode type
  - **UIStore integration**: `activeReadingGame` state + openReadingGame/closeReadingGame actions
  - **Purchase flow**: Correct answer → first-try bonus check → spend yen → add item → show notifications → close game → douzo_response dialogue
- **Updated Quest Flow** — Station exit now requires 6 completed tasks
  - **Exit requirements**: food + drink + omiyage + cowlick battle + phone call + sister's present + postcard
  - **Quest arrows updated**: 2 new phases added to quest arrow system
    - **Phase 5**: After phone call → arrows point to gift shop + postcard shop vendors
    - **Phase 6**: After both gifts bought → arrows point to stairs exit
  - **Implementation**: OverworldScene.update() manages 6-phase arrow system based on quest states
- **New Vocabulary** — 7 words added to vocabularyDB.ts (72 → 79 total)
  - w_keychain (キーホルダー) — keychain
  - w_nuigurumi (ぬいぐるみ) — stuffed animal/plushie
  - w_sticker (ステッカー) — sticker
  - w_hagaki (はがき) — postcard
  - w_genki (げんき) — healthy/energetic/doing well
  - w_mainichi (まいにち) — every day
  - w_tanoshii (たのしい) — fun/enjoyable
- **Files Created**:
  - `src/data/readingData.ts` — Reading comprehension challenge definitions
  - `src/ui/components/ReadingGame.tsx` — Reading comprehension minigame component
- **Files Modified**:
  - `src/ui/components/DialogueBox.tsx` — Added phone portraits to SPEAKER_PORTRAITS map
  - `src/data/npcDialogue.ts` — Phone call dialogue chain + gift shop + postcard shop dialogues
  - `src/game/scenes/OverworldScene.ts` — Phone call trigger at exits, new vendor NPC handling, updated exit gates, 6-phase quest arrow system
  - `src/game/maps/chapter1/tiledTrainStation.ts` — 2 new vendor NPCs (gift shop, postcard shop) + 2 new interaction zones (18 total zones now)
  - `src/data/foodMenuData.ts` — New `gift_shop` menu definition
  - `src/ui/components/FoodMatchingGame.tsx` — Handles `stationSisterPresentBought` quest state
  - `src/ui/components/GameContainer.tsx` — ReadingGame rendering via activeReadingGame state
  - `src/japanese/types.ts` — Added `readingTrigger?: string` to DialogueNode type
  - `src/store/uiStore.ts` — Added `activeReadingGame` state + reading game actions, readingTrigger handling in advanceLine()
  - `src/japanese/vocabularyDB.ts` — 7 new words (keychain, plushie, sticker, postcard, genki, mainichi, tanoshii)

### 2026-02-15 (Thirty-Eighth Session)
- **Combat Difficulty Setting** — 4 difficulty options: Timer Off / Easy / Medium / Hard
  - **Timer Off mode**: No timer bar shown, player always gets 'fast' tier (1.5x damage) — accessibility/chill mode for players who don't like time pressure
  - **Easy**: 1.5x time (Vocab Quiz 15s, Quick Match 22.5s, Word Scramble 30s)
  - **Medium**: 1.0x time (Vocab Quiz 10s, Quick Match 15s, Word Scramble 20s) — default
  - **Hard**: 0.7x time (Vocab Quiz 7s, Quick Match 10.5s, Word Scramble 14s)
  - **Settings UI**: 4-button segmented control in せってい (Settings) tab — `src/ui/components/GameMenu.tsx`
  - Label: "Combat Difficulty" / "たたかいのむずかしさ"
  - Difficulty stored in uiStore (not persisted to IndexedDB yet — resets on page reload)
- **Per-Minigame Combat Timers** — Each minigame now has different base timer reflecting complexity
  - **Vocab Quiz**: 10s (medium difficulty) — quick multiple choice, 4 options
  - **Quick Match**: 15s (medium difficulty) — requires matching 2 pairs, more work
  - **Word Scramble**: 20s (medium difficulty) — unscrambling requires most thinking
  - `GAME_TIMERS` constant and `getGameTimer(gameType, difficulty)` function in `src/data/combatConfig.ts`
  - Difficulty multipliers scale all timer values: easy=1.5x, medium=1.0x, hard=0.7x, off=0 (totalMs)
  - All 3 combat minigames conditionally hide CombatTimer component when `totalMs === 0` (timer off mode)
  - `getTierFromElapsed()` in CombatTimer.tsx now accepts optional custom thresholds for per-game calculations
- **Tutorial System** — Reusable step-by-step tutorial overlay for teaching game mechanics
  - **TutorialOverlay component** — `src/ui/components/TutorialOverlay.tsx`
    - Dark backdrop with spotlight cutout highlighting specific UI elements via `data-tutorial` attributes
    - Gold-glowing spotlight effect using CSS box-shadow inset technique
    - Callout box (PixelPanel) with English explanation text
    - Step indicator dots showing current position
    - Next/Got it! buttons
    - Gamepad support (A button advances)
    - Auto-repositions spotlight on window resize
  - **3 tutorial sequences implemented**:
    - **Matching Game Tutorial** (3 steps): First time player opens FoodMatchingGame
      - Step 1: "Food Matching Game" intro explaining concept
      - Step 2: Highlights matching grid — "Japanese words on left, pictures on right"
      - Step 3: "Match all pairs! First try = bonus!"
      - Tracked via `questStates.tutorial_matching_done`
    - **Sentence Scramble Tutorial** (4 steps): First time player opens SentenceScramble
      - Step 1: "Sentence Builder" intro
      - Step 2: Highlights tile pool — "These are the scrambled word tiles"
      - Step 3: Highlights answer area — "Tap to place in order"
      - Step 4: "Arrange correctly to complete! First try = bonus!"
      - Tracked via `questStates.tutorial_scramble_done`
    - **Combat Tutorial** (6 steps): First combat encounter, pauses at action-select phase
      - Step 1: "Combat!" intro
      - Step 2: Highlights action buttons — "Choose your attack!"
      - Step 3: Weakness explanation — "Enemy is weak to one type each round"
      - Step 4: Items tip — "Food/drinks restore HP"
      - Step 5: Timer speed explanation — "Answer fast for more damage!"
      - Step 6: Damage tiers — "GREAT/GOOD/SLOW/MISS"
      - Tracked via `questStates.tutorial_combat_done`
  - All tutorial text in English (Japanese learners need guidance in native language)
  - `data-tutorial` attributes added to relevant elements in FoodMatchingGame, SentenceScramble, and CombatScreen
- **Player Combat Idle Animation** — Player character now uses `combat` sheet as idle stance in battle (was `idle`)
  - Between victory jump cycles, reverts to regular `idle` standing pose (not combat stance)
  - Matches enemy behavior for visual consistency
- **Files Created**:
  - `src/ui/components/TutorialOverlay.tsx`
- **Files Modified**:
  - `src/data/combatConfig.ts` — Difficulty type expanded to include 'off', per-game timers (GAME_TIMERS), getGameTimer() returns totalMs:0 for 'off'
  - `src/store/uiStore.ts` — difficulty type includes 'off'
  - `src/ui/components/GameMenu.tsx` — 4-option difficulty selector in Settings tab
  - `src/ui/components/combat/CombatTimer.tsx` — getTierFromElapsed accepts custom thresholds
  - `src/ui/components/combat/VocabQuizBattle.tsx` — per-game timer, timer off support (conditionally hide timer)
  - `src/ui/components/combat/QuickMatchBattle.tsx` — per-game timer, timer off support
  - `src/ui/components/combat/WordScrambleBattle.tsx` — per-game timer, timer off support
  - `src/ui/components/FoodMatchingGame.tsx` — tutorial integration, data-tutorial attributes
  - `src/ui/components/SentenceScramble.tsx` — tutorial integration, data-tutorial attributes
  - `src/ui/components/CombatScreen.tsx` — player combat idle, tutorial integration, data-tutorial attributes

### 2026-02-15 (Thirty-Fifth Session)
- **Visual Polish — Quest Arrows**
  - **Larger arrows**: 40x28px (was 28x20px) with white border and drop shadow — `src/game/scenes/BootScene.ts`
  - **Improved positioning**: Arrows moved up 32px and repositioned relative to NPC sprite pixel positions instead of tile positions
  - **Vending machine arrows**: Moved up one tile (y = 14 * TILE_SIZE instead of 15)
  - **Omiyage arrows simplified**: Find vendor sprites directly, two arrows (one above each vendor)
- **Map Transition Fix**
  - **Bottom-edge transition removed**: Train station transitions array now only has stairs + elevator exits at row 2 — `src/game/maps/chapter1/tiledTrainStation.ts`
  - Bottom of map no longer triggers zone transition
- **Sitting NPC Position Adjustments**
  - **Down-facing**: y + 0.25 tile offset
  - **Left/right-facing**: y - 0.25 tile offset
  - Fine-tuned in `tiledTrainStation.ts`
- **Dialogue Fix**
  - Changed かえろう (informal volitional) to かえりましょう (formal/polite) for Tanaka's dialogue
  - Updated `src/data/npcDialogue.ts` (word reference) and `src/japanese/vocabularyDB.ts` (w_kaerou → w_kaerimashou)
- **Character Drop Shadows**
  - **Soft elliptical shadow texture**: `char-shadow` generated in BootScene using concentric ellipses
  - Shadow sprites created under player and all NPCs in OverworldScene
  - Shadows track parent sprite positions in `update()` loop
  - Auto-cleanup for destroyed parent sprites
  - Also added to dynamically spawned NPCs (cowlick cutscene, random encounters)
- **Combat Enemy Sprite Overhaul**
  - **Switched ALL enemies from skeleton-basic to goblin2 sprites**
  - Enemy uses `combat` sheet as idle pose in battle (was `idle`)
  - Updated `src/data/combatConfig.ts`: all enemy `spriteBase` paths now point to goblin2
  - Loaded `enemy-goblin2-combat` spritesheet in BootScene for overworld cutscene transformation
- **Pre-Combat Transformation Sequence**
  - **Cowlick cutscene**: Flickering NPC ↔ monster transformation with accelerating pattern [200, 150, 120, 100, 80, 60, 60, 40, 40, 40]ms
  - Monster sprite (goblin2 combat) overlays NPC with visibility toggling
  - Monster stays visible until combat UI covers screen (600ms delay before destroy)
- **Victory Animations**
  - **Enemy collapse**: Plays 6-frame `hurt` animation and collapses at end of combat
  - **Player celebration**: Continuous jump animation (5 frames from jump.png, 120ms/frame, 500ms pause between loops)
  - React Strict Mode compatibility: fire-and-forget setTimeout pattern with ref guard (`victoryAnimPlayed`)
  - Applied to ALL combat victories, not just cowlick fight
- **Post-Victory NPC Transform Flicker** (in Combat Screen)
  - **`npcSpriteBase` field** added to `CombatEnemy` interface in `src/store/combatStore.ts`
  - Set for cowlick_npc enemy: `/assets/sprites/NPCs/generic/NPC4/standard`
  - After enemy hurt collapse, combat screen flickers between goblin and NPC sprite with accelerating pattern
  - Uses `victoryNpcSpriteBase` state to swap BattleSprite's `spriteBase`
  - Pattern: monster → NPC with same accelerating flicker timing, ends showing NPC
  - **Reusable system** for all future NPC-based encounters with `npcSpriteBase` configured
- **Post-Combat Cowlick NPC Visibility Fix**
  - Fixed cowlickSprite being invisible after combat (was set invisible during transformation and never restored)
  - Simplified OverworldScene post-combat: just shows cowlick NPC standing with idle-down animation
  - Transform-back visual handled entirely in combat screen now
- **Files Modified**:
  - `src/game/scenes/BootScene.ts` — shadow generation, larger quest arrows, goblin2 spritesheet loading
  - `src/game/scenes/OverworldScene.ts` — shadows, arrow positioning, transformation sequence, post-combat fix
  - `src/game/maps/chapter1/tiledTrainStation.ts` — sitting NPC offsets, removed bottom transition
  - `src/data/combatConfig.ts` — goblin2 sprite paths, npcSpriteBase for cowlick
  - `src/store/combatStore.ts` — npcSpriteBase field on CombatEnemy
  - `src/ui/components/CombatScreen.tsx` — combat idle sheet, victory animations, NPC transform flicker
  - `src/data/npcDialogue.ts` — かえりましょう fix
  - `src/japanese/vocabularyDB.ts` — w_kaerimashou entry

### 2026-02-15 (Thirty-Fourth Session)
- **Train Station Background NPC Expansion** — All 25 background NPCs now use unique sprites, no reuse
  - **Generic NPC pool expanded**: NPC5-29 added to `LPC_NPC_REGISTRY` in BootScene (was NPC1-4, now NPC4-29)
  - **Sitting NPCs** (11 total): NPC5-15 load sit sheet only — `src/game/maps/chapter1/tiledTrainStation.ts`
  - **Standing NPCs** (8 total): NPC16-23 load walk sheet only
  - **Patrol NPCs** (6 total): NPC24-29 load walk sheet only
  - **NPC4 reserved** for cowlick cutscene (walk + sit + hurt sheets)
  - **Old generic NPCs removed**: NPC1-3 removed from BootScene registry (no longer used)
  - **Optimized sheet loading**: BootScene now conditionally creates walk/idle animations only for NPCs with walk sheets loaded, preventing wasted animation creation for sit-only NPCs
  - **Encounter pool updated**: Random encounter disguises now reference NPC16-19 (walking generic NPCs) — `src/data/combatConfig.ts`
  - **Memory optimization**: Only needed sprite sheets loaded per NPC role

### 2026-02-15 (Thirty-Second Session)
- **Quest Arrow Tutorial System** — Bouncing green arrows guide player through station objectives
  - **Arrow rendering**: Generated `quest-arrow` texture in BootScene (28x20px, bright green #00ff00, upward-pointing triangle)
  - **4-phase progression system**:
    - Phase 1: Arrows on vending machines (21,15) and (31,15) + food stalls — until player buys food AND drink
    - Phase 2: Arrow on Tanaka NPC — after food+drink bought, before omiyage prompt dialogue
    - Phase 3: Arrows on omiyage shops (wide zone 21,11-32,11) — after `stationOmiyagePrompted`, before bought
    - Phase 4: Arrow on Tanaka NPC — after omiyage bought, before cowlick cutscene triggered
  - **refreshQuestArrows()** method in OverworldScene — Called on buildMap, after cutscenes, when dialogue closes
  - **Arrow animation**: Sine wave bounce via update loop, depth 999999 (above foreground, below UI)
  - **Arrow cleanup**: Destroys all arrows before rebuilding to prevent duplicates
- **Train Station Map Updates** — Multiple Tiled re-exports with collision and overlay refinements
  - **Collision rects updated**: 50 total collision rectangles (was 28 initially, then 40, now 50) — `src/game/maps/chapter1/tiledTrainStation.ts`
  - **Map PNG alignment fix**: Re-cropped `train-station.png` and `train-station-overlay.png` to exact 1792x1280 dimensions (33 tiles × 24 tiles at 64px, adjusted from 32px Tiled source)
    - Tiled exports had transparent padding from layer offsets — manually trimmed in image editor
  - **Foreground overlay layer**: `train-station-overlay.png` loaded via existing `foregroundImage` system at depth 999998
    - Contains roofs, signs, and other elements that appear above characters
  - **New interaction zones**:
    - Omiyage shop: Wide zone at row 11, cols 21-32 (replaces two small 2x2 zones at row 8)
    - Vending machines: (21,15) and (31,15) — 2 new zones added
  - **Total interaction zones**: 16 (was 13) — vending machines, food stalls, omiyage, Tanaka, exits
- **Omiyage Shop Quest Gating** — Scramble game only accessible after quest progression
  - **Before prompted**: Interaction shows generic `omiyage_vendor_generic` dialogue ("いらっしゃいませ！") — `src/data/npcDialogue.ts`
  - **After prompted**: `scrambleTrigger` fires, opens sentence scramble minigame
  - **After purchased**: Zone returns silently (no repeat interaction)
  - **Quest state checks**: `tryInteract()` checks `stationOmiyagePrompted` and `stationOmiyageBought` — `src/game/scenes/OverworldScene.ts`
- **Cowlick Encounter Cutscene Refinements** — Improved staging and timing
  - **Spawn position changed**: Cowlick now spawns at stairs (42,3) instead of elevator (45,3)
  - **Walk target**: Directly in front of player `(playerTileX, playerTileY - 1)` with hardcoded facing
  - **Tanaka simultaneous exit**: Walks UP through stairs to (42,2) concurrently with cowlick approach
  - **Non-blocking Tanaka walk**: Uses fire-and-forget pattern so cowlick sequence is not delayed
  - **Cleanup**: Tanaka sprite destroyed after walk-off
- **Same-Tile NPC Interaction** — Can now talk to NPCs standing on same tile as player
  - **Fallback check**: `tryInteract()` now checks player's own tile if no adjacent NPC found
  - **Use case**: Player standing directly on top of Tanaka after cutscene can still interact
- **NPC Patrol Collision Fix** — Moved patrolling NPC to avoid walking through blocked tiles
  - **Old patrol**: (35,17) → (35,5) — walked through collision rects
  - **New patrol**: (8,15) → (8,5) — open corridor with no obstructions
- **Random Encounters Disabled** — `MAP_ENCOUNTERS.tiled_train_station` set to `enabled: false` — `src/data/combatConfig.ts`
  - Will re-enable after unique NPC sprites added and encounter balance tuned
- Files modified: `src/game/scenes/BootScene.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/data/npcDialogue.ts`, `src/data/combatConfig.ts`, `public/assets/maps/train-station.png`, `public/assets/maps/train-station-overlay.png`

### 2026-02-14 (Thirty-First Session)
- **Train Station NPC Expansion** — Populated train station with 32 total NPCs
  - **NPC breakdown**:
    - 4 quest NPCs: fixer + 3 food stalls (from previous sessions)
    - 2 omiyage vendors at (23,9) and (29,9) with interaction zones at (22,8) and (28,8)
    - 11 sitting NPCs (rows 3, 15, 22, 23 — benches)
    - 7 standing NPCs (various positions and facings)
    - 6 patrolling NPCs with waypoint-based routes
    - 2 additional standing NPCs (32 total)
  - **All NPCs use cowlick-glasses placeholder sprites** — unique sprites will be added in future session
- **NPC Patrol System** — Scalable waypoint-based patrol with async loops
  - **MapNPC type extended** — `src/game/maps/types.ts`
    - Added optional `patrol` field: `{ waypoints: Array<{x: number, y: number}>, speed?: number, waitTime?: number }`
  - **OverworldScene patrol implementation**
    - `startNPCPatrol()` method creates infinite loops through waypoints
    - Random idle pauses (2-3.5s) at each waypoint for natural feel
    - Random initial delay (0-2s) staggers patrol starts
    - Uses existing `walkNPC()` for pathfinding and animation
    - Depth sorting automatically handled by existing update loop
    - Clean cleanup on map transition via `npc.active` guards
  - **Hook in buildMap()**: Auto-starts patrol for any NPC with `patrol` field defined
- **Updated Collision Grid** — `src/game/maps/chapter1/tiledTrainStation.ts`
  - Added 40 collision rectangles from new Tiled export (was 28)
  - Verified Tanaka pathfinding works on new grid
- **Updated Interaction Zones**
  - Removed old omiyage zone at (37,19)
  - Added new 2x2 omiyage zones at (22,8) and (28,8)
- **Scripted Cowlick Encounter Cutscene** — 12-step async sequence in OverworldScene
  - **Cutscene flow**: Tanaka "Let's go home" → cowlick spawns at elevator → walks to player → bump (shake+flash+hurt animation) → transformation dialogue → combat → post-combat confusion → player reaction → cowlick walks off → exit unlocked
  - **playCowlickEncounterCutscene()** method orchestrates full sequence
  - **New dialogues**: `tanaka_lets_go_home`, `cowlick_cutscene_transform`, `player_what_was_that` — `src/data/npcDialogue.ts`
  - **New vocabulary**: `w_kaerou` (かえろう), `w_ima` (いま) — `src/japanese/vocabularyDB.ts`
  - **Quest gates updated**: Station exits now require `battle_cowlick_npc_done` in addition to food/drink/omiyage
  - **CombatScreen updated**: Skips auto post-battle dialogue when `isRandomEncounter=true` flag set (allows scripted cutscenes to control dialogue flow)
- **Scalable Encounter NPC Registry** — Data-driven system in `src/data/combatConfig.ts`
  - **ENCOUNTER_NPC_REGISTRY** maps `npcId` to sprite folder paths
  - BootScene auto-loads all NPC spritesheets from registry (walk, idle, sit, hurt)
  - Adding new encounter NPCs only requires sprites + one config entry (no BootScene edits)
  - Added NPC2 support to registry
- **Map Image Fix** — `public/assets/maps/train-station.png`
  - Fixed dimensions from 1821x1294 to correct 1792x1280 (trimmed transparent padding from Tiled export)
  - This resolved all NPC and player offset issues
- **Random Encounters Disabled** — Set `enabled: false` in `MAP_ENCOUNTERS.tiled_train_station`
  - Will re-enable and tune after unique NPC sprites are added
- **Map Refinements (continued)** — `src/game/maps/chapter1/tiledTrainStation.ts`, `public/assets/maps/train-station.png`
  - Re-cropped updated train station PNG export (same 13px left / 14px top padding issue from Tiled)
  - Added 2 new collision rectangles for omiyage shop fronts (now 42 total collision rectangles, was 40)
  - Replaced two small 2x2 omiyage interaction zones at row 8 with one wide zone: row 11, cols 21-32 (full counter front)
  - Omiyage interaction is now quest-gated: requires `stationOmiyagePrompted` (player talked to Tanaka about omiyage) and blocks after `stationOmiyageBought`
- **Cowlick Cutscene Updates** — `src/game/scenes/OverworldScene.ts`
  - Cowlick now spawns from stairs (tile 42,3) instead of elevator (45,3) for better visual staging
  - Tanaka now walks away (fire-and-forget to tile 10,35) simultaneously as cowlick approaches during the cutscene
- Files modified: `src/game/maps/types.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/scenes/BootScene.ts`, `src/data/npcDialogue.ts`, `src/japanese/vocabularyDB.ts`, `src/ui/components/CombatScreen.tsx`, `src/data/combatConfig.ts`, `public/assets/maps/train-station.png`

### 2026-02-14 (Thirtieth Session)
- **Train Station NPC Expansion** — Populated train station with 27 NPCs (including 4 quest NPCs from previous sessions)
  - **NPC breakdown**:
    - 2 omiyage vendors at (23,9) and (29,9) — trigger sentence scramble game via interaction zones at (22,8) and (28,8) (2x2 each)
    - 8 sitting NPCs facing down at rows 3 and 22 (benches)
    - 2 sitting NPCs facing right, 1 sitting facing left
    - 4 standing NPCs with various facings
    - 6 patrolling NPCs with back-and-forth paths in open corridors
  - **Placeholder sprites**: All new NPCs use `cowlick-glasses` sprite temporarily (will be replaced with unique NPC sprites in future session)
- **NPC Patrol System** — Scalable waypoint-based patrol for any map
  - **MapNPC type extended** — `src/game/maps/types.ts`
    - Added optional `patrol` field with `waypoints: Array<{x: number, y: number}>` and `speed?: number` (defaults to 2)
  - **OverworldScene.startNPCPatrol()** — `src/game/scenes/OverworldScene.ts`
    - Loops through waypoints indefinitely with 2-3.5s random idle pauses at each waypoint
    - Random initial delay (0-2s) staggers NPC movement for natural feel
    - Uses existing `walkNPC()` infrastructure for pathfinding and animation
    - Guards against crash on map transition via `npc.active` check in callbacks
  - **Patrol hook in buildMap()**: Calls `startNPCPatrol()` for each NPC with defined patrol routes
- **Updated Collision Grid** — `src/game/maps/chapter1/tiledTrainStation.ts`
  - 40 collision rectangles (was 28) from new Tiled map export
  - `buildCollisionGrid()` function unchanged (scales to arbitrary number of rectangles)
- **Updated Interaction Zones**
  - Removed old omiyage zone at (37,19)
  - Added two new 2x2 omiyage zones at (22,8) and (28,8) for new vendor positions
- **New Map Image** — `public/assets/maps/train-station.png`
  - Copied updated map image from Tiled export
  - TODO: Foreground overlay layer (when user exports separate PNG from Tiled) — `foregroundImage` infrastructure already exists at depth 999998
- Files modified: `src/game/maps/types.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/game/scenes/OverworldScene.ts`, `public/assets/maps/train-station.png`

### 2026-02-14 (Twenty-Ninth Session)
- **Scripted Cowlick Encounter Cutscene** — Full 12-step async cutscene triggered after player completes food/drink/omiyage quests and talks to Tanaka
  - **Cutscene flow**: Tanaka says "Let's go home" → cowlick NPC spawns at elevator and walks to player → screen shake + white flash + hurt animation → transformation dialogue → combat → post-combat confused dialogue → player says "What was that?" in N5 Japanese → cowlick walks off → exit gate unlocked
  - **New quest gating**: Station exits now require `battle_cowlick_npc_done` quest state (in addition to food/drink/omiyage) — player forced to talk to Tanaka after shopping
  - **New dialogues added** — `src/data/npcDialogue.ts`
    - `tanaka_lets_go_home`: "よし！かえろう！" (Alright! Let's go home!)
    - `cowlick_cutscene_transform`: Transformation dialogue without combatTrigger (cutscene manually controls combat)
    - `player_what_was_that`: "...なに？いまのはなに？" (...what? What was that just now?)
  - **New vocabulary words** — `src/japanese/vocabularyDB.ts`
    - `w_kaerou`: かえろう (kaerou — let's go home, volitional form)
    - `w_ima`: いま (ima — now)
  - **Cowlick hurt animation**: Loaded hurt spritesheet and registered 4-directional hurt animations for the bump effect — `src/game/scenes/BootScene.ts`
  - **Combat integration**: Uses `isRandomEncounter=true` so CombatScreen skips auto post-battle dialogue (cutscene controls flow manually)
  - **Cutscene architecture**: Async `playCowlickEncounterCutscene()` method in OverworldScene — spawns NPC, walks, triggers dialogue, starts combat, waits for combat end, post-combat sequence, cleanup
  - **Quest progression**: `tryInteract()` checks all quest states and shows appropriate Tanaka dialogue — `src/game/scenes/OverworldScene.ts`
- **Scalable Encounter NPC Registry** — Data-driven system where adding new random encounter NPCs requires only sprites + one config entry
  - **ENCOUNTER_NPC_REGISTRY** in `src/data/combatConfig.ts` — Object mapping `npcId` to sprite folder paths
    - Example: `NPC1: { folder: 'cowlick-glasses', variant: 'standard' }`
    - BootScene auto-loads all spritesheets from registry (walk, idle, sit, hurt) — `src/game/scenes/BootScene.ts`
    - Auto-registers walk/idle/sit/hurt animations for each NPC (8 directional idle, 4-directional walk/sit/hurt)
  - **How to add new encounter NPC**: (1) Drop sprites in `public/assets/sprites/NPCs/{folder}/{variant}/`, (2) Add one entry to ENCOUNTER_NPC_REGISTRY, (3) Add to MAP_ENCOUNTERS enemy pool
  - **NPC2 support**: Added second random encounter NPC (`NPC2` subfolder), loaded automatically via registry
  - **Cowlick NPC always skipped in buildMap()**: Spawned dynamically by cutscene or not at all (post-battle)
- Files modified: `src/data/combatConfig.ts`, `src/data/npcDialogue.ts`, `src/japanese/vocabularyDB.ts`, `src/game/scenes/BootScene.ts`, `src/game/scenes/OverworldScene.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Eighth Session)
- **Random Encounter NPC System** — Complete overhaul of random encounters from direct combat spawn to full NPC approach sequence
  - **Encounter Flow**: Step counter triggers → random LPC NPC spawns at camera viewport edge → walks to player → pre-combat dialogue (random from 4 variations) → NPC transforms (＊ばけもの に なった！＊) → combat → post-combat dialogue (random from 4 variations, NPC confused) → NPC walks off-screen → NPC destroyed
  - **NPC sprite pool**: `EncounterConfig.npcSprites` field — per-map pool of LPC spritesheet prefixes for disguised yokai appearance
  - **First encounter NPC**: `lpc-npc-encounter1` — female with lavender kimono from `random-encounter-NPCs/`
  - **Goblin enemy**: All combat enemies now use `goblin2` sprite — `public/assets/sprites/NPCs/generic/goblin2/standard/`
  - **Pre-combat dialogues**: 4 variations (headache, lost, sudden, polite snap) — `RANDOM_ENCOUNTER_PRE_COMBAT` in `npcDialogue.ts`
  - **Post-combat dialogues**: 4 variations (confused, hurt, sorry, what happened) — `RANDOM_ENCOUNTER_POST_COMBAT` in `npcDialogue.ts`
  - **Combat store**: Added `isRandomEncounter` flag to prevent CombatScreen from duplicating post-combat dialogue
  - **Spawn logic**: `findEncounterSpawnTile()` finds walkable tiles at camera viewport edge, tries all 4 edges in random order
  - **NPC facing**: Both NPC and player automatically face each other after NPC arrives
  - **Cleanup**: NPC sprite removed from `npcSprites` array and destroyed after walk-off; also cleaned up on map transition
  - **OverworldScene methods added**: `startRandomEncounterSequence`, `waitForCombatEnd`, `pickRandomDialogue`, `findEncounterSpawnTile`, `isSpawnableTile`, `findAdjacentWalkableTile`, `findEncounterExitTile`, `calcFacingDirection`, `dirToVector`
- Files modified: `src/game/scenes/OverworldScene.ts`, `src/data/combatConfig.ts`, `src/store/combatStore.ts`, `src/game/scenes/BootScene.ts`, `src/data/npcDialogue.ts`, `src/ui/components/CombatScreen.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Seventh Session)
- **XP & Level System** — Full RPG-style level progression with stat increases
  - **XP fields in gameStore** — `src/store/gameStore.ts`
    - New fields: `xp: number` (current XP), `level: number` (current level, starts at 1)
    - Action: `addXp(amount)` — awards XP and automatically triggers level-up when threshold reached
    - Auto-level threshold: `level * 100` XP per level (100 XP for level 2, 200 for level 3, etc.)
    - **Level-up bonuses**: +5 maxEnergy per level (100 base → 105 at level 2 → 110 at level 3)
  - **Combat HP scaling** — Player HP now scales with level — `src/ui/components/CombatScreen.tsx`
    - Formula: `100 + (level - 1) * 10`
    - Level 1: 100 HP, Level 2: 110 HP, Level 3: 120 HP, etc.
    - HP pool grows alongside energy to reward progression
  - **XP rewards on enemies** — All enemies grant XP on defeat — `src/data/combatConfig.ts`
    - cowlick_npc: 50 XP (scripted encounter)
    - station_ghost_1: 30 XP (random encounter)
    - station_ghost_2: 40 XP (random encounter)
  - **Victory screen shows XP** — Blue "+XP" text appears above yen reward in victory modal — `src/ui/components/CombatScreen.tsx`
    - XP awarded immediately on victory (before continue button)
    - Triggers level-up if threshold reached
- **Character Status Menu (ステータス)** — New first tab in GameMenu shows character stats
  - **Layout** — Classic RPG character screen — `src/ui/components/GameMenu.tsx`
    - Large player portrait (96x96px) in rounded PixelPanel
    - Name: "あなた" (You)
    - Level display with large gold number
    - XP progress bar to next level (shows current/next, percentage fill bar)
    - Max HP stat (combat maximum)
    - Current energy with percentage and blue energy bar
    - Words discovered counter (encountered / total vocabulary)
  - **Tab ordering**: ステータス (Status) → もちもの (Inventory) → ことば (Vocab) → せってい (Settings)
  - Full gamepad support (D-pad navigation, existing tab switching logic)
- **Random Encounters System** — Step-based random battles during overworld exploration
  - **Step counter** in OverworldScene — `src/game/scenes/OverworldScene.ts`
    - `stepsSinceLastBattle` increments on every tile movement
    - When `stepsSinceLastBattle >= encounterThreshold`: trigger random battle
    - `encounterThreshold` randomly set between `minSteps` and `maxSteps` from encounter config
    - **5-step cooldown** after each battle (min threshold enforced)
    - Threshold re-rolled after each battle and map transition
  - **MAP_ENCOUNTERS config** — Per-map encounter tables — `src/data/combatConfig.ts`
    - Fields: `minSteps`, `maxSteps`, `enemies` (array of enemy IDs from COMBAT_ENEMIES)
    - Station map: 8-12 step threshold, pool includes `station_ghost_1` and `station_ghost_2`
    - Random enemy selection from pool on each encounter
  - **Integration**: Random battle starts in `movePlayer()` after tile movement completes
- **New Enemies Added**
  - **station_ghost_1 (ゴースト)** — 60 HP, 15 attack, 150 yen, 30 XP — `src/data/combatConfig.ts`
  - **station_ghost_2 (かげ)** — 80 HP, 15 attack, 200 yen, 40 XP
  - cowlick_npc updated with xpReward: 50
- **UI Polish (from earlier this session)**
  - **Dialogue box advance hint** — Moved to top-right corner, shortened to "[Space] >" / "tap >" with chevron icon
  - **Dialogue box padding** — Reduced bottom padding for tighter layout (85px → 70px desktop, 20px mobile)
  - **Dialogue box width** — Wider on desktop (maxWidth 640px → 750px) for better readability
  - **Energy bar rendering** — Changed from `clipPath` to dynamic overlay sections for smoother animation — `src/ui/components/PlayerHUD.tsx`
  - **PlayerHUD mobile scaling** — Bigger on mobile (110px → 140px) for better visibility
  - **Combat sprite scale** — Universal 0.65 scale for both player and enemy sprites
  - **Combat layout** — Wider container spread (player/enemy panels -27% left/right margin)
  - **Combat button borders** — Compact borders (14px mobile / 16px desktop)
- Files modified: `src/store/gameStore.ts`, `src/data/combatConfig.ts`, `src/game/scenes/OverworldScene.ts`, `src/ui/components/CombatScreen.tsx`, `src/ui/components/GameMenu.tsx`, `src/ui/components/PlayerHUD.tsx`, `src/ui/components/DialogueBox.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Sixth Session)
- **Energy System Implementation** — Learning words now costs energy, driving the core game loop and SRS mechanics
  - **Energy state** added to gameStore — `src/store/gameStore.ts`
    - New fields: `energy: number` (current energy, 0-100) and `maxEnergy: number` (default 100)
    - Actions: `setEnergy(amount)`, `drainEnergy(amount)`, `restoreEnergy(amount)`
    - Persisted to IndexedDB via Dexie auto-save (along with yen, questStates, inventory)
  - **Automatic energy drain** — Every new word encountered costs 2 energy — `src/store/vocabularyStore.ts`
    - Constant: `ENERGY_PER_NEW_WORD = 2`
    - Drain happens in `markEncountered()` function, automatically called when player hovers/taps any new word
    - Train tutorial words exempt: checks `currentScene !== 'TrainRideScene'` before draining
    - Universal system: no per-word configuration needed, all vocabulary drains energy equally
  - **Visual feedback** — PlayerHUD now displays dynamic blue energy bar — `src/ui/components/PlayerHUD.tsx`
    - Lightning bolt icon (32x32px, extracted in previous session)
    - Blue bar sprite (`bar-energy-blue.png`) with CSS `clipPath: inset(0 N% 0 0)` for smooth width animation
    - Bar clips based on actual energy percentage (energy / maxEnergy * 100)
    - Positioned below yen counter in portrait panel
  - **Design notes** — Energy system will drive Chapter 1 pacing:
    - Station has ~37 vocabulary words → ~74 energy drain expected
    - Tanaka house conversations will drain remaining ~25% energy
    - When energy hits 0: NPCs refuse further interaction ("You look tired")
    - Modal forces player to return home, complete SRS review, and sleep
    - Full energy restore after successful review
    - Each chapter follows pattern: explore → learn → energy depletes → SRS/sleep → next day
    - Energy constant can be tuned per chapter if needed, but goal is one universal rate
- **Combat UI Polish** — Continued improvements to battle screen layout and responsiveness
  - **Compact mobile layout** — Reduced all battle menu padding and margins for smaller screens
    - Bottom panel: `borderWidth` responsive (18px mobile / 22px desktop)
    - Action buttons: `borderWidth` responsive (14px mobile / 16px desktop)
    - Mini-game panels: smaller gaps, reduced font sizes, tighter spacing throughout
  - **Sprite positioning improvements** — Both player and enemy sprites now render at consistent 0.65 scale
    - Sprite container width increased (player/enemy panels now -27% left/right margin)
    - Sprites spread to near screen edges on both sides for more dynamic composition
    - Better visual balance on narrow/mobile screens
  - **Victory/Defeat messages in English** — Changed from Japanese to English for clarity
    - Victory screen: "You Win!" (was "勝った！")
    - Defeat screen: "Defeated...!" (was "負けた...")
    - Both messages now use PixelPanel backgrounds with bounce animation
  - **Item toast mobile positioning** — Toast notification position responsive on mobile screens — `src/ui/components/ItemToast.tsx`
- Files modified: `src/store/gameStore.ts`, `src/store/vocabularyStore.ts`, `src/ui/components/PlayerHUD.tsx`, `src/ui/components/CombatScreen.tsx`, `src/ui/components/ItemToast.tsx`, `src/store/database.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Fifth Session)
- **Combat HUD Pixel Art Polish** — Redesigned HP display with pixel art sprites and improved layout
  - **HP panels now take half screen each** — Top HUD panels expanded to fill full width (50% each side) — `src/ui/components/CombatHUD.tsx`
    - Character names enlarged to 14px for better readability
    - Heart icons moved from name rows INTO the HP bars themselves (positioned inside bar area)
    - Names positioned at top-left/top-right of each panel
  - **Pixel art HP bars** — Replaced CSS-drawn HP bars with extracted sprites from Modern_UI_Style_2_32x32.png — `src/ui/components/combat/HUDBar.tsx`
    - Red HP fill: `bar-hp-red.png` (96x32px, extracted from tile 16,13)
    - Empty frame: `bar-empty.png` (96x32px, extracted from tile 15,14)
    - Dynamic width via CSS `clipPath: inset(0 N% 0 0)` for smooth animations
    - Three new asset files: `public/assets/ui/32x32/bar-hp-red.png`, `bar-energy-blue.png`, `bar-empty.png`
  - **Battlefield sprite positioning fixed** — Sprites now absolutely positioned at `top: 40%` of arena — `src/ui/components/CombatScreen.tsx`
    - Prevents sprites from shifting vertically when bottom panel content changes size
    - More stable visual layout during combat phase transitions
- **Item Effect Descriptions** — Food items now show "HP+N" healing amount in green text
  - Food purchase phase shows HP value in matching game — `src/ui/components/FoodMatchingGame.tsx`
  - Inventory tab shows HP value below item names — `src/ui/components/GameMenu.tsx`
  - Combat item submenu already had HP values (no change needed)
  - Consistent green color (#4ade80) for healing amount across all screens
- **Blue Energy Bar Added to PlayerHUD** — New energy display below yen counter — `src/ui/components/PlayerHUD.tsx`
  - Lightning bolt icon (32x32px) extracted from Modern_UI_Style_2_32x32.png tile 10,10 → `public/assets/ui/32x32/icon-lightning.png`
  - Blue energy bar sprite (96x32px) from tile 16,16 → `public/assets/ui/32x32/bar-energy-blue.png`
  - Currently hardcoded to 100% (not hooked up to game store yet)
  - Uses same pixel art bar rendering as combat HP bars (clipPath inset)
- **Larger Backpack Icon in MenuBar** — Increased from 28x28px to 40x40px for better visibility — `src/ui/components/MenuBar.tsx`
- **New Pixel Art Assets Extracted** (all from Modern_UI_Style_2_32x32.png):
  - `public/assets/ui/32x32/bar-hp-red.png` — Red HP bar fill (96x32, tile 16,13)
  - `public/assets/ui/32x32/bar-energy-blue.png` — Blue energy bar fill (96x32, tile 16,16)
  - `public/assets/ui/32x32/bar-empty.png` — Empty bar frame (96x32, tile 15,14)
  - `public/assets/ui/32x32/icon-lightning.png` — Yellow lightning bolt (32x32, tile 10,10)
- Files created: `public/assets/ui/32x32/bar-hp-red.png`, `bar-energy-blue.png`, `bar-empty.png`, `icon-lightning.png`
- Files modified: `src/ui/components/CombatHUD.tsx`, `src/ui/components/combat/HUDBar.tsx`, `src/ui/components/CombatScreen.tsx`, `src/ui/components/PlayerHUD.tsx`, `src/ui/components/MenuBar.tsx`, `src/ui/components/FoodMatchingGame.tsx`, `src/ui/components/GameMenu.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Fourth Session)
- **Combat HUD Redesign** — Moved HP information from beside sprites to top-of-screen panels for cleaner visual layout
  - **Top HP HUD panels** — Created CombatHUD component with two PixelPanel boxes at top of screen — `src/ui/components/CombatHUD.tsx`
    - Heart icon (extracted from Modern UI Style 2 spritesheet tile 11,9) → `public/assets/ui/32x32/icon-heart.png`
    - Character name + HP numbers (current/max)
    - Compact color-coded HP bar: green → orange → red with low-HP pulse animation
    - HUDBar component renders inline HP bar — `src/ui/components/combat/HUDBar.tsx`
  - **Arena cleanup** — CombatScreen sprite area now cleaner — `src/ui/components/CombatScreen.tsx`
    - Removed inline name labels and HP bars from beside enemy and player sprites
    - Arena has `paddingTop: 56` to avoid HUD overlap
    - Sprites show only floating damage numbers (no HP clutter)
  - **Compact bottom panel** — Reduced padding/gaps throughout for mobile-friendly layout
    - Bottom panel borderWidth 44 → 34, minHeight 100 → 80
    - Action button padding 10px → 6px, font sizes reduced
    - VocabQuizBattle, QuickMatchBattle, WordScrambleBattle all got reduced gaps (16 → 8), smaller fonts, smaller button sizes
  - **Battle background** — Switched from PNG to smaller JPG: `train-station-battle-background1.jpg`
  - All combat mini-games (VocabQuiz, QuickMatch, WordScramble) now use compact spacing for smaller screens
- Files created: `src/ui/components/CombatHUD.tsx`, `src/ui/components/combat/HUDBar.tsx`, `public/assets/ui/32x32/icon-heart.png`
- Files modified: `src/ui/components/CombatScreen.tsx`, `src/ui/components/combat/VocabQuizBattle.tsx`, `src/ui/components/combat/QuickMatchBattle.tsx`, `src/ui/components/combat/WordScrambleBattle.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Third Session)
- **Combat Bug Fixes & Polish** — Fixed 5 critical issues preventing smooth combat experience
  - **Controller now works in combat** — OverworldScene was blocking ALL gamepad events during combat — `src/game/scenes/OverworldScene.ts`
    - Problem: Navigation/confirm/cancel events were emitted AFTER the `activeCombat` early-return guard, so React combat UI never received them
    - Solution: Moved D-pad/A/B/left stick navigation event emission to BEFORE the combat guard
    - Now gamepad works fully in combat (D-pad navigates attack menu, A confirms, B cancels)
  - **Enemy damage number now shows** — CombatScreen's `playEnemyAttack` was reading stale ref for damage value — `src/ui/components/CombatScreen.tsx`
    - Problem: `lastDamageTakenRef.current` was always undefined (ref never updated in React flow)
    - Solution: Read damage directly from Zustand store state via `useCombatStore.getState().lastDamageTaken`
    - Floating damage numbers now appear correctly when enemy attacks player
  - **ALL Japanese words underlined in combat dialogue** — Pre-combat and post-battle dialogue now have complete vocab coverage — `src/data/npcDialogue.ts`, `src/japanese/vocabularyDB.ts`
    - Added wordIds to remaining Japanese text: が particle (w_ga), なった verb (w_natta)
    - Created 6 new vocabulary entries: w_doko (どこ — where), w_boku (ぼく — I/me), w_itai (いたい — ouch/painful), w_are (あれ — huh/that), w_shiteta (してた — was doing), w_natta (なった — became)
    - Pre-battle dialogue: "どこ から きた？", "げへへ… ばけもの に なった！"
    - Post-battle dialogue: "いたい...", "あれ？ ぼく は なに を してた...？"
    - All words now tappable for vocabulary learning during combat sequences
  - **Post-battle dialogue auto-triggers** — After combat victory, post-battle dialogue now starts automatically (500ms delay) — `src/ui/components/CombatScreen.tsx`, `src/data/npcDialogue.ts`
    - Victory screen Continue button triggers post-battle dialogue instead of just closing combat
    - Moved inline dialogue to NPC_DIALOGUE registry as `post_battle_cowlick_npc`
    - Player can still re-trigger dialogue by talking to NPC after combat (shows same post-battle dialogue)
    - Creates cohesive story flow: battle → victory screen → enemy's confused reaction
  - **Solid underline placeholders in WordScramble** — Changed from dashed to solid line for better readability — `src/ui/components/combat/WordScrambleBattle.tsx`
    - Dashed lines looked too faint/unclear on small screens
    - Solid gold underline matches rest of UI's bold pixel aesthetic
- Files modified: `src/game/scenes/OverworldScene.ts`, `src/ui/components/CombatScreen.tsx`, `src/ui/components/combat/WordScrambleBattle.tsx`, `src/data/npcDialogue.ts`, `src/japanese/vocabularyDB.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-Second Session)
- **Combat Screen JRPG Visual Overhaul** — Complete redesign with actual LPC character sprites and cinematic visual effects
  - **Full-screen black arena** replacing old PixelPanel-wrapped layout for immersive battle experience
  - **Actual LPC character sprites** for both player and enemy, rendered via CSS background-image at 3x scale (192x192px from 64x64 source)
    - Player on RIGHT side facing left (LPC west row)
    - Enemy on LEFT side facing right (LPC east row)
  - **Combat entry transition**: white flash + screen shatter effect (6x4 grid of shards flying outward) — `src/ui/components/CombatScreen.tsx` lines ~1265-1290
  - **Idle animation**: both sprites breathe/bob using 2-frame idle spritesheet loop with CSS `animation-iteration-count: infinite`
  - **Attack animations** for both player and enemy:
    - Sprite slides toward opponent (300ms CSS transition), opponent sprite animates attack
    - Plays 8-frame slash animation from `1h_slash.png` at ~12fps via keyframe animation
    - At impact frame: target flashes white, floating damage number appears and floats upward with fade-out
    - Screen shake (3 frames via CSS) + red flash overlay when player takes damage
    - Sprite automatically slides back to resting position
  - **Floating damage numbers** with upward float trajectory and opacity fade, stacked vertically for multiple hits
  - **HP bars** with smooth CSS transition animation (matches Phaser built-in bar animation style)
  - **Animation sequencer** (`useAnimSequencer` hook) manages all timing state machine, replacing old hardcoded timer useEffects
    - Hook maintains queue of animations, tracks current phase, prevents animation collision
    - Enables complex multi-step sequences (enter animation → attack animations → result screen)
  - Rewrote `src/ui/components/CombatScreen.tsx` from 826 to 1422 lines
- **Data Layer Updates for Visual System**
  - `src/store/combatStore.ts`: Replaced `spriteColor` with `spriteBase` (path to LPC standard/ directory) in CombatEnemy interface — enables sprite sheet selection per enemy
  - `src/data/combatConfig.ts`: Added `PLAYER_SPRITE_BASE` constant pointing to `lpc:standard/`, updated cowlick_npc with correct `spriteBase` path
- **Pre-Battle Dialogue Improvements** — Enhanced story immersion before combat
  - `src/data/npcDialogue.ts`: Rewrote cowlick-glasses dialogue to show NPC dramatically transforming into a monster — "ばけもの に なった！" (turned into a monster!) with visual narration
  - `src/japanese/types.ts`: Added `nextDialogue?: DialogueNode` field to DialogueNode interface — enables dialogue chaining
  - `src/store/uiStore.ts`: Added nextDialogue handling in `advanceLine()` — when current dialogue ends, automatically chains to next dialogue instead of closing UI
  - Player character reacts with scared portrait: "ばけもの！？ たたかう！" (A monster!? Fight!) before combat starts
  - Creates dramatic buildup: normal NPC → monster transformation sequence → player realization → combat trigger
- **Animation Sequencing Hook** — New `useAnimSequencer` utility for managing complex animation sequences
  - Maintains ordered queue of animation objects (each with id, duration, start time)
  - Tracks `currentSequenceId` for CSS class binding (enables phase-dependent styling)
  - Auto-removes completed animations from queue
  - Prevents race conditions common in useEffect-based animation management
  - Used throughout CombatScreen for enter/attack/result transitions
- Files created: (none new, CombatScreen.tsx completely rewritten)
- Files modified:
  - `src/ui/components/CombatScreen.tsx` (826 → 1422 lines, complete visual overhaul)
  - `src/store/combatStore.ts` (CombatEnemy interface updated)
  - `src/data/combatConfig.ts` (sprite paths + PLAYER_SPRITE_BASE)
  - `src/data/npcDialogue.ts` (pre-combat dialogue with monster transformation)
  - `src/store/uiStore.ts` (nextDialogue chaining support)
  - `src/japanese/types.ts` (nextDialogue field on DialogueNode)
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twenty-First Session)
- **Full Mini-Game-Based Combat System** — Complete turn-based combat where attacks are Japanese learning mini-games
  - **Combat Architecture** — Completely rewritten combat system with phase-based state machine
    - Created `src/data/combatConfig.ts` — Enemy definitions, timer config, damage tables, item healing values
    - Rewrote `src/store/combatStore.ts` — New state machine: intro → action-select → mini-game → player-result → enemy-turn → victory/defeat
    - Created `src/ui/components/CombatScreen.tsx` (~600+ lines) — Full side-view FF-style battle screen with enemy sprite, player portrait, HP bars, action menu
  - **Timer Mechanic** — 10-second countdown bar with damage tier zones
    - Created `src/ui/components/combat/CombatTimer.tsx` — Animated countdown with 3 color zones
    - **Fast zone** (0-3s): Green, 1.5x damage multiplier
    - **Medium zone** (3-6.5s): Yellow, 1.0x damage multiplier
    - **Slow zone** (6.5-9s): Red, 0.5x damage multiplier
    - **Miss** (timeout or wrong answer): 0 damage
  - **Three Attack Mini-Games** — Player chooses attack type from Japanese menu
    - **ことばクイズ** (Vocabulary Quiz) — `src/ui/components/combat/VocabQuizBattle.tsx`
      - 4-choice quiz testing learned vocabulary (pulls from encountered words via `getLearnedWords.ts`)
      - Shows kanji/kana + romaji, 4 English meaning choices
      - Correct = damage, wrong = 0 damage
    - **マッチング** (Quick Match) — `src/ui/components/combat/QuickMatchBattle.tsx`
      - Match 2 Japanese word-meaning pairs from 4 words
      - First match = green checkmark, must complete second match before timer expires
      - Both correct = damage, any wrong = 0 damage
    - **ならべかえ** (Word Scramble) — `src/ui/components/combat/WordScrambleBattle.tsx`
      - Tap scrambled kana tiles in correct order to form a word
      - Shows English hint, must complete before timer expires
      - Correct = damage, wrong/timeout = 0 damage
  - **Weakness System** — Each combat round, enemy randomly weak to one attack type
    - 1.5x damage bonus if player uses the weak attack type
    - Indicated by gold ★ icon next to attack name in menu
    - Changes every round to encourage variety
  - **Damage Formula** — Base 25 × timer tier multiplier × weakness bonus
    - Example: Fast quiz on weak type = 25 × 1.5 × 1.5 = 56 damage
    - Example: Slow match on normal type = 25 × 0.5 × 1.0 = 12 damage
  - **Enemy AI** — Simple random attack system
    - 15 base damage with 0.8-1.2x variance (12-18 damage range)
    - Enemy portrait shakes when attacking
  - **Item Usage in Combat** — Food/drink items from inventory heal HP
    - Menu shows available items with quantities
    - Healing values defined in combatConfig.ts (yakitori=30, onigiri=25, yakiguri=40, drinks=15)
    - Uses `inventoryStore.removeItem()` to consume items
  - **Victory & Defeat** — End-of-combat screens with rewards
    - Victory: Shows "勝った！" (You won!), yen reward (500 for first enemy), XP placeholder, Continue button
    - Defeat: Shows "負けた..." (You lost...), respawn text, Continue button
    - Yen added to gameStore, quest state set to prevent re-triggering
  - **First Enemy Implemented** — 化けメガネくん (Possessed Glasses Guy)
    - 120 HP, 15 attack, 500 yen reward
    - Uses cowlick-glasses NPC sprite (LPC spritesheet)
    - Triggered by talking to cowlick-glasses NPC at train station
    - Added dialogue in `src/data/npcDialogue.ts`: "げへへ… みつかった…？" (combatTrigger: 'cowlick_npc')
    - After defeat: quest state `battle_cowlick_npc_done` prevents re-battle, shows post-combat dialogue "...あれ？ ぼく は なに を してた...？"
  - **Integration & Quest Gating**
    - Combat trigger handled in `src/store/uiStore.ts` advanceLine() with 300ms setTimeout (same pattern as minigames)
    - OverworldScene.tryInteract() checks `battle_cowlick_npc_done` state to show appropriate dialogue
    - GameContainer renders CombatScreen instead of old CombatUI
    - Learned words utility created: `src/ui/components/combat/getLearnedWords.ts` — fetches encountered vocabulary from vocabularyStore
  - **Balance Notes**
    - Fast player (answers in 0-3s): Wins in ~3 rounds, takes ~45 damage
    - Medium player (3-6.5s): Wins in ~5 rounds, takes ~75 damage (may need 1 heal)
    - Slow player (6.5-9s): Wins in ~8+ rounds, needs multiple heals or loses
    - Makes food items essential for slower/learning players
  - **Legacy Files** — Old `src/data/enemies.ts` and `src/ui/components/CombatUI.tsx` kept in codebase but no longer imported
- Files created: `src/ui/components/CombatScreen.tsx`, `src/ui/components/combat/CombatTimer.tsx`, `src/ui/components/combat/VocabQuizBattle.tsx`, `src/ui/components/combat/QuickMatchBattle.tsx`, `src/ui/components/combat/WordScrambleBattle.tsx`, `src/ui/components/combat/getLearnedWords.ts`, `src/data/combatConfig.ts`
- Files modified: `src/store/combatStore.ts` (complete rewrite), `src/store/inventoryStore.ts`, `src/store/uiStore.ts`, `src/ui/components/GameContainer.tsx`, `src/data/npcDialogue.ts`, `src/game/scenes/OverworldScene.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-14 (Twentieth Session)
  - **PC/Phone Mode** (keyboard/touch): "Hold underlined words for definition" shown below "Show English?" button
  - **Controller Mode** (gamepad): Blue X button icon appears next to "Show English?" button, plus instruction text "D-pad to select words, A show definition, B deselect"
  - Clicking "Show English?" in gamepad mode now skips confirmation (directly toggles translation)
  - X icon also displays next to translation text when visible in gamepad mode
  - Extracted X button icon from `Modern_UI_Gamepad_32x32.png` spritesheet → `public/assets/ui/32x32/icon-gp-x.png`
  - Added 'x' button type to GamepadIcon component
- **Full Viewport Mode** — Game canvas now fills entire viewport, eliminating black letterboxing — `src/game/config.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, `src/game/scenes/TrainRideScene.ts`
  - Changed Phaser scale mode from `FIT` to `RESIZE`
  - Different screen sizes show more/less of the map (tiles stay at native pixel size)
  - Added resize handlers to all scenes:
    - **OverworldScene**: Camera viewport updates to match new window size
    - **TitleScene**: Background repositions to center and scales to cover full viewport
    - **TrainRideScene**: Same background handling pattern as TitleScene
  - No more black bars on ultra-wide or non-16:9 displays
- **Romaji Toggle Setting** — Players can now hide romaji readings in vocabulary definitions — `src/store/uiStore.ts`, `src/ui/components/WordPopup.tsx`, `src/ui/components/GameMenu.tsx`
  - Added `showRomaji: boolean` state to uiStore (default: true/ON)
  - WordPopup conditionally displays romaji in parentheses based on setting
  - GameMenu VocabBookContent respects setting in both wide and narrow screen layouts
  - Replaced placeholder "Settings coming soon..." with real SettingsContent UI:
    - Toggle switch for "Show Romaji" with gold/gray sliding knob animation
    - Descriptive subtitle: "Display romaji readings in word definitions"
    - Modern pixel-art styled toggle component
  - Setting not yet persisted to IndexedDB (resets on page reload) — future enhancement
- Files created: `public/assets/ui/32x32/icon-gp-x.png`
- Files modified: `src/game/config.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, `src/game/scenes/TrainRideScene.ts`, `src/store/uiStore.ts`, `src/ui/components/GamepadIcon.tsx`, `src/ui/components/DialogueBox.tsx`, `src/ui/components/WordPopup.tsx`, `src/ui/components/GameMenu.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Nineteenth Session)
- **Unified RPG Menu** — Consolidated inventory, vocab book, and settings into single classic RPG-style menu
  - Created GameMenu React component — `src/ui/components/GameMenu.tsx` (~659 lines)
  - **Layout**: Left navigation tabs (もちもの / ことば / せってい) + right content pane (classic JRPG style)
  - **もちもの (Inventory) Tab**: 3-column grid of items with quantities and images
  - **ことば (Vocab Book) Tab**: Encountered words with mastery filter tabs (All / ★ / ★★ / ★★★), category grouping, tap to expand, searchable
  - **せってい (Settings) Tab**: Placeholder for future settings (text speed, furigana toggle, translation toggle, reset progress)
  - **Navigation**:
    - Keyboard: I key opens menu (defaults to Inventory), V key opens to Vocab tab, Esc closes
    - Gamepad: Y button opens menu, Select button opens Settings tab, B closes
    - Mouse: メニュー button in MenuBar opens menu
  - Replaced three separate screen components (InventoryScreen, VocabBookScreen, SettingsScreen) with single unified menu
- **MenuBar Simplified** — Now shows one メニュー button instead of three separate buttons — `src/ui/components/MenuBar.tsx`
- **uiStore Enhanced** — Added 'menu' to activeMenu union type, supports defaulting to 'inventory' or other tabs — `src/store/uiStore.ts`
- **Vocabulary Fixes** — omiyage JLPT level corrected N4 → N5 — `src/japanese/vocabularyDB.ts`
- **Omiyage Vendor Dialogue Enhanced** — Extended to 4 lines before scramble game triggers (welcome, souvenir question, explains Japanese-only words, instructs sentence assembly) — `src/data/npcDialogue.ts`
- **NPC Sprite Fix** — cowlick-glasses NPC restored to chair-sit pose (SIT_COL=0) — `src/game/scenes/BootScene.ts`
- Files created: `src/ui/components/GameMenu.tsx`
- Files modified: `src/store/uiStore.ts`, `src/ui/components/GameContainer.tsx`, `src/ui/components/MenuBar.tsx`, `src/game/scenes/OverworldScene.ts`, `src/data/npcDialogue.ts`, `src/japanese/vocabularyDB.ts`, `src/game/scenes/BootScene.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Eighteenth Session)
- **Vocab Book Menu Screen** — Built searchable vocabulary reference showing all encountered words
  - Created VocabBookScreen React component — `src/ui/components/VocabBookScreen.tsx` (~443 lines)
  - **Features**:
    - Filter tabs: All / ★ (Seen) / ★★ (Learning) / ★★★ (Known) mapped to vocabulary mastery levels
    - Word counter: "12 / 72" displays encountered words vs total vocabulary
    - Category grouping: Words grouped by tag with gold header labels (Greetings, People, Places, Food & Drink, Verbs, Adjectives, Supernatural, Combat, Pronouns, Location, Daily Life)
    - Compact word rows: Gold mastery stars + kanji/kana + romaji + English meaning
    - Tap to expand: Reveals part of speech, JLPT level badge (N5/N4), encounter count, tap count, example sentence
    - Mobile responsive: useSyncExternalStore for viewport < 500px, hides romaji until expanded, smaller UI elements
    - Gamepad support: B button or Esc to close
    - Empty states: Different messages for "no words yet" vs "no words in this filter"
  - Opened via V key (keyboard) or ことば button (touch) in MenuBar
  - Added 'vocabbook' to uiStore's activeMenu union type — `src/store/uiStore.ts`
  - Added V key binding in OverworldScene — `src/game/scenes/OverworldScene.ts`
  - Added ことば button with 本 icon and [V] keyboard hint to MenuBar — `src/ui/components/MenuBar.tsx`
  - Integrated VocabBookScreen into GameContainer render tree — `src/ui/components/GameContainer.tsx`
  - Uses established UI patterns: PixelPanel styling, DotGothic16 font, gold focus colors (#d4af37), category color scheme
  - Vocabulary progress persistence already working via Dexie (database.ts) — auto-saves and loads encounter/tap counts
- **Design Notes**:
  - Only shows ENCOUNTERED words (not full vocabulary) — learning through gameplay discovery
  - Vocabulary tags system enables flexible category grouping (easily extendable for future chapters)
  - No gamepad button assigned yet for opening vocab book (only keyboard V and touch button)
- Files created: `src/ui/components/VocabBookScreen.tsx`
- Files modified: `src/store/uiStore.ts`, `src/ui/components/MenuBar.tsx`, `src/ui/components/GameContainer.tsx`, `src/game/scenes/OverworldScene.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Seventeenth Session)
- **Sentence Scramble Minigame** — Built 3rd core minigame for teaching Japanese grammar through sentence assembly
  - Created scramble data types and omiyage shop sentence set — `src/data/scrambleData.ts`
    - `ScrambleTile` type: `{ id, textJapanese, textEnglish }`
    - `ScrambleSentence` type: `{ id, correctOrder[], meaningEnglish }`
    - `ScrambleSet` type: `{ id, tiles[], sentences[], reward }` with ScrambleReward for completion bonus
    - `SCRAMBLE_SETS.omiyage_shop`: 3 beginner sentences teaching particles を and の
      - "おみやげ ください" (2 tiles) — "Souvenir, please"
      - "これ を ください" (3 tiles) — "This [object marker] please"
      - "せんせい の おみやげ" (3 tiles) — "Teacher's souvenir"
  - Created SentenceScramble React component — `src/ui/components/SentenceScramble.tsx`
    - Player taps tiles in correct order to assemble Japanese sentence
    - Auto-check when all slots filled: correct = green bounce + "はい！", wrong = red shake + "ちがう！" + reshuffle
    - 3 phases: gameplay (all sentences) → completion feedback (first-try bonus +¥100 or ボーナスなし) → purchase (buy だんご for ¥200)
    - Full gamepad support (D-pad navigate tiles, A to place, B to undo/close)
    - Mobile responsive (useSyncExternalStore for viewport < 500px, smaller borders/padding)
    - Follows all UI patterns: PixelPanel, DotGothic16 font, gold focus highlights, animations, yen coin icon
  - Integrated with dialogue system — `src/japanese/types.ts`, `src/store/uiStore.ts`
    - Added `scrambleTrigger` field to DialogueNode type (same pattern as menuTrigger)
    - Added `activeScrambleGame`, `openScrambleGame()`, `closeScrambleGame()` to uiStore
    - Scramble trigger handled in uiStore.advanceLine() with 300ms setTimeout
  - Added omiyage quest dialogue chain — `src/data/npcDialogue.ts`
    - `fixer_omiyage_prompt`: Tanaka suggests buying omiyage for new sensei
    - `fixer_omiyage_reminder`: Reminds player about omiyage if not bought yet
    - `omiyage_vendor`: Scramble game trigger at vendor interaction zone
    - `fixer_omiyage_done`: Completion dialogue after buying omiyage
  - Extended fixer NPC quest chain in OverworldScene — `src/game/scenes/OverworldScene.ts`
    - Fixer dialogue now gates on food + drink + omiyage before allowing player to leave station
    - Movement blocked during scramble game (same pattern as matching game)
  - Added おみやげ (w_omiyage) vocabulary word — `src/japanese/vocabularyDB.ts`
  - Added interaction zone at tiles (37,19)-(38,19) for omiyage vendor — `src/game/maps/chapter1/tiledTrainStation.ts`
  - GameContainer renders SentenceScramble component — `src/ui/components/GameContainer.tsx`
  - Quest states: `stationOmiyagePrompted`, `stationOmiyageBought`, `scramble_omiyage_shop_done`
- **NPC Sprite Improvements**
  - Cowlick-glasses NPC updated to use ground-sit pose (column 2 of sit spritesheet) — `src/game/maps/chapter1/tiledTrainStation.ts`
  - Matching game: correct match bounce animation on BOTH word and image pair (was only on word) — `src/ui/components/FoodMatchingGame.tsx`
- Files created: `src/data/scrambleData.ts`, `src/ui/components/SentenceScramble.tsx`
- Files modified: `src/japanese/types.ts`, `src/japanese/vocabularyDB.ts`, `src/store/uiStore.ts`, `src/data/npcDialogue.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/game/scenes/OverworldScene.ts`, `src/ui/components/GameContainer.tsx`, `src/ui/components/FoodMatchingGame.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Sixteenth Session)
- **Gamepad/Controller Support (Phase 2 Polish)** — Completed major quality-of-life improvements to gamepad navigation
  - **Button Remapping Improvements** — Better button layout for single-handed gamepad use
    - Y button (index 3) toggles inventory (was Start/B previously)
    - Select button (index 8) toggles settings (new mapping)
    - Allows player to navigate menus with left hand on D-pad/stick, right thumb on face buttons
  - **Button Icons Updated** — Extracted Y and Select button icons from gamepad spritesheet — `public/assets/ui/32x32/icon-gp-y.png`, `icon-gp-select.png`
  - **Unified Spatial Dialogue Navigation** — D-pad AND left stick navigate through ALL focusable items in dialogue — `src/ui/components/DialogueBox.tsx`
    - Replaced separate word/choice navigation states with single `focusedItemId` system
    - `findBestItem()` spatial navigation: finds nearest focusable item in 2D space based on D-pad/stick direction
    - Works for BOTH tappable words (row 0) AND choice buttons (row 1)
    - A button behavior: on word = open WordPopup, on choice = select it, on nothing = advance dialogue
    - B button or navigating away = dismiss WordPopup
  - **Very Obvious Gold Focus Highlight** — Pulsing gold animation on all gamepad-focused elements
    - Dialogue words: gold outline + glow with `gamepad-focus-pulse` animation
    - Dialogue choices: thick gold border + gold background glow + scale up
    - Matching game items: gold border + pulse animation
    - Quiz choice buttons: gold border + pulse animation
  - **A Button Opens Word Popup** — Gamepad can now access vocabulary definitions during dialogue
    - A button on focused word opens WordPopup positioned relative to the word element
    - Popup uses absolute positioning to avoid covering focused word
    - B button dismisses popup and returns to dialogue navigation
  - **Quiz Choice Buttons Stay Visible During Feedback** — Improved quiz feedback UX — `src/ui/components/DialogueBox.tsx`
    - Correct answer: button flashes green + bounce animation
    - Wrong answer: button flashes red + shake animation
    - Choices remain on screen during feedback (removed the old hide-and-show pattern)
    - Player can SEE which choice they selected during feedback animation
  - **Matching Game Full Gamepad Support** — Complete D-pad navigation for matching minigame — `src/ui/components/FoodMatchingGame.tsx`
    - **Matching phase**: 2-column cursor navigation (words left column, images right column)
    - cursorIndex (0-5) navigates between word and image items
    - Automatically skips already-matched items when navigating
    - A button selects word/image, B button closes game
    - **Purchase phase**: D-pad up/down navigates vertical item list, A button purchases
    - Very obvious gold pulsing highlight on cursor-focused items
    - Hint text updates to show gamepad instructions when controller active
  - **Matching Game Close Button** — Added X button in top-right corner for desktop/phone users — `src/ui/components/FoodMatchingGame.tsx`
    - Closes matching game on click (same as gamepad B button)
    - Improves UX for mouse/touch users (previously had to buy something to close)
  - **Controller Works on Title Screen** — TitleScene now polls gamepad input — `src/game/scenes/TitleScene.ts`
    - Added `update()` method with gamepad polling and inputBus emission
    - D-pad, left stick, A/B buttons all emit navigation events
    - TitleScreen React component receives gamepad events via existing useInputAction hooks
  - **Controller Works on Train Tutorial** — TrainRideScene now polls gamepad input — `src/game/scenes/TrainRideScene.ts`
    - Added `update()` method with gamepad polling
    - **IntroPhase**: stacked vertical button layout (fixed too-narrow horizontal layout), D-pad/stick navigation, A to select, gold pulse highlight
    - **QuizPhase**: 2x2 grid navigation with D-pad/stick, A to answer, gold focus highlight
    - All navigation disabled during quiz feedback animation
  - **Movement Blocked During Matching Game** — D-pad doesn't move character while matching game is open — `src/game/scenes/OverworldScene.ts`
    - Added `activeMatchingGame` check to movement guard in OverworldScene
    - Navigation events (navigate_up/down/left/right) still fire for UI navigation (emitted before guard)
    - Character movement blocked after navigation events (after guard)
  - **DialogueFocusActive Flag** — Prevents double-advancing when React has focus — `src/store/uiStore.ts`, `src/game/scenes/OverworldScene.ts`
    - DialogueBox sets `dialogueFocusActive: true` when A button pressed on focused word or unfocused dialogue
    - OverworldScene skips its A button dialogue advance when flag is true
    - Prevents race condition where both React and Phaser respond to same A button press
- **NPCs Added to Train Station** — Added 2 atmosphere NPCs for visual interest — `src/game/maps/chapter1/tiledTrainStation.ts`
  - **cowlick-glasses** at tile (17, 24) facing right — loaded as LPC spritesheet, needs SIT pose variant
  - **pink-pigtails** at tile (30, 33) facing up — loaded as LPC spritesheet
  - Both registered in BootScene with full spritesheet support — `src/game/scenes/BootScene.ts`
- **UI Polish** — Minor visual improvements
  - Word popup wider (280px), smaller kanji text (28px) for better readability — `src/ui/components/WordPopup.tsx`
  - Removed "below" from fixer food prompt dialogue (cleaner phrasing) — `src/data/npcDialogue.ts`
- **Design Brainstorming Session** — Discussed future game systems (not yet implemented)
  - **Energy System**: Learning costs energy → energy drops → buy food for partial restore → go home to rest → SRS review minigame during sleep → full restore. Food CANNOT bypass SRS entirely.
  - **Menu System**: Equipment→Outfits, Spells→Vocab Book (shows encountered words + SRS status), Stats→Character Profile
  - **Sentence Scramble Minigame**: New 3rd minigame at train station. Player rearranges word tiles into correct Japanese sentence order. Teaches grammar (desu/masu forms) and particles (o, no, de). Narrative hook: Tanaka-san suggests buying omiyage (souvenir) for new sensei/boss — need to read the gift tag/card correctly.
  - **Combat**: Still needs design work. One of the 3 minigame types.
  - **Progressive rollout**: Keep it simple, introduce grammar concepts gradually.
- Files modified: `src/game/inputBus.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, `src/game/scenes/TrainRideScene.ts`, `src/ui/components/GamepadIcon.tsx`, `src/ui/components/MenuBar.tsx`, `src/ui/components/DialogueBox.tsx`, `src/ui/components/FoodMatchingGame.tsx`, `src/ui/components/WordPopup.tsx`, `src/ui/components/TrainTutorial.tsx`, `src/store/uiStore.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/game/scenes/BootScene.ts`, `src/data/npcDialogue.ts`
- Files created: `public/assets/ui/32x32/icon-gp-y.png`, `public/assets/ui/32x32/icon-gp-select.png`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Fifteenth Session)
- **Background NPCs Added to Tiled Train Station** — Added 2 atmosphere NPCs to train station map — `src/game/maps/chapter1/tiledTrainStation.ts`
  - **cowlick-glasses** NPC at tile (17, 24) facing south (sitting on bench)
  - **pink-pigtails** NPC at tile (30, 33) facing north (looking at vending machines)
  - Both registered in BootScene with all 8 directional idle sprites — `src/game/scenes/BootScene.ts`
- **CRITICAL FIX: Matching Game A Button** — Fixed game-breaking bug where gamepad A button confirmation was blocked — `src/game/scenes/OverworldScene.ts`
  - Problem: `inputBus.emit('confirm')` was called AFTER the matching game guard, so React hooks never received the confirm event
  - Solution: Moved `inputBus.emit('confirm')` to fire BEFORE all menu/game guards
  - Removed duplicate emit from post-guard A button block
  - Matching game A button now works correctly (selecting matches, purchasing items)
- **Unified Dialogue Navigation System** — Replaced separate word/choice navigation states with single spatial system — `src/ui/components/DialogueBox.tsx`
  - Old approach: `focusedWordIndex` for words + `selectedChoiceIndex` for choices (two navigation trees)
  - New approach: Single `focusedItemId` state spans ALL focusable items (tappable words at row 0 + choice buttons at row 1)
  - `findBestItem()` spatial navigation: D-pad/stick direction finds nearest focusable item in 2D space
  - A button behavior: on word = show WordPopup, on choice = select it, on nothing = advance dialogue
  - B button or navigating away = dismiss WordPopup
  - Added `dialogueFocusActive` flag to uiStore to prevent OverworldScene from double-advancing dialogue when A is pressed in dialogue UI
- **Left Stick Navigation Support** — Left analog stick now emits navigation events everywhere — `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, `src/game/scenes/TrainRideScene.ts`
  - Stick navigation fires `navigate_up/down/left/right` events when crossing deadzone threshold (0.3)
  - Edge detection: only fires on direction change between frames (tracked via `stickNavPrev` field)
  - Works in dialogue, matching game, menus, title screen, train tutorial — everywhere D-pad works
  - No duplicate movement: stick navigation blocked when movement disabled (matching game, dialogue)
- **Controller Support on Title Screen** — TitleScene now polls gamepad input — `src/game/scenes/TitleScene.ts`
  - Added `update()` method with gamepad polling and inputBus emission
  - D-pad, left stick, A/B buttons all emit events
  - TitleScreen React component's existing useInputAction hooks now receive gamepad events
- **Controller Support on Train Tutorial** — TrainRideScene now polls gamepad input — `src/game/scenes/TrainRideScene.ts`
  - Added `update()` method with gamepad polling and inputBus emission
  - **IntroPhase**: stacked button layout (fixed too-narrow horizontal layout), D-pad/stick navigation, A to select, gold pulse highlight
  - **QuizPhase**: 2x2 grid navigation with D-pad/stick, A to answer, gold focus highlight
  - All navigation disabled during quiz feedback animation
- **Matching Game Movement Block** — Added `activeMatchingGame` check to OverworldScene movement guard — `src/game/scenes/OverworldScene.ts`
  - D-pad and stick still work for matching game UI navigation (navigation events emitted before guard)
  - Character movement blocked during matching game (after navigation events)
  - Prevents player from walking around while matching game is open
- Files modified: `src/game/scenes/BootScene.ts`, `src/game/maps/chapter1/tiledTrainStation.ts`, `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, `src/game/scenes/TrainRideScene.ts`, `src/ui/components/DialogueBox.tsx`, `src/ui/components/TrainTutorial.tsx`, `src/store/uiStore.ts`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Fourteenth Session)
- **Gamepad/Controller Support (Phase 1)** — Full gamepad input system with event bus architecture bridging Phaser polling to React components
  - **Input Bus System** — Created synchronous event emitter for gamepad actions — `src/game/inputBus.ts`
    - `InputAction` types: confirm, cancel, navigate_up/down/left/right, menu_inventory
    - Synchronous dispatch pattern (no async, no promises) for frame-accurate response
  - **React Hook** — Created `useInputAction(action, callback)` hook for subscribing to input bus — `src/ui/hooks/useInputAction.ts`
  - **Phaser Config** — Enabled `input.gamepad: true` in game config — `src/game/config.ts`
  - **Input Mode Tracking** — Added `inputMode: 'keyboard' | 'gamepad' | 'touch'` state to uiStore with `setInputMode` action — `src/store/uiStore.ts`
  - **OverworldScene Gamepad Polling** — Full gamepad support in overworld — `src/game/scenes/OverworldScene.ts`
    - Left stick + D-pad movement (deadzone 0.3, speed 3.0)
    - A button (South): interact with NPCs/zones, advance dialogue
    - B button (East): cancel/close menus
    - Start button: toggle inventory
    - Just-pressed edge detection for buttons (prevents repeat firing)
    - Input mode auto-switching (gamepad mode when any gamepad input detected)
    - InputBus emission for all button actions
  - **DialogueBox Gamepad Navigation** — D-pad choice selection with gold highlight (#d4af37), A button to confirm — `src/ui/components/DialogueBox.tsx`
  - **TitleScreen Gamepad Navigation** — D-pad menu item selection, A button to select, visual highlight — `src/ui/components/TitleScreen.tsx`
  - **MenuBar Gamepad Icons** — Shows gamepad button icons when controller active, keyboard hints when keyboard active — `src/ui/components/MenuBar.tsx`
  - **InventoryScreen/SettingsScreen** — B button closes menus via useInputAction('cancel') — `src/ui/components/InventoryScreen.tsx`, `src/ui/components/SettingsScreen.tsx`
  - **Gamepad Button Icons** — Created GamepadIcon component and extracted 3 button icons from Modern_UI_Gamepad_32x32.png spritesheet — `src/ui/components/GamepadIcon.tsx`
    - A button (South): `icon-gp-a.png` (32x32px)
    - B button (East): `icon-gp-b.png` (32x32px)
    - Start button: `icon-gp-start.png` (32x32px)
  - **Standard Button Mapping**:
    - A (South) = Confirm / Interact / Advance dialogue
    - B (East) = Cancel / Close menus
    - Start = Toggle inventory
    - D-pad / Left stick = Movement (overworld) or Navigate (menus/choices)
- **Gamepad/Controller Support (Phase 2)** — Extended gamepad support with button remapping and comprehensive UI navigation
  - **Button Remapping** — Improved button layout and added settings menu trigger
    - Y button (index 3) now toggles inventory (previously Start/index 9)
    - Select button (index 8) now toggles settings (new mapping)
    - Added `'menu_settings'` action to inputBus — `src/game/inputBus.ts`
    - Updated OverworldScene to handle new Y and Select button mappings — `src/game/scenes/OverworldScene.ts`
    - Extracted Y and Select button icons from gamepad spritesheet — `public/assets/ui/32x32/icon-gp-y.png`, `public/assets/ui/32x32/icon-gp-select.png`
    - MenuBar shows correct Y and Select icons in gamepad mode — `src/ui/components/MenuBar.tsx`
  - **Dialogue Word Navigation** — D-pad left/right cycles through tappable Japanese words in dialogue — `src/ui/components/DialogueBox.tsx`
    - D-pad left/right moves focus between underlined vocabulary words
    - A button opens WordPopup for focused word
    - Very obvious gold pulsing highlight on focused word (outline + glow animation)
    - Focus resets when dialogue line changes or input mode switches away from gamepad
    - Only active when dialogue choices are NOT showing (choices have priority)
  - **Enhanced Dialogue Choice Highlight** — Much more obvious selection feedback — `src/ui/components/DialogueBox.tsx`
    - Selected choice: thick gold border, gold background glow, slight scale up
    - Pulsing `gamepad-focus-pulse` animation for visibility
    - Non-selected choices use transparent border to prevent layout shift
  - **Matching Game Gamepad Support** — Full D-pad navigation in food/drink matching games — `src/ui/components/FoodMatchingGame.tsx`
    - Matching phase: 2-column grid navigation (words left, images right)
    - cursorIndex (0-5) navigates between word and image columns
    - Automatically skips already-matched items when navigating
    - Purchase phase: D-pad up/down navigates vertical item list
    - A button selects/purchases, B button closes
    - Close button (X) added in top-right corner for desktop/phone users
    - Very obvious gold pulsing highlight on cursor-focused items
    - Hint text updates to show gamepad instructions when controller active
- **Git Repository Setup** — Initialized git repo and connected to GitHub
  - Initialized git in project root: `git init`
  - Added remote: `git@github.com:CreativLLC/bakemachi.git`
  - Updated `.gitignore` with Claude/Playwright temp directories (`/.claude/`, `/.playwright-mcp/`, `nul`, `*.tiled-session`)
  - Updated `CLAUDE.md` with git remote info
  - Made initial commit (full project) and pushed to GitHub
  - Git commits:
    - `f565b9a` — Initial commit: full project
    - `a56fe3a` — Gamepad/controller support (Phase 1)
    - `[pending]` — Gamepad/controller support (Phase 2)
- Files created (Phase 1): `src/game/inputBus.ts`, `src/ui/hooks/useInputAction.ts`, `src/ui/components/GamepadIcon.tsx`, `public/assets/ui/32x32/icon-gp-a.png`, `public/assets/ui/32x32/icon-gp-b.png`, `public/assets/ui/32x32/icon-gp-start.png`
- Files created (Phase 2): `public/assets/ui/32x32/icon-gp-y.png`, `public/assets/ui/32x32/icon-gp-select.png`
- Files modified (Phase 1): `src/game/config.ts`, `src/store/uiStore.ts`, `src/game/scenes/OverworldScene.ts`, `src/ui/components/DialogueBox.tsx`, `src/ui/components/TitleScreen.tsx`, `src/ui/components/MenuBar.tsx`, `src/ui/components/InventoryScreen.tsx`, `src/ui/components/SettingsScreen.tsx`, `CLAUDE.md`, `.gitignore`
- Files modified (Phase 2): `src/game/inputBus.ts`, `src/game/scenes/OverworldScene.ts`, `src/ui/components/GamepadIcon.tsx`, `src/ui/components/MenuBar.tsx`, `src/ui/components/DialogueBox.tsx`, `src/ui/components/FoodMatchingGame.tsx`
- Type check passed via `npx tsc --noEmit`

### 2026-02-13 (Thirteenth Session)
- **CRITICAL BUG FIX: Yen was never being saved!** — `src/store/database.ts`
  - Yen field existed in gameStore but was missing from 4 critical locations in database.ts:
    - `GameSaveRecord` type (TypeScript interface)
    - `saveGameState()` function (data extraction)
    - `debouncedSaveGame()` subscription (store listener)
    - `initializeFromDB()` hydration (boot-time restore)
  - Added yen to all 4 locations with backward compatibility (`gameSave.yen ?? 2000` fallback for existing saves)
  - Auto-save now properly persists yen changes to IndexedDB
- **Inventory Persistence System** — Added IndexedDB auto-save for inventoryStore — `src/store/database.ts`
  - Upgraded Dexie schema to version 2 with new `inventory` table
  - Created `InventorySaveRecord` type: `{ id: 'current', items: InventoryItem[] }`
  - Implemented `saveInventory()` and `loadInventory()` helper functions
  - Added debounced subscription (500ms) to inventoryStore changes
  - Integrated inventory hydration in `initializeFromDB()` boot sequence
  - Follows same patterns as game state persistence (single 'current' save slot, auto-save on change)
- **ItemToast Alignment Fix** — Improved positioning to match PlayerHUD — `src/ui/components/ItemToast.tsx`
  - Removed wrapper div, applied absolute positioning directly to PixelPanel
  - Set `borderWidth: 44` to match PlayerHUD's border thickness
  - Toast now aligns flush with left edge of HUD (both use same border width)
- **MenuBar Icons Added** — Extracted and added visual icons to menu buttons — `src/ui/components/MenuBar.tsx`
  - Backpack icon (green, 64x64px) extracted from Modern UI spritesheet tile (12, 4) → `public/assets/ui/32x32/icon-backpack.png`
  - Gear icon (32x32px) extracted from spritesheet tile (15, 1) → `public/assets/ui/32x32/icon-gear.png`
  - Icons display above Japanese text labels in both buttons
  - Japanese terminology confirmed correct: もちもの (持ち物 = belongings/items) and せってい (設定 = settings) are standard game UI terms
- Files created: `public/assets/ui/32x32/icon-backpack.png`, `public/assets/ui/32x32/icon-gear.png`
- Files modified: `src/store/database.ts`, `src/ui/components/ItemToast.tsx`, `src/ui/components/MenuBar.tsx`
- Type check passed via `npx tsc --noEmit`

### Sessions 1-12 (2026-02-11 to 2026-02-13) — Foundation & Core Systems
<details>
<summary>Click to expand early session history</summary>

- **Session 1**: Created agent workflow, PROGRESS.md, town outdoor map (70x55), konbini interior, map transitions, 6 NPCs, 2 vocab words
- **Session 2**: Town map redesign (3rd iteration) — default-blocked collision, road network, 30+ buildings, 30 trees, 40 street objects, door entry arrows
- **Session 3**: Fence boundary collision system replacing bush sweep, fixed building-on-bush visual issues
- **Session 4**: PixelLab composite map integration — pre-rendered PNG terrain as ground layer, test map proof-of-concept
- **Session 5**: LPC spritesheet integration — replaced 56 individual PNGs with single `lpc-walk.png`, 4-direction movement
- **Session 6**: Tiled map import pipeline — Modern Exteriors 32px tileset, 0.5x camera zoom, game starts on Tiled station
- **Session 7**: Interaction zones, LPC NPC rendering (`lpc:` prefix), fixer + food stall NPCs migrated to LPC, station map update
- **Session 8**: Fixed LPC idle rendering (use walk.png col 0), foreground layer support, major UI reskin with Limezu Modern UI (PixelPanel 9-slice)
- **Session 9**: DotGothic16 font, rounded panel fix (0,576), thicker borders, enlarged portraits, yen coin icon, wrong-answer resets, first-try bonus
- **Session 10**: Bidirectional matching game selection, feedback timer fix (stale setTimeout), portrait positioning polish
- **Session 11**: Dialogue quiz system with bounce/shake feedback, Tanaka greeting quiz (¥50 bonus), 3 new vocab words
- **Session 12**: Inventory system (inventoryStore + InventoryScreen), MenuBar, ItemToast notifications, keyboard shortcuts (I/Esc), feedbackKey pattern, food stall dialogue cleanup

</details>

### Pre-tracking (Phases 1-4)
- Phase 1: Project scaffolding (Vite + React + Phaser + full file structure)
- Phase 2: Core data layer (62 vocab words, 7 grammar patterns, Dexie persistence, text parser)
- Phase 3: Train ride vocabulary tutorial + station dialogue
- Phase 4: Train station map (26x25), cutscene system, title screen, food/drink purchasing
