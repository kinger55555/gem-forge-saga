import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, Landmark, Trophy, X } from 'lucide-react';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];

type Phase = 'select' | 'reveal' | 'shuffling' | 'pick' | 'result';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Find the glowing rune after the shuffle',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to enter the Temple',
    remember: 'Remember this one!',
    shuffling: 'Shuffling...',
    pickNow: 'Where did it go?',
    won: 'Correct! Crystal returned + bonus!',
    lost: 'Wrong! Crystal destroyed...',
    bonus: 'Bonus',
    worth: 'Worth',
    playAgain: 'Try another crystal',
    cups: 'Cups',
    shuffles: 'Shuffles',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Найди светящуюся руну после перемешивания',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы войти в Храм',
    remember: 'Запомни эту!',
    shuffling: 'Перемешивание...',
    pickNow: 'Куда она делась?',
    won: 'Верно! Кристалл возвращён + бонус!',
    lost: 'Неверно! Кристалл уничтожен...',
    bonus: 'Бонус',
    worth: 'Стоимость',
    playAgain: 'Попробовать другой кристалл',
    cups: 'Стаканов',
    shuffles: 'Перемешиваний',
  },
};

// Difficulty config by rarity — always 8 cups, Limbo-style
// Phase 1: pairwise swaps. Phase 2: circular spinning.
function getDifficulty(rarity: number) {
  if (rarity <= 1) return { cups: 8, swaps: 6, spins: 4, speed: 700 };
  if (rarity <= 3) return { cups: 8, swaps: 8, spins: 6, speed: 600 };
  if (rarity <= 5) return { cups: 8, swaps: 10, spins: 8, speed: 520 };
  if (rarity <= 7) return { cups: 8, swaps: 14, spins: 10, speed: 440 };
  return { cups: 8, swaps: 18, spins: 14, speed: 380 };
}

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [cups, setCups] = useState<string[]>([]);
  const [targetRune, setTargetRune] = useState('');
  // positions[i] = which visual slot cup i occupies (for animation)
  const [positions, setPositions] = useState<number[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [won, setWon] = useState(false);
  const [pickedCup, setPickedCup] = useState<number | null>(null);
  const [revealedCup, setRevealedCup] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[language];

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startGame = useCallback((crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setWon(false);
    setPickedCup(null);
    setRevealedCup(null);
    setIsShuffling(false);

    const diff = getDifficulty(crystal.rarity);
    const selected = RUNES.slice(0, diff.cups);
    const targetIdx = Math.floor(Math.random() * diff.cups);

    setCups(selected);
    setTargetRune(selected[targetIdx]);
    setPositions(selected.map((_, i) => i));
    setRevealedCup(targetIdx);
    setPhase('reveal');

    // Show the target for 1.5s, then start shuffling
    timerRef.current = setTimeout(() => {
      setRevealedCup(null);
      setPhase('shuffling');
      doShuffles(selected.length, diff.shuffles, diff.speed, 0, selected.map((_, i) => i));
    }, 1500);
  }, []);

  // Patterns that move ALL 8 cups at once (2x4 grid, indices 0-7)
  // Grid layout:  0 1 2 3
  //               4 5 6 7
  const PATTERNS = [
    // Rotate perimeter clockwise: 0→1→2→3→7→6→5→4→0
    (p: number[]) => { const n = [...p]; const ring = [0,1,2,3,7,6,5,4]; const vals = ring.map(i => p[i]); for (let i = 0; i < ring.length; i++) n[ring[i]] = vals[(i - 1 + ring.length) % ring.length]; return n; },
    // Rotate perimeter counter-clockwise
    (p: number[]) => { const n = [...p]; const ring = [0,1,2,3,7,6,5,4]; const vals = ring.map(i => p[i]); for (let i = 0; i < ring.length; i++) n[ring[i]] = vals[(i + 1) % ring.length]; return n; },
    // Swap rows: top↔bottom
    (p: number[]) => { const n = [...p]; [n[0],n[4]] = [p[4],p[0]]; [n[1],n[5]] = [p[5],p[1]]; [n[2],n[6]] = [p[6],p[2]]; [n[3],n[7]] = [p[7],p[3]]; return n; },
    // Shift all left (wrap)
    (p: number[]) => { const n = [...p]; [n[0],n[1],n[2],n[3]] = [p[1],p[2],p[3],p[0]]; [n[4],n[5],n[6],n[7]] = [p[5],p[6],p[7],p[4]]; return n; },
    // Shift all right (wrap)
    (p: number[]) => { const n = [...p]; [n[0],n[1],n[2],n[3]] = [p[3],p[0],p[1],p[2]]; [n[4],n[5],n[6],n[7]] = [p[7],p[4],p[5],p[6]]; return n; },
    // Mirror horizontally: swap columns 0↔3, 1↔2
    (p: number[]) => { const n = [...p]; [n[0],n[3]] = [p[3],p[0]]; [n[1],n[2]] = [p[2],p[1]]; [n[4],n[7]] = [p[7],p[4]]; [n[5],n[6]] = [p[6],p[5]]; return n; },
    // Diagonal shift: each moves to its diagonal partner
    (p: number[]) => { const n = [...p]; [n[0],n[7]] = [p[7],p[0]]; [n[1],n[6]] = [p[6],p[1]]; [n[2],n[5]] = [p[5],p[2]]; [n[3],n[4]] = [p[4],p[3]]; return n; },
    // Rotate top row CW + bottom row CCW
    (p: number[]) => { const n = [...p]; [n[0],n[1],n[2],n[3]] = [p[3],p[0],p[1],p[2]]; [n[4],n[5],n[6],n[7]] = [p[5],p[6],p[7],p[4]]; return n; },
  ];

  const doShuffles = (cupCount: number, total: number, speed: number, current: number, pos: number[]) => {
    if (current >= total) {
      setIsShuffling(false);
      setPhase('pick');
      return;
    }

    setIsShuffling(true);

    // Pick a random pattern
    const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const newPos = pattern(pos);
    setPositions(newPos);

    timerRef.current = setTimeout(() => {
      doShuffles(cupCount, total, speed, current + 1, newPos);
    }, speed);
  };

  const handlePick = useCallback(async (cupIndex: number) => {
    if (phase !== 'pick' || !selectedCrystal) return;

    setPickedCup(cupIndex);
    const isCorrect = cups[cupIndex] === targetRune;
    setWon(isCorrect);

    // Find the correct cup to reveal
    const correctIdx = cups.indexOf(targetRune);
    setRevealedCup(correctIdx);
    setPhase('result');

    if (isCorrect) {
      const bonus = Math.floor(selectedCrystal.price * 0.5);
      await onEarnCoins(bonus);
    } else {
      await onConsumeCrystal(selectedCrystal.id);
    }
  }, [phase, cups, targetRune, selectedCrystal, onEarnCoins, onConsumeCrystal]);

  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('select');
    setSelectedCrystal(null);
    setCups([]);
    setPositions([]);
    setIsShuffling(false);
    setPickedCup(null);
    setRevealedCup(null);
  };

  // === RENDER ===

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
            const diff = getDifficulty(crystal.rarity);
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
                  {t.cups}: {diff.cups} · {t.shuffles}: {diff.shuffles}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  // Game view
  if (!selectedCrystal) return null;

  const rarityColor = getRarityColor(selectedCrystal.rarity);
  const bonus = Math.floor(selectedCrystal.price * 0.5);
  const cupWidth = 72;
  const cupGap = 12;
  

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

        {/* Phase message */}
        <div className="text-center mb-6 h-8">
          {phase === 'reveal' && (
            <span className="text-lg font-bold text-primary animate-pulse">{t.remember}</span>
          )}
          {phase === 'shuffling' && (
            <span className="text-lg font-bold text-muted-foreground">{t.shuffling}</span>
          )}
          {phase === 'pick' && (
            <span className="text-lg font-bold text-foreground">{t.pickNow}</span>
          )}
          {phase === 'result' && (
            <div className={`flex items-center justify-center gap-2 ${won ? 'text-primary' : 'text-destructive'}`}>
              {won ? <Trophy className="w-6 h-6" /> : <X className="w-6 h-6" />}
              <span className="text-lg font-bold">{won ? t.won : t.lost}</span>
            </div>
          )}
        </div>

        {/* Cups area — 4 columns × 2 rows */}
        <div
          className="relative mx-auto mb-8"
          style={{ width: 4 * cupWidth + 3 * cupGap, height: 2 * cupWidth + cupGap + 20 }}
        >
          {cups.map((rune, i) => {
            const pos = positions[i];
            const col = pos % 4;
            const row = Math.floor(pos / 4);
            const left = col * (cupWidth + cupGap);
            const top = row * (cupWidth + cupGap);
            const isTarget = rune === targetRune;
            const isRevealed = revealedCup === i;
            const isPicked = pickedCup === i;
            const isMoving = isShuffling;
            const isClickable = phase === 'pick';

            let borderClr = 'hsl(var(--border))';
            let bgClr = 'hsl(var(--muted))';
            let shadow = 'none';
            let showRune = false;

            // During reveal phase, show the target rune glowing
            if (phase === 'reveal' && isTarget) {
              borderClr = 'hsl(var(--primary))';
              bgClr = 'hsl(var(--primary) / 0.2)';
              shadow = '0 0 25px hsl(var(--primary) / 0.5)';
              showRune = true;
            }

            // During result, show the correct cup and wrong pick
            if (phase === 'result') {
              if (isRevealed && isTarget) {
                borderClr = 'hsl(142 76% 36%)';
                bgClr = 'hsl(142 76% 36% / 0.15)';
                shadow = '0 0 20px hsl(142 76% 36% / 0.4)';
                showRune = true;
              }
              if (isPicked && !won) {
                borderClr = 'hsl(var(--destructive))';
                bgClr = 'hsl(var(--destructive) / 0.15)';
                shadow = '0 0 15px hsl(var(--destructive) / 0.4)';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={!isClickable}
                className={`
                  absolute top-0 flex flex-col items-center justify-center
                  rounded-xl border-2 select-none
                  ${isClickable ? 'cursor-pointer hover:scale-110 hover:border-primary/50 active:scale-95' : ''}
                `}
                style={{
                  width: cupWidth,
                  height: cupWidth,
                  left,
                  top,
                  borderColor: borderClr,
                  backgroundColor: bgClr,
                  boxShadow: shadow,
                  transition: `left 0.35s cubic-bezier(0.4, 0, 0.2, 1), top 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s, border-color 0.2s, background-color 0.2s, box-shadow 0.2s`,
                  zIndex: isMoving ? 10 : 1,
                }}
              >
                {/* Cup symbol on top */}
                <span className="text-2xl mb-1 opacity-80">🏺</span>
                {/* Show rune underneath when revealed */}
                <span
                  className="text-xl font-mono transition-opacity duration-300"
                  style={{ opacity: showRune ? 1 : 0 }}
                >
                  {rune}
                </span>
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
