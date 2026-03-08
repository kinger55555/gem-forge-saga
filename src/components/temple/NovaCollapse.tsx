import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { ArrowLeft, Eclipse } from 'lucide-react';

interface NovaCollapseProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'playing' | 'result';

const t = {
  en: {
    title: 'Nova Collapse',
    subtitle: 'Hit the button when the ring aligns perfectly',
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    tap: 'TAP!',
    perfect: 'PERFECT!',
    great: 'Great!',
    good: 'Good',
    miss: 'Missed...',
    bonus: 'Bonus',
    next: 'Next',
    accuracy: 'Accuracy',
  },
  ru: {
    title: 'Коллапс Новы',
    subtitle: 'Нажми, когда кольцо совпадёт с кругом',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    tap: 'ЖМИ!',
    perfect: 'ИДЕАЛЬНО!',
    great: 'Отлично!',
    good: 'Неплохо',
    miss: 'Мимо...',
    bonus: 'Бонус',
    next: 'Далее',
    accuracy: 'Точность',
  },
};

// Ring shrinks from scale 3.0 → 1.0 over ~2 seconds, then overshoots to 0.5
const RING_DURATION = 2000; // ms for full collapse
const PERFECT_ZONE = 0.05; // ±5% from 1.0
const GREAT_ZONE = 0.12;
const GOOD_ZONE = 0.22;

export function NovaCollapse({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: NovaCollapseProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [ringScale, setRingScale] = useState(3);
  const [resultScale, setResultScale] = useState(1);
  const [won, setWon] = useState(false);
  const [grade, setGrade] = useState<'perfect' | 'great' | 'good' | 'miss'>('miss');
  const [bonusPercent, setBonusPercent] = useState(0);
  const animRef = useRef<number>();
  const startTimeRef = useRef(0);
  const speedMultiplier = useRef(1);

  const startGame = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setPhase('playing');
    // Higher rarity = faster ring (harder)
    speedMultiplier.current = 1 + crystal.rarity * 0.12;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) * speedMultiplier.current;
      // Ring goes from 3.0 → 0.4 over RING_DURATION
      const progress = Math.min(elapsed / RING_DURATION, 1);
      const scale = 3.0 - progress * 2.6; // 3.0 → 0.4
      setRingScale(scale);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Auto-miss if ring fully collapsed
        handleResult(0.4, crystal);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handleResult = async (scale: number, crystal: Crystal) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setResultScale(scale);

    const diff = Math.abs(scale - 1.0);
    let g: 'perfect' | 'great' | 'good' | 'miss';
    let bonus: number;

    if (diff <= PERFECT_ZONE) {
      g = 'perfect'; bonus = 55;
    } else if (diff <= GREAT_ZONE) {
      g = 'great'; bonus = 35;
    } else if (diff <= GOOD_ZONE) {
      g = 'good'; bonus = 15;
    } else {
      g = 'miss'; bonus = 0;
    }

    setGrade(g);
    setBonusPercent(bonus);
    setWon(g !== 'miss');
    setPhase('result');

    if (g !== 'miss') {
      const bonusCoins = Math.floor(crystal.price * (bonus / 100));
      await onEarnCoins(bonusCoins);
    } else {
      await onConsumeCrystal(crystal.id);
    }
  };

  const handleTap = () => {
    if (phase !== 'playing' || !selectedCrystal) return;
    handleResult(ringScale, selectedCrystal);
  };

  // SELECT
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><Eclipse className="w-5 h-5" />{l.title}</h2>
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

  // PLAYING
  if (phase === 'playing') {
    const innerRadius = 50;
    const outerRadius = innerRadius * ringScale;
    const crystalColor = selectedCrystal?.color || 'hsl(var(--primary))';

    return (
      <Card className="p-0 overflow-hidden">
        <button
          onClick={handleTap}
          className="w-full min-h-[420px] flex flex-col items-center justify-center gap-6 bg-background cursor-pointer active:bg-muted/30 transition-colors"
        >
          {/* Ring area */}
          <div className="relative" style={{ width: 300, height: 300 }}>
            {/* Inner target circle */}
            <div
              className="absolute rounded-full border-4"
              style={{
                width: innerRadius * 2,
                height: innerRadius * 2,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                borderColor: crystalColor,
                backgroundColor: crystalColor + '15',
                boxShadow: `0 0 30px ${crystalColor}40, inset 0 0 20px ${crystalColor}20`,
              }}
            />

            {/* Shrinking outer ring */}
            <div
              className="absolute rounded-full border-[3px] transition-none"
              style={{
                width: outerRadius * 2,
                height: outerRadius * 2,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                borderColor: ringScale <= 1.0 + GOOD_ZONE && ringScale >= 1.0 - GOOD_ZONE
                  ? ringScale <= 1.0 + PERFECT_ZONE && ringScale >= 1.0 - PERFECT_ZONE
                    ? '#22c55e'
                    : '#eab308'
                  : crystalColor + '80',
                boxShadow: ringScale <= 1.0 + GOOD_ZONE && ringScale >= 1.0 - GOOD_ZONE
                  ? `0 0 20px ${ringScale <= 1.0 + PERFECT_ZONE ? '#22c55e' : '#eab308'}40`
                  : 'none',
              }}
            />
          </div>

          <p className="text-2xl font-black text-primary animate-pulse">{l.tap}</p>

          {selectedCrystal && (
            <Badge variant="outline" className="gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedCrystal.color }} />
              💰{selectedCrystal.price.toLocaleString()}
            </Badge>
          )}
        </button>
      </Card>
    );
  }

  // RESULT
  const gradeEmoji = { perfect: '💎✨', great: '🌟', good: '👍', miss: '💔' };
  const gradeLabel = { perfect: l.perfect, great: l.great, good: l.good, miss: l.miss };
  const gradeColor = { perfect: 'text-green-400', great: 'text-yellow-400', good: 'text-blue-400', miss: 'text-destructive' };

  return (
    <Card className="p-6 text-center animate-scale-in">
      <div className="mb-6">
        <p className="text-4xl mb-2">{gradeEmoji[grade]}</p>
        <h2 className={`text-3xl font-black ${gradeColor[grade]}`}>{gradeLabel[grade]}</h2>
      </div>

      {/* Visual replay */}
      <div className="relative mx-auto mb-6" style={{ width: 160, height: 160 }}>
        <div
          className="absolute rounded-full border-4"
          style={{
            width: 80, height: 80,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: selectedCrystal?.color || 'hsl(var(--primary))',
            backgroundColor: (selectedCrystal?.color || '') + '15',
          }}
        />
        <div
          className="absolute rounded-full border-[3px]"
          style={{
            width: 80 * resultScale, height: 80 * resultScale,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: won ? '#22c55e' : 'hsl(var(--destructive))',
            opacity: 0.7,
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-2">
        {l.accuracy}: {Math.max(0, Math.round((1 - Math.abs(resultScale - 1)) * 100))}%
      </p>

      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * (1 + bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
        </p>
      )}

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); }} className="w-full mt-2">
        {l.next}
      </Button>
    </Card>
  );
}
