import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, MousePointerClick, ChevronLeft, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Offer a crystal to the gods and click for riches',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to enter the Temple',
    clickToEarn: 'Click to earn coins!',
    perClick: 'per click',
    earned: 'Earned',
    back: 'Leave (lose gem!)',
    totalClicks: 'Clicks',
    progress: 'Progress',
    warning: 'Warning!',
    warningDesc: 'Leaving the Temple will destroy your crystal. Are you sure?',
    stay: 'Stay',
    leave: 'Leave',
    complete: '✨ Crystal fully harvested!',
    worth: 'Worth',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Принеси кристалл богам и кликай за богатство',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы войти в Храм',
    clickToEarn: 'Кликай чтобы заработать монеты!',
    perClick: 'за клик',
    earned: 'Заработано',
    back: 'Уйти (потеря кристалла!)',
    totalClicks: 'Кликов',
    progress: 'Прогресс',
    warning: 'Внимание!',
    warningDesc: 'Если вы уйдёте из Храма, кристалл будет уничтожен. Вы уверены?',
    stay: 'Остаться',
    leave: 'Уйти',
    complete: '✨ Кристалл полностью переработан!',
    worth: 'Стоимость',
  },
};

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickEffect, setClickEffect] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const nextId = useRef(0);
  const t = translations[language];

  const TOTAL_CLICKS = 1000;

  const getCoinsPerClick = (crystal: Crystal): number => {
    return Math.max(1, Math.round(crystal.price / TOTAL_CLICKS));
  };

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    if (!selectedCrystal || completed) return;
    const amount = getCoinsPerClick(selectedCrystal);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, amount }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 800);

    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 100);

    const newClicks = totalClicks + 1;
    setSessionEarnings(prev => prev + amount);
    setTotalClicks(newClicks);
    await onEarnCoins(amount);

    // Check completion
    if (newClicks >= TOTAL_CLICKS) {
      setCompleted(true);
      // Crystal is fully harvested - consume it
      await onConsumeCrystal(selectedCrystal.id);
    }
  }, [selectedCrystal, onEarnCoins, onConsumeCrystal, totalClicks, completed]);

  const handleLeaveAttempt = () => {
    if (completed) {
      // Crystal already consumed, just go back
      resetState();
      return;
    }
    setShowLeaveWarning(true);
  };

  const handleConfirmLeave = async () => {
    if (selectedCrystal) {
      await onConsumeCrystal(selectedCrystal.id);
    }
    resetState();
    setShowLeaveWarning(false);
  };

  const resetState = () => {
    setSelectedCrystal(null);
    setSessionEarnings(0);
    setTotalClicks(0);
    setCompleted(false);
  };

  if (crystals.length === 0 && !selectedCrystal) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">{t.title}</h2>
        <p className="text-muted-foreground">{t.noCrystals}</p>
      </Card>
    );
  }

  if (!selectedCrystal) {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">{t.title}</h2>
          <p className="text-muted-foreground">{t.selectCrystal}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
          {crystals.map(crystal => {
            const rarityColor = getRarityColor(crystal.rarity);
            const coinsPerClick = getCoinsPerClick(crystal);
            return (
              <button
                key={crystal.id}
                onClick={() => {
                  setSelectedCrystal(crystal);
                  setSessionEarnings(0);
                  setTotalClicks(0);
                  setCompleted(false);
                }}
                className="p-3 rounded-lg border-2 bg-card hover:bg-muted/50 transition-all hover:scale-105 flex flex-col items-center gap-2"
                style={{ borderColor: rarityColor }}
              >
                <div
                  className="w-10 h-10 rounded-md border border-foreground/10"
                  style={{ backgroundColor: crystal.color }}
                />
                <span className="text-xs font-medium" style={{ color: rarityColor }}>
                  {getRarityName(crystal.rarity, language)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t.worth}: {crystal.price.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Coins className="w-3 h-3" />
                  +{coinsPerClick}/click
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  const coinsPerClick = getCoinsPerClick(selectedCrystal);
  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const progressPercent = Math.min(100, (totalClicks / TOTAL_CLICKS) * 100);

  return (
    <>
      <Card className="p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveAttempt}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {completed ? (language === 'ru' ? 'Назад' : 'Back') : t.back}
            </Button>
            <Badge variant="outline" className="gap-1">
              <Coins className="w-3 h-3" />
              {coins.toLocaleString()}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{t.progress}</span>
              <span>{totalClicks}/{TOTAL_CLICKS}</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t.perClick}</p>
              <p className="text-lg font-bold" style={{ color: rarityColor }}>+{coinsPerClick}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t.earned}</p>
              <p className="text-lg font-bold text-primary">{sessionEarnings.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t.totalClicks}</p>
              <p className="text-lg font-bold text-foreground">{totalClicks}</p>
            </div>
          </div>

          {/* Completed message */}
          {completed && (
            <div className="text-center p-4 mb-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-lg font-bold text-primary">{t.complete}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? `Заработано ${sessionEarnings.toLocaleString()} монет`
                  : `Earned ${sessionEarnings.toLocaleString()} coins`}
              </p>
            </div>
          )}

          {/* Clicker area */}
          <div className="flex flex-col items-center gap-4">
            {!completed && <p className="text-sm text-muted-foreground">{t.clickToEarn}</p>}

            <div
              className={`
                relative w-40 h-40 rounded-full select-none
                flex items-center justify-center
                border-4 transition-transform duration-100
                ${completed ? 'opacity-50 cursor-default' : 'cursor-pointer hover:brightness-110 active:scale-95'}
                ${clickEffect ? 'scale-90' : 'scale-100'}
              `}
              style={{
                borderColor: rarityColor,
                background: `radial-gradient(circle, ${selectedCrystal.color}cc, ${selectedCrystal.color}40)`,
                boxShadow: `0 0 30px ${rarityColor}40, inset 0 0 20px ${rarityColor}20`,
              }}
              onClick={handleClick}
            >
              <MousePointerClick className="w-12 h-12 text-foreground/70 pointer-events-none" />

              {floatingTexts.map(ft => (
                <span
                  key={ft.id}
                  className="absolute text-sm font-bold pointer-events-none animate-[float-coin_0.8s_ease-out_forwards]"
                  style={{ left: ft.x, top: ft.y, color: rarityColor }}
                >
                  +{ft.amount}
                </span>
              ))}
            </div>

            {/* Crystal info */}
            <div className="text-center">
              <div
                className="w-6 h-6 rounded mx-auto mb-1 border border-foreground/10"
                style={{ backgroundColor: selectedCrystal.color }}
              />
              <p className="text-xs" style={{ color: rarityColor }}>
                {getRarityName(selectedCrystal.rarity, language)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t.worth}: {selectedCrystal.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Leave warning dialog */}
      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {t.warning}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.warningDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.stay}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.leave}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
