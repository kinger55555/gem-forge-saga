import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, Landmark, Trophy, X, Zap } from 'lucide-react';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];

type Phase = 'select' | 'showing' | 'input' | 'result';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Watch the sequence. Repeat it. Earn riches.',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to enter the Temple',
    watch: 'Watch carefully...',
    yourTurn: 'Your turn! Repeat the sequence',
    won: 'Perfect! Crystal returned + bonus!',
    lost: 'Wrong sequence! Crystal destroyed...',
    bonus: 'Bonus',
    worth: 'Worth',
    playAgain: 'Try another crystal',
    sequence: 'Sequence',
    progress: 'Progress',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Запомни последовательность. Повтори. Получи богатство.',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы войти в Храм',
    watch: 'Смотри внимательно...',
    yourTurn: 'Твой ход! Повтори последовательность',
    won: 'Идеально! Кристалл возвращён + бонус!',
    lost: 'Неверная последовательность! Кристалл уничтожен...',
    bonus: 'Бонус',
    worth: 'Стоимость',
    playAgain: 'Попробовать другой кристалл',
    sequence: 'Последовательность',
    progress: 'Прогресс',
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
  const [sequence, setSequence] = useState<number[]>([]); // indices into runes[] that must be repeated
  const [playerProgress, setPlayerProgress] = useState(0); // how many correct so far
  const [activeRune, setActiveRune] = useState<number | null>(null); // currently lit rune index
  const [won, setWon] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [flashCorrect, setFlashCorrect] = useState<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[language];

  // Sequence length and grid size scale with rarity
  const getSequenceLength = (crystal: Crystal) => {
    if (crystal.rarity <= 1) return 3;
    if (crystal.rarity <= 3) return 4;
    if (crystal.rarity <= 5) return 5;
    if (crystal.rarity <= 7) return 6;
    return 7;
  };

  const getGridSize = (crystal: Crystal) => {
    if (crystal.rarity <= 2) return 6;  // 3x2
    if (crystal.rarity <= 5) return 9;  // 3x3
    return 12; // 4x3
  };

  const getShowSpeed = (crystal: Crystal) => {
    if (crystal.rarity <= 2) return 700;
    if (crystal.rarity <= 5) return 550;
    return 450;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, []);

  const showSequence = useCallback((seq: number[], speed: number) => {
    setPhase('showing');
    setActiveRune(null);
    
    let i = 0;
    const show = () => {
      if (i < seq.length) {
        setActiveRune(seq[i]);
        showTimerRef.current = setTimeout(() => {
          setActiveRune(null);
          showTimerRef.current = setTimeout(() => {
            i++;
            show();
          }, 200); // gap between flashes
        }, speed - 200); // how long each rune stays lit
      } else {
        // Done showing, player's turn
        setPhase('input');
      }
    };

    // Small initial delay
    showTimerRef.current = setTimeout(show, 600);
  }, []);

  const startGame = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setWon(false);
    setPlayerProgress(0);
    setWrongIndex(null);
    setFlashCorrect(null);

    const gridSize = getGridSize(crystal);
    const seqLength = getSequenceLength(crystal);
    const speed = getShowSpeed(crystal);

    // Pick runes for the grid
    const selected = shuffleArray(RUNES).slice(0, gridSize);
    setRunes(selected);

    // Generate a random sequence of indices
    const seq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      seq.push(Math.floor(Math.random() * gridSize));
    }
    setSequence(seq);

    // Start showing the sequence
    showSequence(seq, speed);
  }, [showSequence]);

  const handleRuneClick = useCallback(async (index: number) => {
    if (phase !== 'input' || !selectedCrystal) return;

    const expectedIndex = sequence[playerProgress];

    if (index === expectedIndex) {
      // Correct!
      setFlashCorrect(index);
      setTimeout(() => setFlashCorrect(null), 250);

      const newProgress = playerProgress + 1;
      setPlayerProgress(newProgress);

      if (newProgress >= sequence.length) {
        // Won the whole sequence!
        setWon(true);
        setPhase('result');
        const bonus = Math.floor(selectedCrystal.price * 0.5);
        await onEarnCoins(bonus);
      }
    } else {
      // Wrong — game over
      setWrongIndex(index);
      setActiveRune(expectedIndex); // show correct one
      setWon(false);
      setPhase('result');
      await onConsumeCrystal(selectedCrystal.id);
    }
  }, [phase, sequence, playerProgress, selectedCrystal, onEarnCoins, onConsumeCrystal]);

  const resetGame = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    setPhase('select');
    setSelectedCrystal(null);
    setRunes([]);
    setSequence([]);
    setPlayerProgress(0);
    setActiveRune(null);
    setWrongIndex(null);
    setFlashCorrect(null);
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
            const seqLen = getSequenceLength(crystal);
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
                  {t.sequence}: {seqLen}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  // Game phases
  if (!selectedCrystal) return null;

  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const bonus = Math.floor(selectedCrystal.price * 0.5);
  const cols = runes.length <= 6 ? 3 : runes.length <= 9 ? 3 : 4;

  return (
    <Card className="p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-4">
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

        {/* Sequence progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={`
                w-3 h-3 rounded-full border-2 transition-all duration-300
                ${i < playerProgress
                  ? 'bg-primary border-primary scale-110'
                  : i === playerProgress && phase === 'input'
                    ? 'border-primary animate-pulse'
                    : 'border-muted-foreground/30 bg-transparent'
                }
              `}
            />
          ))}
        </div>

        {/* Phase message */}
        <div className="text-center mb-5">
          {phase === 'showing' && (
            <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
              <Zap className="w-5 h-5" />
              <span className="text-lg font-bold">{t.watch}</span>
            </div>
          )}
          {phase === 'input' && (
            <span className="text-lg font-bold text-foreground">{t.yourTurn}</span>
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
            const isLit = activeRune === i;
            const isFlashCorrect = flashCorrect === i;
            const isWrong = wrongIndex === i;
            const isClickable = phase === 'input';

            let borderClr = 'hsl(var(--border))';
            let bgClr = 'hsl(var(--card))';
            let shadow = 'none';
            let transform = '';

            if (isLit) {
              borderClr = 'hsl(var(--primary))';
              bgClr = 'hsl(var(--primary) / 0.25)';
              shadow = '0 0 25px hsl(var(--primary) / 0.6), inset 0 0 15px hsl(var(--primary) / 0.2)';
              transform = 'scale(1.1)';
            }
            if (isFlashCorrect) {
              borderClr = 'hsl(142 76% 36%)';
              bgClr = 'hsl(142 76% 36% / 0.2)';
              shadow = '0 0 15px hsl(142 76% 36% / 0.5)';
              transform = 'scale(1.08)';
            }
            if (isWrong) {
              borderClr = 'hsl(var(--destructive))';
              bgClr = 'hsl(var(--destructive) / 0.2)';
              shadow = '0 0 15px hsl(var(--destructive) / 0.5)';
            }
            // On result, show the correct rune that was expected
            if (phase === 'result' && !won && activeRune === i) {
              borderClr = 'hsl(142 76% 36%)';
              bgClr = 'hsl(142 76% 36% / 0.15)';
              shadow = '0 0 20px hsl(142 76% 36% / 0.4)';
            }

            return (
              <button
                key={`${rune}-${i}`}
                onClick={() => handleRuneClick(i)}
                disabled={!isClickable}
                className={`
                  aspect-square rounded-xl text-3xl sm:text-4xl flex items-center justify-center
                  border-2 select-none font-mono
                  transition-all duration-200
                  ${isClickable ? 'cursor-pointer hover:scale-105 hover:border-primary/50 active:scale-95' : ''}
                `}
                style={{
                  borderColor: borderClr,
                  backgroundColor: bgClr,
                  boxShadow: shadow,
                  transform,
                }}
              >
                {rune}
              </button>
            );
          })}
        </div>

        {/* Result actions */}
        {phase === 'result' && (
          <div className="text-center space-y-3 animate-fade-in">
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
