import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { ArrowLeft, MousePointerClick } from 'lucide-react';

interface SpamRaceProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

type Phase = 'select' | 'countdown' | 'clicking' | 'result';

const DURATION = 3; // seconds

const t = {
  en: {
    title: 'Spam Race',
    subtitle: `Click as fast as you can in ${DURATION} seconds!`,
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    getReady: 'Get ready...',
    click: 'CLICK!',
    clicks: 'clicks',
    cps: 'clicks/sec',
    bonus: 'Bonus',
    win: 'Speed demon!',
    lose: 'Too slow...',
    next: 'Next',
    timeLeft: 'Time left',
    threshold: 'Need',
  },
  ru: {
    title: 'Спам-гонка',
    subtitle: `Кликай как можно быстрее за ${DURATION} секунды!`,
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    getReady: 'Приготовься...',
    click: 'КЛИКАЙ!',
    clicks: 'кликов',
    cps: 'кликов/сек',
    bonus: 'Бонус',
    win: 'Скоростной демон!',
    lose: 'Слишком медленно...',
    next: 'Далее',
    timeLeft: 'Осталось',
    threshold: 'Нужно',
  },
};

// Thresholds scale with rarity
function getThreshold(rarity: number): number {
  // Base 15 clicks in 3s, +3 per rarity level
  return 15 + rarity * 3;
}

export function SpamRace({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: SpamRaceProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [won, setWon] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const [cps, setCps] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const endTimeRef = useRef(0);
  const clicksRef = useRef(0);

  const selectCrystal = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setClicks(0);
    clicksRef.current = 0;
    setTimeLeft(DURATION);
    setPhase('countdown');

    // 1s countdown then start
    setTimeout(() => {
      setPhase('clicking');
      endTimeRef.current = Date.now() + DURATION * 1000;

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          finishGame(crystal);
        }
      }, 50);
    }, 1000);
  }, []);

  const finishGame = async (crystal: Crystal) => {
    const totalClicks = clicksRef.current;
    const clicksPerSec = totalClicks / DURATION;
    setCps(clicksPerSec);

    const threshold = getThreshold(crystal.rarity);
    const isWin = totalClicks >= threshold;
    setWon(isWin);

    // Bonus: 10% at threshold, up to 45% at 2x threshold
    let bonus = 0;
    if (isWin) {
      const ratio = totalClicks / threshold;
      bonus = Math.min(45, Math.round(10 + (ratio - 1) * 35));
    }
    setBonusPercent(bonus);
    setPhase('result');

    if (isWin) {
      const bonusCoins = Math.floor(crystal.price * (bonus / 100));
      await onEarnCoins(crystal.price + bonusCoins);
    }
    await onConsumeCrystal(crystal.id);
  };

  const handleClick = () => {
    if (phase !== 'clicking') return;
    clicksRef.current++;
    setClicks(c => c + 1);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // SELECT
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold flex items-center gap-2"><MousePointerClick className="w-5 h-5" />{l.title}</h2>
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

  // COUNTDOWN
  if (phase === 'countdown') {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-muted/30">
          <p className="text-5xl font-black animate-pulse text-primary">{l.getReady}</p>
          {selectedCrystal && (
            <p className="text-sm text-muted-foreground mt-4">
              {l.threshold}: {getThreshold(selectedCrystal.rarity)} {l.clicks}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // CLICKING
  if (phase === 'clicking') {
    const threshold = selectedCrystal ? getThreshold(selectedCrystal.rarity) : 15;
    const progress = Math.min((clicks / threshold) * 100, 100);

    return (
      <Card className="p-0 overflow-hidden select-none">
        <div className="p-4 flex items-center justify-between">
          <Badge variant="outline" className="text-lg font-bold">
            {clicks} {l.clicks}
          </Badge>
          <Badge variant={timeLeft <= 1 ? 'destructive' : 'secondary'} className="text-lg font-bold">
            {timeLeft.toFixed(1)}s
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mx-4 h-4 rounded-full bg-muted/50 border border-border overflow-hidden mb-2">
          <div
            className={`h-full transition-all rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mb-2">
          {l.threshold}: {threshold}
        </p>

        <button
          onClick={handleClick}
          className="w-full min-h-[320px] flex flex-col items-center justify-center gap-4 bg-primary/5 hover:bg-primary/10 active:bg-primary/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <MousePointerClick className="w-20 h-20 text-primary" />
          <p className="text-4xl font-black text-primary">{l.click}</p>
        </button>
      </Card>
    );
  }

  // RESULT
  const threshold = selectedCrystal ? getThreshold(selectedCrystal.rarity) : 15;
  return (
    <Card className="p-6 text-center animate-scale-in">
      <h2 className="text-3xl font-bold mb-2">
        {won ? '🔥🎉' : '💔'} {won ? l.win : l.lose}
      </h2>

      <div className="space-y-1 mb-4">
        <p className="text-2xl font-bold">{clicks} {l.clicks}</p>
        <p className="text-sm text-muted-foreground">{cps.toFixed(1)} {l.cps}</p>
        <p className="text-sm text-muted-foreground">{l.threshold}: {threshold}</p>
      </div>

      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * (1 + bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
        </p>
      )}

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); setClicks(0); }} className="w-full mt-2">
        {l.next}
      </Button>
    </Card>
  );
}
