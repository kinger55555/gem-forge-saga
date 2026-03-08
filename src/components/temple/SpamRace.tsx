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

const DURATION = 6; // seconds
const SAMPLE_INTERVAL = 500; // ms - check CPS every 0.5s
const MIN_CPS = 5;
const MAX_VARIANCE = 3; // allowed deviation from average CPS

const t = {
  en: {
    title: 'Steady Spam',
    subtitle: `Keep a steady clicking speed (>${MIN_CPS}/s) for ${DURATION}s. Stay consistent!`,
    selectCrystal: 'Select a crystal to wager',
    noCrystals: 'You need crystals to play',
    getReady: 'Get ready...',
    click: 'KEEP CLICKING!',
    clicks: 'clicks',
    cps: 'CPS',
    avgCps: 'Avg CPS',
    consistency: 'Consistency',
    bonus: 'Bonus',
    win: 'Rock steady!',
    lose: 'Too inconsistent...',
    tooSlow: 'Too slow!',
    next: 'Next',
    timeLeft: 'Time',
    target: 'Keep above',
  },
  ru: {
    title: 'Стабильный спам',
    subtitle: `Держи стабильную скорость клика (>${MIN_CPS}/с) ${DURATION}с. Будь ровным!`,
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Нужны кристаллы для игры',
    getReady: 'Приготовься...',
    click: 'КЛИКАЙ РОВНО!',
    clicks: 'кликов',
    cps: 'КПС',
    avgCps: 'Средн. КПС',
    consistency: 'Стабильность',
    bonus: 'Бонус',
    win: 'Как метроном!',
    lose: 'Слишком неровно...',
    tooSlow: 'Слишком медленно!',
    next: 'Далее',
    timeLeft: 'Время',
    target: 'Держи выше',
  },
};

