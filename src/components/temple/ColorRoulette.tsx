import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { ArrowLeft, Palette } from 'lucide-react';

interface ColorRouletteProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'spinning' | 'result';

const t = {
  en: {
    title: 'Color Roulette',
    subtitle: 'Stop the wheel near your crystal\'s color for max bonus',
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    stop: 'STOP!',
    spinning: 'Spinning...',
    accuracy: 'Color accuracy',
    bonus: 'Bonus',
    win: 'Great match!',
    lose: 'Too far off...',
    next: 'Next',
    back: 'Back',
  },
  ru: {
    title: 'Рулетка цветов',
    subtitle: 'Останови колесо рядом с цветом кристалла',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    stop: 'СТОП!',
    spinning: 'Крутится...',
    accuracy: 'Точность цвета',
    bonus: 'Бонус',
    win: 'Отличное попадание!',
    lose: 'Слишком далеко...',
    next: 'Далее',
    back: 'Назад',
  },
};

const SEGMENT_COUNT = 24;

function generateWheel(): string[] {
  return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const hue = (i * 360) / SEGMENT_COUNT;
    return `hsl(${hue}, 80%, 55%)`;
  });
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const MAX_DIST = Math.sqrt(255 ** 2 * 3); // ~441

export function ColorRoulette({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: ColorRouletteProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [wheel] = useState(generateWheel);
  const [angle, setAngle] = useState(0);
  const [stoppedIndex, setStoppedIndex] = useState(-1);
  const [accuracy, setAccuracy] = useState(0);
  const [won, setWon] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const animRef = useRef<number>();
  const speedRef = useRef(0);
  const angleRef = useRef(0);

  const startSpin = useCallback((crystal: Crystal) => {
    supabase.rpc('increment_game_play', { p_game_id: 'roulette' });
    setSelectedCrystal(crystal);
    setPhase('spinning');
    setStoppedIndex(-1);
    speedRef.current = 8 + Math.random() * 4; // degrees per frame
    angleRef.current = Math.random() * 360;
    setAngle(angleRef.current);

    const animate = () => {
      angleRef.current = (angleRef.current + speedRef.current) % 360;
      // Slow down very gradually
      speedRef.current *= 0.998;
      setAngle(angleRef.current);
      if (speedRef.current > 0.3) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handleStop = async () => {
    if (!selectedCrystal || phase !== 'spinning') return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Determine which segment the pointer is on
    const segAngle = 360 / SEGMENT_COUNT;
    const idx = Math.floor(((360 - angleRef.current % 360) % 360) / segAngle) % SEGMENT_COUNT;
    setStoppedIndex(idx);

    // Calculate color distance
    const hue = (idx * 360) / SEGMENT_COUNT;
    const [wr, wg, wb] = hslToRgb(hue, 80, 55);
    const dist = colorDistance(selectedCrystal.red, selectedCrystal.green, selectedCrystal.blue, wr, wg, wb);
    const acc = Math.max(0, 1 - dist / MAX_DIST);
    setAccuracy(acc);

    // Win threshold: 30% accuracy
    const isWin = acc >= 0.30;
    setWon(isWin);

    // Bonus scales with accuracy: 0% at threshold, up to 60% at perfect match
    const bonus = isWin ? Math.round(acc * 60) : 0;
    setBonusPercent(bonus);

    setPhase('result');

    if (isWin) {
      const bonusCoins = Math.floor(selectedCrystal.price * (bonus / 100));
      await onEarnCoins(bonusCoins);
    } else {
      await onConsumeCrystal(selectedCrystal.id);
    }
  };

  // SELECT
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><Palette className="w-5 h-5" />{l.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{l.subtitle}</p>
        {crystals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{l.noCrystals}</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {crystals.map(c => (
              <button
                key={c.id}
                onClick={() => startSpin(c)}
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

  // SPINNING + RESULT
  const segAngle = 360 / SEGMENT_COUNT;

  return (
    <Card className="p-6 text-center">
      <h2 className="text-xl font-bold flex items-center justify-center gap-2 mb-2">
        <Palette className="w-5 h-5" />{l.title}
      </h2>

      {selectedCrystal && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm">{language === 'ru' ? 'Твой цвет:' : 'Your color:'}</span>
          <div className="w-8 h-8 rounded-lg border-2 border-border" style={{ backgroundColor: selectedCrystal.color }} />
        </div>
      )}

      {/* Wheel */}
      <div className="relative mx-auto mb-4" style={{ width: 240, height: 240 }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">▼</div>

        <svg
          width="240" height="240"
          viewBox="0 0 240 240"
          style={{ transform: `rotate(${angle}deg)`, transition: phase === 'result' ? 'none' : undefined }}
        >
          {wheel.map((color, i) => {
            const startAngle = (i * segAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segAngle * Math.PI) / 180;
            const r = 110;
            const cx = 120, cy = 120;
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);

            return (
              <path
                key={i}
                d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={color}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity={phase === 'result' && stoppedIndex === i ? 1 : phase === 'result' ? 0.4 : 1}
              />
            );
          })}
          <circle cx="120" cy="120" r="25" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        </svg>
      </div>

      {phase === 'spinning' && (
        <Button onClick={handleStop} className="w-full text-lg py-6" variant="destructive">
          {l.stop}
        </Button>
      )}

      {phase === 'result' && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-2xl font-bold">{won ? '🎉' : '💔'} {won ? l.win : l.lose}</h3>
          <p className="text-sm">{l.accuracy}: <span className="font-bold">{Math.round(accuracy * 100)}%</span></p>
          {won && selectedCrystal && (
            <p className="text-lg">
              +💰{Math.floor(selectedCrystal.price * (bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
            </p>
          )}
          <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); }} className="w-full">
            {l.next}
          </Button>
        </div>
      )}
    </Card>
  );
}
