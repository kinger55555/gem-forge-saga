import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, ArrowLeft, Trophy, X, Brain } from 'lucide-react';

interface SingularityProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'Timing Tap',
    subtitle: 'Tap at the perfect moment — not too early, not too late',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to play',
    back: 'Back',
    worth: 'Worth',
    bonus: 'Bonus',
    playAgain: 'Try another crystal',
    round: 'Round',
    tap: 'TAP!',
    won: 'Perfect timing!',
    lost: 'Missed the mark...',
    tooEarly: 'Too early!',
    tooLate: 'Too late!',
    getReady: 'Get ready...',
  },
  ru: {
    title: 'Тайминг',
    subtitle: 'Жми в нужный момент — не рано и не поздно',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы играть',
    back: 'Назад',
    worth: 'Стоимость',
    bonus: 'Бонус',
    playAgain: 'Попробовать другой кристалл',
    round: 'Раунд',
    tap: 'ЖМИИ!',
    won: 'Идеальный тайминг!',
    lost: 'Мимо...',
    tooEarly: 'Слишком рано!',
    tooLate: 'Слишком поздно!',
    getReady: 'Приготовься...',
  },
};

type Phase = 'select' | 'playing' | 'result';

function getRounds(rarity: number): number {
  if (rarity <= 2) return 5;
  if (rarity <= 4) return 6;
  if (rarity <= 6) return 7;
  return 8;
}

function getZoneWidth(rarity: number, round: number): number {
  const base = rarity <= 2 ? 25 : rarity <= 5 ? 20 : 15;
  return Math.max(8, base - round * 1.5);
}

function getBarSpeed(rarity: number, round: number): number {
  const base = rarity <= 2 ? 2200 : rarity <= 5 ? 1800 : 1400;
  return Math.max(600, base - round * 120);
}

