import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { ArrowLeft, Zap } from 'lucide-react';

interface QuickDrawProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'waiting' | 'go' | 'result';

const t = {
  en: {
    title: 'Quick Draw',
    subtitle: 'Wait for the signal, then tap as fast as you can!',
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    wait: 'Wait for green...',
    go: 'TAP NOW!',
    falsestart: 'False start! Crystal lost.',
    reaction: 'Reaction time',
    ms: 'ms',
    bonus: 'Bonus',
    win: 'Lightning reflexes!',
    lose: 'Too slow...',
    next: 'Next',
    back: 'Back',
  },
  ru: {
    title: 'Реакция',
    subtitle: 'Дождись сигнала и нажми как можно быстрее!',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    wait: 'Жди зелёный...',
    go: 'ЖМИ!',
    falsestart: 'Фальстарт! Кристалл потерян.',
    reaction: 'Время реакции',
    ms: 'мс',
    bonus: 'Бонус',
    win: 'Молниеносно!',
    lose: 'Слишком медленно...',
    next: 'Далее',
    back: 'Назад',
  },
};

export function QuickDraw({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: QuickDrawProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [reactionTime, setReactionTime] = useState(0);
  const [won, setWon] = useState(false);
  const [falseStart, setFalseStart] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const goTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const startGame = useCallback((crystal: Crystal) => {
    supabase.rpc('increment_game_play', { p_game_id: 'quickdraw' });
    setSelectedCrystal(crystal);
    setFalseStart(false);
    setPhase('waiting');

    // Random delay between 1.5s and 5s
    const delay = 1500 + Math.random() * 3500;
    timerRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setPhase('go');

      // Auto-fail after 2 seconds
      timerRef.current = setTimeout(async () => {
        setPhase('result');
        setWon(false);
        setReactionTime(2000);
        setBonusPercent(0);
        await onConsumeCrystal(crystal.id);
      }, 2000);
    }, delay);
  }, [onConsumeCrystal]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleTap = async () => {
    if (!selectedCrystal) return;

    if (phase === 'waiting') {
      // False start
      if (timerRef.current) clearTimeout(timerRef.current);
      setFalseStart(true);
      setWon(false);
      setPhase('result');
      await onConsumeCrystal(selectedCrystal.id);
      return;
    }

    if (phase === 'go') {
      if (timerRef.current) clearTimeout(timerRef.current);
      const rt = Date.now() - goTimeRef.current;
      setReactionTime(rt);

      // Win if under 800ms
      const isWin = rt < 800;
      setWon(isWin);

      // Bonus: 50% at 100ms, scaling down to 10% at 800ms
      const bonus = isWin ? Math.max(10, Math.round(50 - (rt / 800) * 40)) : 0;
      setBonusPercent(bonus);

      setPhase('result');

      if (isWin) {
        const bonusCoins = Math.floor(selectedCrystal.price * (bonus / 100));
        await onEarnCoins(bonusCoins);
      } else {
        await onConsumeCrystal(selectedCrystal.id);
      }
    }
  };

  // SELECT
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5" />{l.title}</h2>
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

  // WAITING / GO
  if (phase === 'waiting' || phase === 'go') {
    return (
      <Card className="p-0 overflow-hidden">
        <button
          onClick={handleTap}
          className={`w-full min-h-[400px] flex flex-col items-center justify-center gap-4 transition-colors duration-200 cursor-pointer active:opacity-80 ${
            phase === 'waiting'
              ? 'bg-destructive/80'
              : 'bg-green-500'
          }`}
        >
          <Zap className="w-16 h-16 text-white" />
          <p className="text-3xl font-black text-white">
            {phase === 'waiting' ? l.wait : l.go}
          </p>
          {selectedCrystal && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-white/50" style={{ backgroundColor: selectedCrystal.color }} />
              <span className="text-white/80 text-sm">💰{selectedCrystal.price.toLocaleString()}</span>
            </div>
          )}
        </button>
      </Card>
    );
  }

  // RESULT
  return (
    <Card className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">
        {falseStart ? '⚡💔' : won ? '⚡🎉' : '⚡💔'}{' '}
        {falseStart ? l.falsestart : won ? l.win : l.lose}
      </h2>

      {!falseStart && (
        <p className="text-lg mb-2">
          {l.reaction}: <span className="font-bold">{reactionTime}{l.ms}</span>
        </p>
      )}

      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * (bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
        </p>
      )}

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); }} className="w-full mt-4">
        {l.next}
      </Button>
    </Card>
  );
}
