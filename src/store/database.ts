import Dexie from 'dexie';
import type { Table } from 'dexie';
import { useGameStore } from './gameStore.ts';
import { useVocabularyStore } from './vocabularyStore.ts';
import { useSettingsStore } from './settingsStore.ts';
import { useInventoryStore } from './inventoryStore.ts';

// ---------------------------------------------------------------------------
// Record shapes stored in IndexedDB
// ---------------------------------------------------------------------------

interface GameSaveRecord {
  id: string;
  currentScene: string;
  currentMap: string;
  playerPosition: { x: number; y: number };
  chapter: number;
  yen: number;
  questStates: Record<string, string>;
}

interface WordProgress {
  wordId: string;
  firstSeen: number;
  timesEncountered: number;
  timesTapped: number;
  lastSeen: number;
  mastery: 'new' | 'seen' | 'learning' | 'known';
  exportedToAnki: boolean;
}

interface VocabularyProgressRecord {
  id: string;
  progress: Record<string, WordProgress>;
}

interface SettingsRecord {
  id: string;
  textSpeed: 'slow' | 'normal' | 'fast';
  showTranslation: boolean;
  showFurigana: boolean;
  hideKanaModal?: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
}

interface InventorySaveRecord {
  id: string;
  items: InventoryItem[];
}

// ---------------------------------------------------------------------------
// Dexie database class
// ---------------------------------------------------------------------------

class BakemachiDB extends Dexie {
  gameSaves!: Table<GameSaveRecord, string>;
  vocabularyProgress!: Table<VocabularyProgressRecord, string>;
  settings!: Table<SettingsRecord, string>;
  inventory!: Table<InventorySaveRecord, string>;

  constructor() {
    super('bakemachi');
    this.version(1).stores({
      gameSaves: 'id',
      vocabularyProgress: 'id',
      settings: 'id',
    });
    this.version(2).stores({
      inventory: 'id',
    });
  }
}

/** Singleton database instance */
export const db = new BakemachiDB();

// ---------------------------------------------------------------------------
// Helper constants
// ---------------------------------------------------------------------------

const CURRENT = 'current';

// ---------------------------------------------------------------------------
// Save helpers
// ---------------------------------------------------------------------------

export async function saveGameState(state: {
  currentScene: string;
  currentMap: string;
  playerPosition: { x: number; y: number };
  chapter: number;
  yen: number;
  questStates: Record<string, string>;
}): Promise<void> {
  try {
    await db.gameSaves.put({
      id: CURRENT,
      currentScene: state.currentScene,
      currentMap: state.currentMap,
      playerPosition: state.playerPosition,
      chapter: state.chapter,
      yen: state.yen,
      questStates: state.questStates,
    });
  } catch (err) {
    console.error('[BakemachiDB] Failed to save game state:', err);
  }
}

export async function loadGameState(): Promise<GameSaveRecord | undefined> {
  try {
    return await db.gameSaves.get(CURRENT);
  } catch (err) {
    console.error('[BakemachiDB] Failed to load game state:', err);
    return undefined;
  }
}

export async function saveVocabularyProgress(progress: Record<string, WordProgress>): Promise<void> {
  try {
    await db.vocabularyProgress.put({
      id: CURRENT,
      progress,
    });
  } catch (err) {
    console.error('[BakemachiDB] Failed to save vocabulary progress:', err);
  }
}

export async function loadVocabularyProgress(): Promise<VocabularyProgressRecord | undefined> {
  try {
    return await db.vocabularyProgress.get(CURRENT);
  } catch (err) {
    console.error('[BakemachiDB] Failed to load vocabulary progress:', err);
    return undefined;
  }
}

export async function saveInventory(items: InventoryItem[]): Promise<void> {
  try {
    await db.inventory.put({ id: CURRENT, items });
  } catch (err) {
    console.error('[BakemachiDB] Failed to save inventory:', err);
  }
}

export async function loadInventory(): Promise<InventorySaveRecord | undefined> {
  try {
    return await db.inventory.get(CURRENT);
  } catch (err) {
    console.error('[BakemachiDB] Failed to load inventory:', err);
    return undefined;
  }
}

