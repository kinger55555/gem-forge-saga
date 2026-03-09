import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { ArrowLeft, Gauge } from 'lucide-react';

interface PressureHoldProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'ready' | 'holding' | 'result';

const t = {
  en: {
    title: 'Pressure Hold',
    subtitle: 'Hold the button — release before the bar explodes!',
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    holdToStart: 'HOLD TO START',
    holding: 'RELEASE!',
    exploded: 'BOOM! Bar exploded.',
    released: 'Released!',
    bonus: 'Bonus',
    next: 'Next',
    fill: 'Fill',
  },
  ru: {
    title: 'Давление',
    subtitle: 'Держи кнопку — отпусти до взрыва шкалы!',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    holdToStart: 'ЗАЖМИ',
    holding: 'ОТПУСКАЙ!',
    exploded: 'БУМ! Шкала взорвалась.',
    released: 'Отпущено!',
    bonus: 'Бонус',
    next: 'Далее',
    fill: 'Заполнение',
  },
};

export function PressureHold({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: PressureHoldProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [fillPercent, setFillPercent] = useState(0);
  const [won, setWon] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const animRef = useRef<number>();
  const startRef = useRef(0);
  const speedRef = useRef(1);

  const selectCrystal = useCallback((crystal: Crystal) => {
    supabase.rpc('increment_game_play', { p_game_id: 'pressure' });
    setSelectedCrystal(crystal);
    setFillPercent(0);
    // Higher rarity = faster fill = harder
    // Random duration between 50-150ms
    speedRef.current = 2000 / (50 + Math.random() * 100);
    setPhase('ready');
  }, []);

  const handlePointerDown = () => {
    if (phase !== 'ready') return;
    setPhase('holding');
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      // Fills to 100% in ~2s base, faster with rarity
      const pct = Math.min((elapsed * speedRef.current) / 2000 * 100, 100);
      setFillPercent(pct);

      if (pct >= 100) {
        // Exploded!
        finishGame(100);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const handlePointerUp = () => {
    if (phase !== 'holding') return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    finishGame(fillPercent);
  };

  const finishGame = async (pct: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (!selectedCrystal) return;

    const exploded = pct >= 100;
    const isWin = !exploded && pct >= 10; // Must hold at least a bit
    setWon(isWin);

    // Bonus scales with how close to 100% without exploding
    // 90-99% = 50% bonus, 70-89% = 30%, 50-69% = 20%, <50% = 10%
    let bonus = 0;
    if (isWin) {
      if (pct >= 90) bonus = 50;
      else if (pct >= 70) bonus = 30;
      else if (pct >= 50) bonus = 20;
      else bonus = 10;
    }
    setBonusPercent(bonus);
    setPhase('result');

    if (isWin) {
      const bonusCoins = Math.floor(selectedCrystal.price * (bonus / 100));
      await onEarnCoins(bonusCoins);
    } else {
      await onConsumeCrystal(selectedCrystal.id);
    }
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // SELECT
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><Gauge className="w-5 h-5" />{l.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{l.subtitle}</p>
        {crystals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{l.noCrystals}</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {crystals.map(c => (
              <button
                key={c.id}
                onClick={() => selectCrystal(c)}
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

  // READY / HOLDING
  if (phase === 'ready' || phase === 'holding') {
    const dangerZone = fillPercent >= 80;
    const barColor = fillPercent >= 90
      ? 'bg-red-500'
      : fillPercent >= 70
        ? 'bg-yellow-500'
        : 'bg-green-500';

    return (
      <Card className="p-0 overflow-hidden select-none">
        <div className="min-h-[420px] flex flex-col items-center justify-center gap-6 p-6">
          {/* Bar */}
          <div className="relative w-16 h-64 rounded-xl border-2 border-border bg-muted/30 overflow-hidden">
            {/* Danger zone marker */}
            <div className="absolute top-0 left-0 w-full h-[10%] bg-red-500/20 border-b border-red-500/40" />

            {/* Fill */}
            <div
              className={`absolute bottom-0 left-0 w-full transition-none rounded-b-lg ${barColor} ${dangerZone ? 'animate-pulse' : ''}`}
              style={{ height: `${fillPercent}%` }}
            />

            {/* Percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-foreground drop-shadow-md">
                {Math.round(fillPercent)}%
              </span>
            </div>
          </div>

          {/* Hold button */}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={phase === 'holding' ? handlePointerUp : undefined}
            className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all select-none ${
              phase === 'holding'
                ? 'border-destructive bg-destructive/20 scale-95'
                : 'border-primary bg-primary/10 hover:bg-primary/20'
            }`}
          >
            <span className="text-xl font-black text-center">
              {phase === 'holding' ? l.holding : l.holdToStart}
            </span>
          </button>

          {selectedCrystal && (
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedCrystal.color }} />
              💰{selectedCrystal.price.toLocaleString()}
            </Badge>
          )}
        </div>
      </Card>
    );
  }

  // RESULT
  const exploded = fillPercent >= 100;
  return (
    <Card className="p-6 text-center animate-scale-in">
      <h2 className="text-3xl font-bold mb-2">
        {exploded ? '💥' : won ? '✅' : '😬'}{' '}
        {exploded ? l.exploded : l.released}
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        {l.fill}: {Math.round(fillPercent)}%
      </p>

      {/* Visual bar replay */}
      <div className="relative w-12 h-40 rounded-xl border-2 border-border bg-muted/30 overflow-hidden mx-auto mb-4">
        <div className="absolute top-0 left-0 w-full h-[10%] bg-red-500/20 border-b border-red-500/40" />
        <div
          className={`absolute bottom-0 left-0 w-full rounded-b-lg ${exploded ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ height: `${Math.min(fillPercent, 100)}%` }}
        />
      </div>

      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * (bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
        </p>
      )}

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); setFillPercent(0); }} className="w-full mt-2">
        {l.next}
      </Button>
    </Card>
  );
}