export function SpamRace({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: SpamRaceProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentCps, setCurrentCps] = useState(0);
  const [cpsHistory, setCpsHistory] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const [avgCps, setAvgCps] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const sampleRef = useRef<ReturnType<typeof setInterval>>();
  const endTimeRef = useRef(0);
  const clicksRef = useRef(0);
  const lastSampleClicksRef = useRef(0);
  const cpsHistoryRef = useRef<number[]>([]);

  const selectCrystal = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setClicks(0);
    clicksRef.current = 0;
    lastSampleClicksRef.current = 0;
    cpsHistoryRef.current = [];
    setCpsHistory([]);
    setCurrentCps(0);
    setTimeLeft(DURATION);
    setPhase('countdown');

    setTimeout(() => {
      setPhase('clicking');
      endTimeRef.current = Date.now() + DURATION * 1000;

      // Timer countdown
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          clearInterval(sampleRef.current);
          finishGame(crystal);
        }
      }, 50);

      // CPS sampling
      sampleRef.current = setInterval(() => {
        const clicksSinceLast = clicksRef.current - lastSampleClicksRef.current;
        const cps = clicksSinceLast / (SAMPLE_INTERVAL / 1000);
        lastSampleClicksRef.current = clicksRef.current;
        setCurrentCps(cps);
        cpsHistoryRef.current.push(cps);
        setCpsHistory([...cpsHistoryRef.current]);
      }, SAMPLE_INTERVAL);
    }, 1000);
  }, []);

  const finishGame = async (crystal: Crystal) => {
    const history = cpsHistoryRef.current;
    if (history.length === 0) {
      setWon(false);
      setAvgCps(0);
      setConsistencyScore(0);
      setBonusPercent(0);
      setPhase('result');
      await onConsumeCrystal(crystal.id);
      return;
    }

    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    setAvgCps(avg);

    // Calculate standard deviation
    const variance = history.reduce((sum, v) => sum + (v - avg) ** 2, 0) / history.length;
    const stdDev = Math.sqrt(variance);

    // Consistency: 100% at stdDev=0, 0% at stdDev=MAX_VARIANCE
    const consistency = Math.max(0, Math.min(100, (1 - stdDev / MAX_VARIANCE) * 100));
    setConsistencyScore(consistency);

    const isWin = avg >= MIN_CPS && consistency >= 40;
    setWon(isWin);

    // Bonus scales with consistency: 40% consistency → 10%, 100% → 45%
    const bonus = isWin ? Math.round(10 + (consistency - 40) / 60 * 35) : 0;
    setBonusPercent(bonus);
    setPhase('result');

    if (isWin) {
      const bonusCoins = Math.floor(crystal.price * (bonus / 100));
      await onEarnCoins(bonusCoins);
    } else {
      await onConsumeCrystal(crystal.id);
    }
  };

  const handleClick = () => {
    if (phase !== 'clicking') return;
    clicksRef.current++;
    setClicks(c => c + 1);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sampleRef.current) clearInterval(sampleRef.current);
  }, []);

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
          <p className="text-sm text-muted-foreground mt-4">{l.target} {MIN_CPS} {l.cps}</p>
        </div>
      </Card>
    );
  }

  // CLICKING
  if (phase === 'clicking') {
    // CPS bar visualization
    const cpsBarHeight = Math.min(currentCps / 15, 1) * 100;
    const isAboveMin = currentCps >= MIN_CPS;

    return (
      <Card className="p-0 overflow-hidden select-none">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg font-bold">
              {clicks} {l.clicks}
            </Badge>
            <Badge variant={isAboveMin ? 'default' : 'destructive'} className="text-lg font-bold">
              {currentCps.toFixed(1)} {l.cps}
            </Badge>
          </div>
          <Badge variant={timeLeft <= 2 ? 'destructive' : 'secondary'} className="text-lg font-bold">
            {timeLeft.toFixed(1)}s
          </Badge>
        </div>

        {/* CPS graph */}
        <div className="mx-4 mb-2 h-16 flex items-end gap-[2px] bg-muted/30 rounded-lg p-1 border border-border relative">
          {/* Min CPS line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-primary/50"
            style={{ bottom: `${(MIN_CPS / 15) * 100}%` }}
          />
          {cpsHistory.map((cps, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${cps >= MIN_CPS ? 'bg-primary' : 'bg-destructive'}`}
              style={{ height: `${Math.min(cps / 15, 1) * 100}%`, minWidth: 3 }}
            />
          ))}
        </div>

        <button
          onClick={handleClick}
          className="w-full min-h-[280px] flex flex-col items-center justify-center gap-4 bg-primary/5 hover:bg-primary/10 active:bg-primary/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <MousePointerClick className="w-16 h-16 text-primary" />
          <p className="text-3xl font-black text-primary">{l.click}</p>
        </button>
      </Card>
    );
  }

  // RESULT
  return (
    <Card className="p-6 text-center animate-scale-in">
      <h2 className="text-3xl font-bold mb-2">
        {won ? '🎯🎉' : avgCps < MIN_CPS ? '🐌💔' : '📊💔'}{' '}
        {won ? l.win : avgCps < MIN_CPS ? l.tooSlow : l.lose}
      </h2>

      <div className="space-y-1 mb-4">
        <p className="text-2xl font-bold">{clicks} {l.clicks}</p>
        <p className="text-sm text-muted-foreground">{l.avgCps}: {avgCps.toFixed(1)}</p>
        <p className="text-sm text-muted-foreground">{l.consistency}: {consistencyScore.toFixed(0)}%</p>
      </div>

      {/* CPS history chart */}
      <div className="mx-auto mb-4 h-12 flex items-end gap-[2px] bg-muted/30 rounded-lg p-1 border border-border max-w-xs relative">
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-primary/50"
          style={{ bottom: `${(MIN_CPS / 15) * 100}%` }}
        />
        {cpsHistory.map((cps, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${cps >= MIN_CPS ? 'bg-primary' : 'bg-destructive'}`}
            style={{ height: `${Math.min(cps / 15, 1) * 100}%`, minWidth: 3 }}
          />
        ))}
      </div>

      {won && selectedCrystal && (
        <p className="text-lg mb-4">
          +💰{Math.floor(selectedCrystal.price * (bonusPercent / 100)).toLocaleString()} ({l.bonus} +{bonusPercent}%)
        </p>
      )}

      <Button onClick={() => { setPhase('select'); setSelectedCrystal(null); setClicks(0); setCpsHistory([]); }} className="w-full mt-2">
        {l.next}
      </Button>
    </Card>
  );
}
