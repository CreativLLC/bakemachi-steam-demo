import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useCombatStore } from '../../store/combatStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, PANELS } from '../pixelTheme';

const mobileSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsMobile = () => window.innerWidth <= 768;

// ---------------------------------------------------------------------------
// Quest definitions
// ---------------------------------------------------------------------------

interface QuestDef {
  id: string;
  text: string;
  /** Returns true when this quest should be shown */
  isActive: (qs: Record<string, string>) => boolean;
  /** Returns true when this quest is completed */
  isComplete: (qs: Record<string, string>) => boolean;
}

const QUEST_DEFINITIONS: QuestDef[] = [
  {
    id: 'buy_food',
    text: 'Buy たべもの (food)',
    isActive: (qs) => qs.stationArrivalPlayed === 'true',
    isComplete: (qs) => qs.stationFoodBought === 'true',
  },
  {
    id: 'buy_drink',
    text: 'Buy 飲み物 (drink)',
    isActive: (qs) => qs.stationArrivalPlayed === 'true',
    isComplete: (qs) => qs.stationDrinkBought === 'true',
  },
  {
    id: 'talk_tanaka_omiyage',
    text: 'Talk to 田中さん',
    isActive: (qs) =>
      qs.stationFoodBought === 'true' &&
      qs.stationDrinkBought === 'true' &&
      qs.stationOmiyagePrompted !== 'true',
    isComplete: (qs) => qs.stationOmiyagePrompted === 'true',
  },
  {
    id: 'buy_omiyage',
    text: 'Buy おみやげ for せんせい',
    isActive: (qs) =>
      qs.stationOmiyagePrompted === 'true' &&
      qs.stationOmiyageBought !== 'true',
    isComplete: (qs) => qs.stationOmiyageBought === 'true',
  },
  {
    id: 'talk_tanaka_home',
    text: 'Talk to 田中さん',
    isActive: (qs) =>
      qs.stationOmiyageBought === 'true' &&
      qs.cowlickCutscenePlayed !== 'true',
    isComplete: (qs) => qs.cowlickCutscenePlayed === 'true',
  },
  {
    id: 'follow_tanaka',
    text: 'Follow 田中さん to おうち',
    isActive: (qs) =>
      qs.cowlickCutscenePlayed === 'true' &&
      qs.phoneCallDone !== 'true',
    isComplete: (qs) => qs.phoneCallDone === 'true',
  },
  {
    id: 'buy_sister_present',
    text: 'Buy a toy for いもうと',
    isActive: (qs) =>
      qs.phoneCallDone === 'true' &&
      qs.stationSisterPresentBought !== 'true',
    isComplete: (qs) => qs.stationSisterPresentBought === 'true',
  },
  {
    id: 'buy_postcard',
    text: 'Buy はがき for Grandma',
    isActive: (qs) =>
      qs.phoneCallDone === 'true' &&
      qs.stationPostcardBought !== 'true',
    isComplete: (qs) => qs.stationPostcardBought === 'true',
  },
  {
    id: 'leave_station',
    text: 'Head to the exit',
    isActive: (qs) =>
      qs.stationSisterPresentBought === 'true' &&
      qs.stationPostcardBought === 'true',
    // This quest never "completes" — the player transitions away
    isComplete: () => false,
  },
];

// ---------------------------------------------------------------------------
// Animated quest row
// ---------------------------------------------------------------------------