export async function saveSettings(settings: {
  textSpeed: 'slow' | 'normal' | 'fast';
  showTranslation: boolean;
  showFurigana: boolean;
  hideKanaModal: boolean;
}): Promise<void> {
  try {
    await db.settings.put({
      id: CURRENT,
      textSpeed: settings.textSpeed,
      showTranslation: settings.showTranslation,
      showFurigana: settings.showFurigana,
      hideKanaModal: settings.hideKanaModal,
    });
  } catch (err) {
    console.error('[BakemachiDB] Failed to save settings:', err);
  }
}

export async function loadSettings(): Promise<SettingsRecord | undefined> {
  try {
    return await db.settings.get(CURRENT);
  } catch (err) {
    console.error('[BakemachiDB] Failed to load settings:', err);
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Boot-time hydration
// ---------------------------------------------------------------------------

/**
 * Load all persisted data from IndexedDB and hydrate the Zustand stores.
 * Call this once before rendering the React tree.
 */
export async function initializeFromDB(): Promise<void> {
  try {
    const [gameSave, vocabRecord, settingsRecord, inventoryRecord] = await Promise.all([
      loadGameState(),
      loadVocabularyProgress(),
      loadSettings(),
      loadInventory(),
    ]);

    if (gameSave) {
      useGameStore.setState({
        currentScene: gameSave.currentScene,
        currentMap: gameSave.currentMap,
        playerPosition: gameSave.playerPosition,
        chapter: gameSave.chapter,
        yen: gameSave.yen ?? 2000,
        questStates: gameSave.questStates,
      });
    }

    if (inventoryRecord) {
      // Migrate stale image paths from earlier versions
      const IMAGE_MIGRATIONS: Record<string, string> = {
        '/assets/sprites/objects/items/postcard.png': '/assets/sprites/objects/various/postcard.png',
        'assets/sprites/objects/food/dango.png': '/assets/sprites/objects/various/sensei-omiyage.png',
      };
      const ID_MIGRATIONS: Record<string, { id: string; name: string }> = {
        omiyage_dango: { id: 'sensei_omiyage', name: 'おみやげ' },
      };
      const migratedItems = inventoryRecord.items.map((item) => {
        const newImage = IMAGE_MIGRATIONS[item.image];
        const idMigration = ID_MIGRATIONS[item.id];
        return {
          ...item,
          ...(newImage ? { image: newImage } : {}),
          ...(idMigration ? { id: idMigration.id, name: idMigration.name } : {}),
        };
      });
      useInventoryStore.setState({ items: migratedItems });
    }

    if (vocabRecord) {
      useVocabularyStore.setState({
        progress: vocabRecord.progress,
      });
    }

    if (settingsRecord) {
      useSettingsStore.setState({
        textSpeed: settingsRecord.textSpeed,
        showTranslation: settingsRecord.showTranslation,
        showFurigana: settingsRecord.showFurigana,
        hideKanaModal: settingsRecord.hideKanaModal ?? false,
      });
    }
  } catch (err) {
    console.error('[BakemachiDB] Failed to initialize from DB:', err);
  }
}

// ---------------------------------------------------------------------------
// Debounce utility (no external dependency needed)
// ---------------------------------------------------------------------------

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

// ---------------------------------------------------------------------------
// Auto-save subscriptions
//
// We set these up immediately when this module is imported. Each Zustand
// store is subscribed to; on change the relevant data is persisted to
// IndexedDB after a short debounce (500 ms).
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 500;

const debouncedSaveGame = debounce(() => {
  const { currentScene, currentMap, playerPosition, chapter, yen, questStates } =
    useGameStore.getState();
  void saveGameState({ currentScene, currentMap, playerPosition, chapter, yen, questStates });
}, DEBOUNCE_MS);

const debouncedSaveVocabulary = debounce(() => {
  const { progress } = useVocabularyStore.getState();
  void saveVocabularyProgress(progress);
}, DEBOUNCE_MS);

const debouncedSaveSettings = debounce(() => {
  const { textSpeed, showTranslation, showFurigana, hideKanaModal } = useSettingsStore.getState();
  void saveSettings({ textSpeed, showTranslation, showFurigana, hideKanaModal });
}, DEBOUNCE_MS);

const debouncedSaveInventory = debounce(() => {
  const { items } = useInventoryStore.getState();
  void saveInventory(items);
}, DEBOUNCE_MS);

// Subscribe — Zustand's subscribe fires on every state change.
useGameStore.subscribe(debouncedSaveGame);
useVocabularyStore.subscribe(debouncedSaveVocabulary);
useSettingsStore.subscribe(debouncedSaveSettings);
useInventoryStore.subscribe(debouncedSaveInventory);
