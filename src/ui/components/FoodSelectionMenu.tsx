import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { FOOD_MENUS } from '../../data/foodMenuData';
import { getWord } from '../../japanese/vocabularyDB';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD } from '../pixelTheme';
import type { FoodMenuItem } from '../../data/foodMenuData';

export function FoodSelectionMenu() {
  const activeFoodMenu = useUIStore((s) => s.activeFoodMenu);
  const closeFoodMenu = useUIStore((s) => s.closeFoodMenu);
  const startDialogue = useUIStore((s) => s.startDialogue);
  const setQuestState = useGameStore((s) => s.setQuestState);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);

  if (!activeFoodMenu) return null;

  const menu = FOOD_MENUS[activeFoodMenu];
  if (!menu) return null;

  const handleSelect = (item: FoodMenuItem) => {
    // Mark the food word as encountered
    markEncountered(item.wordId);

    // Set quest state based on menu type (food stall = food, vending machine = drink)
    if (activeFoodMenu === 'vending_machine') {
      setQuestState('stationDrinkBought', 'true');
    } else {
      setQuestState('stationFoodBought', 'true');
    }

    // Close the menu
    closeFoodMenu();

    // Show follow-up dialogue
    const followUp = NPC_DIALOGUE['douzo_response'];
    if (followUp) {
      setTimeout(() => startDialogue(followUp), 200);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: UI.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
    }}>
      <PixelPanel borderWidth={52} style={{
        padding: '24px 32px',
        maxWidth: 600,
        width: '90%',
      }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontSize: 18,
          color: UI.gold,
          marginBottom: 20,
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
          letterSpacing: '0.1em',
        }}>
          {menu.title}
        </div>

        {/* Item grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(menu.items.length, 4)}, 1fr)`,
          gap: 16,
        }}>
          {menu.items.map((item) => {
            const word = getWord(item.wordId);
            return (
              <PixelPanel
                key={item.id}
                borderWidth={22}
                style={{ cursor: 'pointer' }}
              >
                <button
                  onClick={() => handleSelect(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                >
                  {/* Food image */}
                  <img
                    src={item.image}
                    alt={word?.meaning ?? item.id}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                    }}
                  />
                  {/* Japanese name */}
                  <div style={{
                    fontSize: 18,
                    color: UI.text,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                  }}>
                    {word?.kana ?? item.id}
                  </div>
                  {/* English meaning */}
                  <div style={{
                    fontSize: 11,
                    color: UI.textMuted,
                    fontFamily: UI_FONT,
                  }}>
                    {word?.meaning ?? ''}
                  </div>
                  {/* Price */}
                  <div style={{
                    fontSize: 13,
                    color: UI.gold,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                  }}>
                    <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 2 }} />{item.price}
                  </div>
                </button>
              </PixelPanel>
            );
          })}
        </div>

        {/* Cancel hint */}
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: UI.textFaded,
          marginTop: 16,
          fontFamily: UI_FONT,
        }}>
          Click an item to buy
        </div>
      </PixelPanel>
    </div>
  );
}