export function Singularity({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: SingularityProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [barPosition, setBarPosition] = useState(0);
  const [zoneStart, setZoneStart] = useState(30);
  const [zoneWidth, setZoneWidth] = useState(20);
  const [won, setWon] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [missText, setMissText] = useState('');
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const speedRef = useRef(2000);
  const t = translations[language];

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const startRound = useCallback((crystal: Crystal, round: number) => {
    setIsTransitioning(true);
    setCurrentRound(round);
    const zw = getZoneWidth(crystal.rarity, round);
    const zs = 10 + Math.random() * (80 - zw);
    setZoneStart(zs);
    setZoneWidth(zw);
    setBarPosition(0);

    const speed = getBarSpeed(crystal.rarity, round);
    speedRef.current = speed;

    setTimeout(() => {
      setIsTransitioning(false);
      startTimeRef.current = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min((elapsed / speed) * 100, 100);
        setBarPosition(progress);
        if (progress < 100) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          // Ran out — too late
          animRef.current = null;
        }
      };
      animRef.current = requestAnimationFrame(animate);
    }, 800);
  }, []);

  const startGame = (crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setWon(false);
    setMissText('');
    const rounds = getRounds(crystal.rarity);
    setTotalRounds(rounds);
    setPhase('playing');
    startRound(crystal, 0);
  };

  const handleTap = useCallback(async () => {
    if (phase !== 'playing' || isTransitioning || !selectedCrystal) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;

    const inZone = barPosition >= zoneStart && barPosition <= zoneStart + zoneWidth;

    if (!inZone) {
      setMissText(barPosition < zoneStart ? t.tooEarly : t.tooLate);
      setWon(false);
      setPhase('result');
      await onConsumeCrystal(selectedCrystal.id);
      return;
    }

    const nextRound = currentRound + 1;
    if (nextRound >= totalRounds) {
      setWon(true);
      setPhase('result');
      const bonus = Math.floor(selectedCrystal.price * 0.7);
      await onEarnCoins(bonus);
    } else {
      startRound(selectedCrystal, nextRound);
    }
  }, [phase, isTransitioning, barPosition, zoneStart, zoneWidth, currentRound, totalRounds, selectedCrystal, onEarnCoins, onConsumeCrystal, startRound, t]);

  const resetGame = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPhase('select');
    setSelectedCrystal(null);
    setBarPosition(0);
  };

  // === RENDERS ===

  if (crystals.length === 0 && phase === 'select') {
    return (
      <Card className="p-8 text-center">
        <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">{t.title}</h2>
        <p className="text-muted-foreground mb-4">{t.noCrystals}</p>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Button>
      </Card>
    );
  }

  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-4">{t.selectCrystal}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
          {crystals.map(crystal => {
            const rarityColor = getRarityColor(crystal.rarity);
            const bonus = Math.floor(crystal.price * 0.7);
            const rounds = getRounds(crystal.rarity);
            return (
              <button
                key={crystal.id}
                onClick={() => startGame(crystal)}
                className="p-3 rounded-lg border-2 bg-card hover:bg-muted/50 transition-all hover:scale-105 flex flex-col items-center gap-2"
                style={{ borderColor: rarityColor }}
              >
                <div className="w-10 h-10 rounded-md border border-foreground/10" style={{ backgroundColor: crystal.color }} />
                <span className="text-xs font-medium" style={{ color: rarityColor }}>
                  {getRarityName(crystal.rarity, language)}
                </span>
                <span className="text-[10px] text-muted-foreground">{rounds} {t.round.toLowerCase()}s</span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Coins className="w-3 h-3" />+{bonus.toLocaleString()}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  if (!selectedCrystal) return null;

  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const bonus = Math.floor(selectedCrystal.price * 0.7);

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-1">{t.title}</h2>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-6 h-6 rounded border border-foreground/10" style={{ backgroundColor: selectedCrystal.color }} />
          <span className="text-sm" style={{ color: rarityColor }}>{getRarityName(selectedCrystal.rarity, language)}</span>
          <Badge variant="outline" className="text-xs gap-1">
            <Coins className="w-3 h-3" />{t.bonus}: +{bonus.toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Round indicator */}
      {phase === 'playing' && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentRound ? 'bg-primary' :
                  i === currentRound ? 'bg-primary animate-pulse' :
                  'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm font-medium text-muted-foreground">
            {isTransitioning ? t.getReady : `${t.round} ${currentRound + 1}/${totalRounds}`}
          </p>
        </div>
      )}

      {/* Timing bar */}
      {phase === 'playing' && !isTransitioning && (
        <div className="mb-8">
          <div
            className="relative w-full h-16 rounded-xl border-2 border-border overflow-hidden cursor-pointer select-none bg-muted"
            onClick={handleTap}
          >
            {/* Sweet zone */}
            <div
              className="absolute top-0 h-full rounded"
              style={{
                left: `${zoneStart}%`,
                width: `${zoneWidth}%`,
                backgroundColor: 'hsl(142 76% 36% / 0.3)',
                borderLeft: '2px solid hsl(142 76% 36% / 0.6)',
                borderRight: '2px solid hsl(142 76% 36% / 0.6)',
              }}
            />

            {/* Moving indicator (fills from left) */}
            <div
              className="absolute top-0 left-0 h-full bg-primary/30 transition-none"
              style={{ width: `${barPosition}%` }}
            />

            {/* Needle */}
            <div
              className="absolute top-0 h-full w-1 rounded-full bg-primary transition-none"
              style={{
                left: `${barPosition}%`,
                boxShadow: '0 0 10px hsl(var(--primary) / 0.5)',
              }}
            />

            {/* Tap text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-foreground/30">{t.tap}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transition */}
      {phase === 'playing' && isTransitioning && (
        <div className="py-16 text-center animate-pulse">
          <p className="text-lg font-bold text-foreground">{t.round} {currentRound + 1}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.getReady}</p>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="text-center space-y-4 animate-fade-in py-8">
          <div className={`text-6xl ${won ? '' : 'grayscale opacity-50'}`}>
            {won ? '✨' : '💀'}
          </div>
          <div className={`flex items-center justify-center gap-2 ${won ? 'text-primary' : 'text-destructive'}`}>
            {won ? <Trophy className="w-6 h-6" /> : <X className="w-6 h-6" />}
            <span className="text-lg font-bold">{won ? t.won : t.lost}</span>
          </div>
          {!won && missText && (
            <p className="text-sm text-destructive/80">{missText}</p>
          )}
          {won && (
            <p className="text-sm text-muted-foreground">
              +{bonus.toLocaleString()} <Coins className="w-3 h-3 inline" />
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t.round} {currentRound + 1}/{totalRounds}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={resetGame} variant="outline">{t.playAgain}</Button>
            <Button onClick={onBack} variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" /> {t.back}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
