import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, MousePointerClick, ChevronLeft } from 'lucide-react';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
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
    earned: 'Earned this session',
    back: 'Change crystal',
    totalClicks: 'Clicks',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Принеси кристалл богам и кликай за богатство',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы войти в Храм',
    clickToEarn: 'Кликай чтобы заработать монеты!',
    perClick: 'за клик',
    earned: 'Заработано за сессию',
    back: 'Сменить кристалл',
    totalClicks: 'Кликов',
  },
};

function getCoinsPerClick(crystal: Crystal): number {
  // Higher rarity = more coins per click
  const base = Math.max(1, Math.floor(crystal.rarity * 2 + 1));
  // Special bonus for extreme RGB values
  const values = [crystal.red, crystal.green, crystal.blue];
  let bonus = 0;
  values.forEach(v => {
    if (v === 0 || v === 255) bonus += 2;
    else if (v <= 25 || v >= 230) bonus += 1;
  });
  return base + bonus;
}

export function Temple({ crystals, coins, onEarnCoins, language }: TempleProps) {
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickEffect, setClickEffect] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const nextId = useRef(0);
  const t = translations[language];

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    if (!selectedCrystal) return;
    const amount = getCoinsPerClick(selectedCrystal);

    // Floating text at click position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, amount }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 800);

    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 100);

    setSessionEarnings(prev => prev + amount);
    setTotalClicks(prev => prev + 1);
    await onEarnCoins(amount);
  }, [selectedCrystal, onEarnCoins]);

  if (crystals.length === 0) {
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
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Coins className="w-3 h-3" />
                  +{coinsPerClick}
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

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCrystal(null)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.back}
          </Button>
          <Badge variant="outline" className="gap-1">
            <Coins className="w-3 h-3" />
            {coins.toLocaleString()}
          </Badge>
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

        {/* Clicker area */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">{t.clickToEarn}</p>

          <div
            className={`
              relative w-40 h-40 rounded-full cursor-pointer select-none
              flex items-center justify-center
              border-4 transition-transform duration-100
              hover:brightness-110 active:scale-95
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

            {/* Floating coin texts */}
            {floatingTexts.map(ft => (
              <span
                key={ft.id}
                className="absolute text-sm font-bold pointer-events-none animate-[float-coin_0.8s_ease-out_forwards]"
                style={{
                  left: ft.x,
                  top: ft.y,
                  color: rarityColor,
                }}
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
              RGB({selectedCrystal.red}, {selectedCrystal.green}, {selectedCrystal.blue})
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
