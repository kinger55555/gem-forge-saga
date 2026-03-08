import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, Landmark, Eye, Shuffle, Trophy, X } from 'lucide-react';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];

type Phase = 'select' | 'memorize' | 'shuffling' | 'pick' | 'result';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Offer a crystal — track the glowing rune — win riches',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to enter the Temple',
    memorize: 'Remember this rune!',
    shuffling: 'Shuffling...',
    pickNow: 'Which rune was glowing?',
    won: 'Correct! Crystal returned + bonus!',
    lost: 'Wrong! Crystal destroyed...',
    bonus: 'Bonus',
    worth: 'Worth',
    playAgain: 'Try another crystal',
    difficulty: 'Runes',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Принеси кристалл — запомни руну — выиграй богатство',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы войти в Храм',
    memorize: 'Запомни эту руну!',
    shuffling: 'Перемешивание...',
    pickNow: 'Какая руна светилась?',
    won: 'Верно! Кристалл возвращён + бонус!',
    lost: 'Неверно! Кристалл уничтожен...',
    bonus: 'Бонус',
    worth: 'Стоимость',
    playAgain: 'Попробовать другой кристалл',
    difficulty: 'Руны',
  },
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [runes, setRunes] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0); // index in current runes array of the correct rune
  const [targetRune, setTargetRune] = useState('');
  const [won, setWon] = useState(false);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const shuffleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[language];

  // Number of runes scales with rarity (harder for better crystals)
  const getRuneCount = (crystal: Crystal) => {
    if (crystal.rarity <= 2) return 4;
    if (crystal.rarity <= 4) return 6;
    if (crystal.rarity <= 6) return 9;
    return 12;
  };

  const startGame = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setWon(false);
    setPickedIndex(null);

    const count = getRuneCount(crystal);
    const selected = shuffleArray(RUNES).slice(0, count);
    const tIdx = Math.floor(Math.random() * count);
    
    setRunes(selected);
    setTargetIndex(tIdx);
    setTargetRune(selected[tIdx]);
    setPhase('memorize');

    // After 2 seconds, start shuffling
    setTimeout(() => {
      setPhase('shuffling');
      setShuffleCount(0);
    }, 2000);
  }, []);

  // Shuffling animation: shuffle several times then let player pick
  useEffect(() => {
    if (phase !== 'shuffling') return;

    const totalShuffles = 5 + (selectedCrystal ? Math.floor(selectedCrystal.rarity / 2) : 0);
    
    if (shuffleCount >= totalShuffles) {
      setPhase('pick');
      return;
    }

    shuffleTimerRef.current = setTimeout(() => {
      setRunes(prev => {
        const shuffled = shuffleArray(prev);
        // Track where the target rune ended up
        const newIdx = shuffled.indexOf(targetRune);
        setTargetIndex(newIdx);
        return shuffled;
      });
      setShuffleCount(prev => prev + 1);
    }, 350);

    return () => {
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
    };
  }, [phase, shuffleCount, targetRune, selectedCrystal]);

  const handlePick = useCallback(async (index: number) => {
    if (phase !== 'pick' || !selectedCrystal) return;
    
    setPickedIndex(index);
    const isCorrect = runes[index] === targetRune;
    setWon(isCorrect);
    setPhase('result');

    if (isCorrect) {
      // Player wins: keep crystal (don't consume) + earn 50% of price
      const bonus = Math.floor(selectedCrystal.price * 0.5);
      await onEarnCoins(bonus);
    } else {
      // Player loses: crystal is destroyed
      await onConsumeCrystal(selectedCrystal.id);
    }
  }, [phase, runes, targetRune, selectedCrystal, onEarnCoins, onConsumeCrystal]);

  const resetGame = () => {
    setPhase('select');
    setSelectedCrystal(null);
    setRunes([]);
    setPickedIndex(null);
  };

  // No crystals
  if (crystals.length === 0 && phase === 'select') {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">{t.title}</h2>
        <p className="text-muted-foreground">{t.noCrystals}</p>
      </Card>
    );
  }

  // Crystal selection
  if (phase === 'select') {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
            <Landmark className="w-6 h-6" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">{t.selectCrystal}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
          {crystals.map(crystal => {
            const rarityColor = getRarityColor(crystal.rarity);
            const bonus = Math.floor(crystal.price * 0.5);
            const runeCount = getRuneCount(crystal);
            return (
              <button
                key={crystal.id}
                onClick={() => startGame(crystal)}
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
                  +{bonus.toLocaleString()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {t.difficulty}: {runeCount}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  // Game phases: memorize, shuffling, pick, result
  if (!selectedCrystal) return null;
  
  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const bonus = Math.floor(selectedCrystal.price * 0.5);
  const cols = runes.length <= 4 ? 2 : runes.length <= 6 ? 3 : runes.length <= 9 ? 3 : 4;

  return (
    <Card className="p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
            <Landmark className="w-6 h-6" />
            {t.title}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div
              className="w-6 h-6 rounded border border-foreground/10"
              style={{ backgroundColor: selectedCrystal.color }}
            />
            <span className="text-sm" style={{ color: rarityColor }}>
              {getRarityName(selectedCrystal.rarity, language)}
            </span>
            <Badge variant="outline" className="text-xs gap-1">
              <Coins className="w-3 h-3" />
              {t.bonus}: +{bonus.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Phase message */}
        <div className="text-center mb-6">
          {phase === 'memorize' && (
            <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
              <Eye className="w-5 h-5" />
              <span className="text-lg font-bold">{t.memorize}</span>
            </div>
          )}
          {phase === 'shuffling' && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shuffle className="w-5 h-5 animate-spin" />
              <span className="text-lg font-bold">{t.shuffling}</span>
            </div>
          )}
          {phase === 'pick' && (
            <span className="text-lg font-bold text-accent-foreground">{t.pickNow}</span>
          )}
          {phase === 'result' && (
            <div className={`flex items-center justify-center gap-2 ${won ? 'text-primary' : 'text-destructive'}`}>
              {won ? <Trophy className="w-6 h-6" /> : <X className="w-6 h-6" />}
              <span className="text-lg font-bold">{won ? t.won : t.lost}</span>
            </div>
          )}
        </div>

        {/* Rune grid */}
        <div
          className="grid gap-3 mx-auto mb-6"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            maxWidth: `${cols * 80}px`,
          }}
        >
          {runes.map((rune, i) => {
            const isTarget = rune === targetRune;
            const showGlow = phase === 'memorize' && isTarget;
            const showResult = phase === 'result';
            const isPicked = pickedIndex === i;
            const isClickable = phase === 'pick';

            let borderColor = 'hsl(var(--border))';
            let bgColor = 'hsl(var(--card))';
            
            if (showGlow) {
              borderColor = 'hsl(var(--primary))';
              bgColor = 'hsl(var(--primary) / 0.2)';
            }
            if (showResult && isTarget) {
              borderColor = 'hsl(142 76% 36%)'; // green
              bgColor = 'hsl(142 76% 36% / 0.15)';
            }
            if (showResult && isPicked && !won) {
              borderColor = 'hsl(var(--destructive))';
              bgColor = 'hsl(var(--destructive) / 0.15)';
            }

            return (
              <button
                key={`${rune}-${i}`}
                onClick={() => handlePick(i)}
                disabled={!isClickable}
                className={`
                  aspect-square rounded-lg text-3xl sm:text-4xl flex items-center justify-center
                  border-2 transition-all duration-300 select-none font-mono
                  ${isClickable ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
                  ${phase === 'shuffling' ? 'animate-pulse' : ''}
                  ${showGlow ? 'shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-110' : ''}
                `}
                style={{ borderColor, backgroundColor: bgColor }}
              >
                {rune}
              </button>
            );
          })}
        </div>

        {/* Result actions */}
        {phase === 'result' && (
          <div className="text-center space-y-3">
            {won && (
              <p className="text-sm text-muted-foreground">
                +{bonus.toLocaleString()} <Coins className="w-3 h-3 inline" />
              </p>
            )}
            <Button onClick={resetGame} variant="outline" className="gap-2">
              {t.playAgain}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