function QuestRow({ text, completed, isMobile }: { text: string; completed: boolean; isMobile: boolean }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (completed) {
      const timer = setTimeout(() => setFading(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [completed]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: isMobile ? 4 : 6,
        fontFamily: UI_FONT,
        fontSize: isMobile ? 11 : 13,
        color: completed ? '#6edb6e' : UI.text,
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 0.5s ease-out' : undefined,
      }}
    >
      {completed ? (
        <img
          src="/assets/ui/32x32/checkmark.png"
          alt="done"
          style={{
            width: isMobile ? 12 : 16,
            height: isMobile ? 12 : 16,
            imageRendering: 'pixelated',
            flexShrink: 0,
            marginTop: 2,
            animation: 'quest-check-pop 0.3s ease-out',
          }}
        />
      ) : (
        <span style={{ flexShrink: 0, fontSize: isMobile ? 8 : 10, lineHeight: 1, marginTop: 3 }}>
          {'▸'}
        </span>
      )}
      <span style={{
        textDecoration: completed ? 'line-through' : 'none',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textOverflow: 'ellipsis',
      }}>
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quest Tracker HUD
// ---------------------------------------------------------------------------

interface TrackedQuest {
  id: string;
  text: string;
  completed: boolean;
}

export function QuestTracker() {
  const currentScene = useGameStore((s) => s.currentScene);
  const currentMap = useGameStore((s) => s.currentMap);
  const questStates = useGameStore((s) => s.questStates);
  const isCombatActive = useCombatStore((s) => s.isActive);
  const isDialogueActive = useUIStore((s) => s.isDialogueActive);
  const activeMenu = useUIStore((s) => s.activeMenu);
  const activeMatchingGame = useUIStore((s) => s.activeMatchingGame);
  const activeScrambleGame = useUIStore((s) => s.activeScrambleGame);
  const activeReadingGame = useUIStore((s) => s.activeReadingGame);

  // Track which quests have been seen as completed so we can animate them
  const completedRef = useRef<Set<string>>(new Set());
  const [displayQuests, setDisplayQuests] = useState<TrackedQuest[]>([]);

  useEffect(() => {
    const active: TrackedQuest[] = [];
    const justCompleted: TrackedQuest[] = [];

    for (const quest of QUEST_DEFINITIONS) {
      // For the leave_station quest, also check we are on the right map
      if (quest.id === 'leave_station' && currentMap !== 'tiled_train_station') {
        continue;
      }

      const wasComplete = completedRef.current.has(quest.id);
      const isComplete = quest.isComplete(questStates);
      const isActive = quest.isActive(questStates);

      if (isComplete && !wasComplete && isActive) {
        // Just completed -- show checkmark animation then fade
        completedRef.current.add(quest.id);
        justCompleted.push({ id: quest.id, text: quest.text, completed: true });
      } else if (isComplete && wasComplete) {
        // Already completed previously -- skip
        continue;
      } else if (isActive && !isComplete) {
        active.push({ id: quest.id, text: quest.text, completed: false });
      }
    }

    setDisplayQuests([...active, ...justCompleted]);

    // Remove completed quests from display after the fade animation
    if (justCompleted.length > 0) {
      const timer = setTimeout(() => {
        setDisplayQuests((prev) =>
          prev.filter((q) => !q.completed)
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [questStates, currentMap]);

  const isMobile = useSyncExternalStore(mobileSubscribe, getIsMobile);

  // Hide conditions
  if (currentScene !== 'Overworld') return null;
  if (isCombatActive) return null;
  if (isDialogueActive) return null;
  if (activeMenu) return null;
  if (activeMatchingGame || activeScrambleGame || activeReadingGame) return null;
  if (displayQuests.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes quest-check-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes quest-tracker-fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <PixelPanel
        borderWidth={isMobile ? 28 : 34}
        panelOrigin={PANELS.rounded}
        style={{
          position: 'absolute',
          top: isMobile ? 0 : 12,
          right: isMobile ? 0 : 12,
          zIndex: 50,
          maxWidth: isMobile ? 180 : 220,
          padding: isMobile ? '4px 8px' : '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 2 : 4,
          pointerEvents: 'none',
          animation: 'quest-tracker-fade-in 0.3s ease-out',
        }}
      >
        {displayQuests.map((q) => (
          <QuestRow key={q.id} text={q.text} completed={q.completed} isMobile={isMobile} />
        ))}
      </PixelPanel>
    </>
  );
}
