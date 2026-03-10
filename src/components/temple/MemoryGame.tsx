import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, ArrowLeft, Brain } from 'lucide-react';

interface MemoryGameProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'memorize' | 'recall' | 'result';

const t = {
  en: {
    title: 'Memory',
    subtitle: 'Memorize the pattern and reproduce it',
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    memorize: 'Memorize the pattern!',
    recall: 'Tap the highlighted cells!',
    win: 'You remember well!',
    lose: 'Wrong pattern...',
    bonus: 'Bonus',
    play: 'Play',
    back: 'Back',
    next: 'Next',
    ready: 'Ready!',
    remaining: 'remaining',
  },
  ru: {
    title: 'Память',
    subtitle: 'Запомни узор и воспроизведи',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    memorize: 'Запомни узор!',
    recall: 'Нажми на подсвеченные клетки!',
    win: 'Отличная память!',
    lose: 'Неверный узор...',
    bonus: 'Бонус',
    play: 'Играть',
    back: 'Назад',
    next: 'Далее',
    ready: 'Готово!',
    remaining: 'осталось',
  },
};

function generatePattern(gridSize: number, count: number): Set<number> {
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * (gridSize * gridSize)));
  }
  return indices;
}

export function MemoryGame({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: MemoryGameProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [playerPicks, setPlayerPicks] = useState<Set<number>>(new Set());
  const [won, setWon] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [targetCount, setTargetCount] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const BONUS = 0.08;

  const startGame = useCallback((crystal: Crystal) => {
    supabase.rpc('increment_game_play', { p_game_id: 'memory' });
    setSelectedCrystal(crystal);
    // Scale difficulty with rarity: 3x3 with 3 cells → 5x5 with 8 cells
    const size = Math.min(3 + Math.floor(crystal.rarity / 3), 5);
    const count = Math.min(3 + Math.floor(crystal.rarity / 2), Math.floor(size * size * 0.35));
    setGridSize(size);
    setTargetCount(count);
    const pat = generatePattern(size, count);
    setPattern(pat);
    setPlayerPicks(new Set());
    setPhase('memorize');

    // Show pattern for a duration that scales inversely with rarity
    const showTime = Math.max(1500, 4000 - crystal.rarity * 250);
    timerRef.current = setTimeout(() => {
      setPhase('recall');
    }, showTime);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleCellClick = useCallback((idx: number) => {
    if (phase !== 'recall') return;
    setPlayerPicks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, [phase]);

  const handleSubmit = async () => {
    if (!selectedCrystal) return;
    // Check if picks match pattern exactly
    const correct = pattern.size === playerPicks.size &&
      [...pattern].every(i => playerPicks.has(i));

    setWon(correct);
    setPhase('result');

    if (correct) {
      const bonus = Math.floor(selectedCrystal.price * BONUS);
      await onEarnCoins(bonus);
    } else {
      await onConsumeCrystal(selectedCrystal.id);
    }
  };

  // SELECT phase
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5" />{l.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{l.subtitle}</p>
        {crystals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{l.noCrystals}</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {crystals.map(c => (
              <button
                key={c.id}
                onClick={() => startGame(c)}
                className="p-2 rounded-lg border-2 border-border hover:border-primary/50 transition-all hover:scale-105 text-center"
              >
                <div className="w-10 h-10 rounded-lg mx-auto mb-1" style={{ backgroundColor: c.color }} />
                <p className="text-[10px]" style={{ color: getRarityColor(c.rarity) }}>{getRarityName(c.rarity, language)}</p>
                <p className="text-[10px] text-muted-foreground">💰{c.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // MEMORIZE + RECALL phases
  if (phase === 'memorize' || phase === 'recall') {
    const remaining = targetCount - playerPicks.size;
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Brain className="w-5 h-5" />{l.title}</h2>
          {selectedCrystal && (
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedCrystal.color }} />
              💰{selectedCrystal.price.toLocaleString()}
            </Badge>
          )}
        </div>

        <p className="text-center text-sm font-semibold mb-4">
          {phase === 'memorize' ? l.memorize : `${l.recall} (${remaining} ${l.remaining})`}
        </p>

        <div
          className="grid gap-2 mx-auto mb-4"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            maxWidth: `${gridSize * 60}px`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, idx) => {
            const isTarget = pattern.has(idx);
            const isPicked = playerPicks.has(idx);
            const showHighlight = phase === 'memorize' && isTarget;

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={phase === 'memorize'}
                className={`aspect-square rounded-lg border-2 transition-all ${
                  showHighlight
                    ? 'border-primary bg-primary/30 scale-105'
                    : isPicked
                      ? 'border-primary bg-primary/20'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                } ${phase === 'recall' ? 'cursor-pointer active:scale-95' : ''}`}
                style={showHighlight && selectedCrystal ? { backgroundColor: selectedCrystal.color + '66' } : undefined}
              />
            );
          })}
        </div>

        {phase === 'recall' && (
          <Button onClick={handleSubmit} className="w-full" disabled={playerPicks.size !== targetCount}>
            {l.ready}
          </Button>
        )}
      </Card>
    );
  }

  // RESULT
  return (
    <Card className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">{won ? '🎉' : '💔'} {won ? l.win : l.lose}</h2>
      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * BONUS).toLocaleString()} ({l.bonus} +{Math.round(BONUS * 100)}%)
        </p>
      )}

      <div
        className="grid gap-2 mx-auto mb-6"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: `${gridSize * 50}px`,
        }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, idx) => {
          const isTarget = pattern.has(idx);
          const isPicked = playerPicks.has(idx);
          const correct = isTarget && isPicked;
          const missed = isTarget && !isPicked;
          const wrong = !isTarget && isPicked;

          return (
            <div
              key={idx}
              className={`aspect-square rounded-lg border-2 ${
                correct ? 'border-green-500 bg-green-500/30' :
                missed ? 'border-yellow-500 bg-yellow-500/30' :
                wrong ? 'border-red-500 bg-red-500/30' :
                'border-border bg-muted/20'
              }`}
            />
          );
        })}
      </div>

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); }} className="w-full">
        {l.next}
      </Button>
    </Card>
  );
}
