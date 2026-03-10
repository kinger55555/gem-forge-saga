import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, ArrowLeft, Trophy, X, Route } from 'lucide-react';

interface TwoRoadsProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'Two Roads',
    subtitle: 'Pick a path — only one leads to fortune',
    selectCrystal: 'Select a crystal to risk',
    noCrystals: 'You need crystals to play',
    back: 'Back',
    worth: 'Worth',
    bonus: 'Bonus',
    playAgain: 'Try another crystal',
    choose: 'Choose your path',
    left: 'Left Path',
    right: 'Right Path',
    won: 'You chose wisely!',
    lost: 'Wrong path...',
    revealing: 'Revealing...',
  },
  ru: {
    title: 'Два Пути',
    subtitle: 'Выбери дорогу — только одна ведёт к удаче',
    selectCrystal: 'Выбери кристалл для ставки',
    noCrystals: 'Тебе нужны кристаллы чтобы играть',
    back: 'Назад',
    worth: 'Стоимость',
    bonus: 'Бонус',
    playAgain: 'Попробовать другой кристалл',
    choose: 'Выбери путь',
    left: 'Левый путь',
    right: 'Правый путь',
    won: 'Верный выбор!',
    lost: 'Неверный путь...',
    revealing: 'Открываем...',
  },
};

type Phase = 'select' | 'choose' | 'revealing' | 'result';

export function TwoRoads({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: TwoRoadsProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [correctPath, setCorrectPath] = useState<'left' | 'right'>('left');
  const [chosenPath, setChosenPath] = useState<'left' | 'right' | null>(null);
  const [won, setWon] = useState(false);
  const t = translations[language];

  const startGame = (crystal: Crystal) => {
    supabase.rpc('increment_game_play', { p_game_id: 'tworoads' });
    setSelectedCrystal(crystal);
    setCorrectPath(Math.random() < 0.5 ? 'left' : 'right');
    setChosenPath(null);
    setWon(false);
    setPhase('choose');
  };

  const choosePath = async (path: 'left' | 'right') => {
    if (!selectedCrystal) return;
    setChosenPath(path);
    setPhase('revealing');

    const isWin = path === correctPath;

    // Dramatic pause
    await new Promise(r => setTimeout(r, 1500));

    setWon(isWin);
    setPhase('result');

    if (isWin) {
      const bonus = Math.floor(selectedCrystal.price * 0.02);
      await onEarnCoins(bonus);
    } else {
      await onConsumeCrystal(selectedCrystal.id);
    }
  };

  const resetGame = () => {
    setPhase('select');
    setSelectedCrystal(null);
    setChosenPath(null);
  };

  // No crystals
  if (crystals.length === 0 && phase === 'select') {
    return (
      <Card className="p-8 text-center">
        <Route className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">{t.title}</h2>
        <p className="text-muted-foreground mb-4">{t.noCrystals}</p>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Button>
      </Card>
    );
  }

  // Crystal selection
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
            const bonus = Math.floor(crystal.price * 0.02);
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
                <span className="text-[10px] text-muted-foreground">{t.worth}: {crystal.price.toLocaleString()}</span>
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
  const bonus = Math.floor(selectedCrystal.price * 0.02);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-1">{t.title}</h2>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-6 h-6 rounded border border-foreground/10" style={{ backgroundColor: selectedCrystal.color }} />
          <span className="text-sm" style={{ color: rarityColor }}>{getRarityName(selectedCrystal.rarity, language)}</span>
          <Badge variant="outline" className="text-xs gap-1">
            <Coins className="w-3 h-3" />{t.bonus}: +{bonus.toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Choose phase */}
      {phase === 'choose' && (
        <div className="space-y-6">
          <p className="text-center text-lg font-medium text-muted-foreground">{t.choose}</p>
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            <button
              onClick={() => choosePath('left')}
              className="group p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-muted/50 transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-3xl">
                🌿
              </div>
              <span className="font-bold text-foreground">{t.left}</span>
            </button>
            <button
              onClick={() => choosePath('right')}
              className="group p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-muted/50 transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-3xl">
                🔥
              </div>
              <span className="font-bold text-foreground">{t.right}</span>
            </button>
          </div>
        </div>
      )}

      {/* Revealing */}
      {phase === 'revealing' && (
        <div className="py-16 text-center animate-pulse">
          <div className="text-5xl mb-4">🎭</div>
          <p className="text-lg font-bold text-foreground">{t.revealing}</p>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="text-center space-y-4 animate-fade-in py-8">
          {/* Show both paths */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
            <div className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
              correctPath === 'left'
                ? 'border-primary bg-primary/10'
                : 'border-destructive/50 bg-destructive/5 opacity-60'
            } ${chosenPath === 'left' ? 'ring-2 ring-foreground/30' : ''}`}>
              <div className="text-3xl">{correctPath === 'left' ? '✨' : '💀'}</div>
              <span className="text-sm font-medium">{t.left}</span>
              {chosenPath === 'left' && (
                <Badge variant="outline" className="text-[10px]">
                  {language === 'ru' ? 'Твой выбор' : 'Your pick'}
                </Badge>
              )}
            </div>
            <div className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
              correctPath === 'right'
                ? 'border-primary bg-primary/10'
                : 'border-destructive/50 bg-destructive/5 opacity-60'
            } ${chosenPath === 'right' ? 'ring-2 ring-foreground/30' : ''}`}>
              <div className="text-3xl">{correctPath === 'right' ? '✨' : '💀'}</div>
              <span className="text-sm font-medium">{t.right}</span>
              {chosenPath === 'right' && (
                <Badge variant="outline" className="text-[10px]">
                  {language === 'ru' ? 'Твой выбор' : 'Your pick'}
                </Badge>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-center gap-2 ${won ? 'text-primary' : 'text-destructive'}`}>
            {won ? <Trophy className="w-6 h-6" /> : <X className="w-6 h-6" />}
            <span className="text-lg font-bold">{won ? t.won : t.lost}</span>
          </div>
          {won && (
            <p className="text-sm text-muted-foreground">
              +{bonus.toLocaleString()} <Coins className="w-3 h-3 inline" />
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={resetGame} variant="outline">{t.playAgain}</Button>
            <Button onClick={onBack} variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" /> {t.back}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
