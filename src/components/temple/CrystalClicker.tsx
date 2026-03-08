import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, Zap, ArrowLeft, Timer } from 'lucide-react';

interface CrystalClickerProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'Crystal Clicker',
    subtitle: 'Tap as fast as you can to charge the crystal!',
    selectCrystal: 'Select a crystal to charge',
    noCrystals: 'You need crystals to play',
    back: 'Back',
    worth: 'Worth',
    target: 'Target taps',
    timeLimit: 'Time',
    seconds: 's',
    ready: 'TAP TO START!',
    tapping: 'TAP! TAP! TAP!',
    won: 'Crystal charged! Bonus earned!',
    lost: 'Too slow... Crystal shattered!',
    taps: 'taps',
    playAgain: 'Try another crystal',
    bonus: 'Bonus',
  },
  ru: {
    title: 'Кликер кристаллов',
    subtitle: 'Нажимай как можно быстрее чтобы зарядить кристалл!',
    selectCrystal: 'Выбери кристалл для зарядки',
    noCrystals: 'Тебе нужны кристаллы чтобы играть',
    back: 'Назад',
    worth: 'Стоимость',
    target: 'Цель нажатий',
    timeLimit: 'Время',
    seconds: 'с',
    ready: 'НАЖМИ ЧТОБЫ НАЧАТЬ!',
    tapping: 'ЖМИИ! ЖМИИ! ЖМИИ!',
    won: 'Кристалл заряжен! Бонус получен!',
    lost: 'Слишком медленно... Кристалл разбился!',
    taps: 'нажатий',
    playAgain: 'Попробовать другой кристалл',
    bonus: 'Бонус',
  },
};

function getDifficulty(rarity: number) {
  if (rarity <= 1) return { targetTaps: 15, timeSeconds: 5 };
  if (rarity <= 3) return { targetTaps: 25, timeSeconds: 5 };
  if (rarity <= 5) return { targetTaps: 35, timeSeconds: 5 };
  if (rarity <= 7) return { targetTaps: 50, timeSeconds: 5 };
  return { targetTaps: 65, timeSeconds: 5 };
}

type Phase = 'select' | 'ready' | 'tapping' | 'result';

export function CrystalClicker({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: CrystalClickerProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [won, setWon] = useState(false);
  const [targetTaps, setTargetTaps] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const tapsRef = useRef(0);
  const t = translations[language];

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const selectCrystal = (crystal: Crystal) => {
    setSelectedCrystal(crystal);
    const diff = getDifficulty(crystal.rarity);
    setTargetTaps(diff.targetTaps);
    setTimeLeft(diff.timeSeconds);
    setTaps(0);
    tapsRef.current = 0;
    setPhase('ready');
  };

  const startTapping = () => {
    if (phase !== 'ready' || !selectedCrystal) return;
    const diff = getDifficulty(selectedCrystal.rarity);
    setPhase('tapping');
    startTimeRef.current = Date.now();
    setTaps(1);
    tapsRef.current = 1;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, diff.timeSeconds - elapsed);
      setTimeLeft(Math.ceil(remaining * 10) / 10);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        finishGame(tapsRef.current, diff.targetTaps);
      }
    }, 50);
  };

  const handleTap = () => {
    if (phase === 'ready') {
      startTapping();
      return;
    }
    if (phase !== 'tapping') return;
    tapsRef.current += 1;
    setTaps(tapsRef.current);

    // Early win check
    if (tapsRef.current >= targetTaps) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      finishGame(tapsRef.current, targetTaps);
    }
  };

  const finishGame = async (finalTaps: number, target: number) => {
    const isWin = finalTaps >= target;
    setWon(isWin);
    setPhase('result');

    if (isWin && selectedCrystal) {
      const bonus = Math.floor(selectedCrystal.price * 0.3);
      await onEarnCoins(bonus);
    } else if (selectedCrystal) {
      await onConsumeCrystal(selectedCrystal.id);
    }
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('select');
    setSelectedCrystal(null);
    setTaps(0);
    tapsRef.current = 0;
  };

  if (crystals.length === 0 && phase === 'select') {
    return (
      <Card className="p-8 text-center">
        <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
          {crystals.map(crystal => {
            const rarityColor = getRarityColor(crystal.rarity);
            const bonus = Math.floor(crystal.price * 0.3);
            const diff = getDifficulty(crystal.rarity);
            return (
              <button
                key={crystal.id}
                onClick={() => selectCrystal(crystal)}
                className="p-3 rounded-lg border-2 bg-card hover:bg-muted/50 transition-all hover:scale-105 flex flex-col items-center gap-2"
                style={{ borderColor: rarityColor }}
              >
                <div className="w-10 h-10 rounded-md border border-foreground/10" style={{ backgroundColor: crystal.color }} />
                <span className="text-xs font-medium" style={{ color: rarityColor }}>
                  {getRarityName(crystal.rarity, language)}
                </span>
                <span className="text-[10px] text-muted-foreground">{t.worth}: {crystal.price.toLocaleString()}</span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Coins className="w-3 h-3" />+{bonus.toLocaleString()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {t.target}: {diff.targetTaps} · {t.timeLimit}: {diff.timeSeconds}{t.seconds}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  if (!selectedCrystal) return null;

  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const bonus = Math.floor(selectedCrystal.price * 0.3);
  const progress = Math.min(100, (taps / targetTaps) * 100);

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }} />
      <div className="relative z-10">
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

        {/* Timer & taps counter */}
        {(phase === 'tapping' || phase === 'ready') && (
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <Timer className="w-5 h-5 mx-auto text-muted-foreground" />
              <span className="text-2xl font-mono font-bold">{timeLeft.toFixed(1)}</span>
            </div>
            <div className="text-center">
              <Zap className="w-5 h-5 mx-auto text-primary" />
              <span className="text-2xl font-mono font-bold">{taps}<span className="text-sm text-muted-foreground">/{targetTaps}</span></span>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {(phase === 'tapping' || phase === 'ready') && (
          <div className="w-full h-3 rounded-full bg-muted mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? 'hsl(142 76% 36%)' : rarityColor,
              }}
            />
          </div>
        )}

        {/* Tap area */}
        {(phase === 'ready' || phase === 'tapping') && (
          <button
            onClick={handleTap}
            className="w-full py-16 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-95 active:bg-primary/20 transition-all select-none cursor-pointer"
          >
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-12 h-12 text-primary" style={{ color: rarityColor }} />
              <span className="text-xl font-bold text-foreground">
                {phase === 'ready' ? t.ready : t.tapping}
              </span>
            </div>
          </button>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="text-center space-y-4 animate-fade-in py-8">
            <div className={`text-6xl ${won ? '' : 'grayscale opacity-50'}`}>💎</div>
            <p className={`text-lg font-bold ${won ? 'text-primary' : 'text-destructive'}`}>
              {won ? t.won : t.lost}
            </p>
            <p className="text-sm text-muted-foreground">
              {taps} {t.taps} / {targetTaps}
            </p>
            {won && <p className="text-sm text-muted-foreground">+{bonus.toLocaleString()} <Coins className="w-3 h-3 inline" /></p>}
            <div className="flex items-center justify-center gap-3">
              <Button onClick={resetGame} variant="outline">{t.playAgain}</Button>
              <Button onClick={onBack} variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" /> {t.back}</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
