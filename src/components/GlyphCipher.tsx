import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Timer, Trophy, Zap } from 'lucide-react';

interface GlyphCipherProps {
  onEarnCoins: (amount: number) => Promise<void>;
  coins: number;
  language: 'en' | 'ru';
}

// Ancient-looking glyphs using unicode symbols
const GLYPHS = [
  '𐎀', '𐎁', '𐎂', '𐎃', '𐎄', '𐎅', '𐎆', '𐎇', '𐎈', '𐎉',
  '𐎊', '𐎋', '𐎌', '𐎍', '𐎎', '𐎏', '𐎐', '𐎑', '𐎒', '𐎓',
  '☽', '☾', '✦', '⚶', '⛧', '♅', '⚷', '⚸',
];

const translations = {
  en: {
    title: "Scribe's Vigil",
    subtitle: 'Find all matching glyphs before time runs out!',
    start: 'Begin Deciphering',
    target: 'Target Glyph',
    found: 'Found',
    timeLeft: 'Time',
    reward: 'Reward',
    success: 'Deciphered!',
    failed: 'Time expired!',
    playAgain: 'Play Again',
    round: 'Round',
    streak: 'Streak',
    cost: 'Entry: Free',
    difficulty: 'Difficulty',
  },
  ru: {
    title: 'Бдение Писца',
    subtitle: 'Найди все подходящие глифы до истечения времени!',
    start: 'Начать расшифровку',
    target: 'Целевой глиф',
    found: 'Найдено',
    timeLeft: 'Время',
    reward: 'Награда',
    success: 'Расшифровано!',
    failed: 'Время вышло!',
    playAgain: 'Играть снова',
    round: 'Раунд',
    streak: 'Серия',
    cost: 'Вход: Бесплатно',
    difficulty: 'Сложность',
  },
};

type GamePhase = 'idle' | 'playing' | 'success' | 'failed';

interface GridCell {
  glyph: string;
  isTarget: boolean;
  found: boolean;
}

export function GlyphCipher({ onEarnCoins, coins, language }: GlyphCipherProps) {
  const t = translations[language];
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [targetGlyph, setTargetGlyph] = useState('');
  const [targetCount, setTargetCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [winStreak, setWinStreak] = useState(0);
  const [reward, setReward] = useState(0);
  const [lastClickCorrect, setLastClickCorrect] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Difficulty scales with round
  const getGridSize = () => Math.min(8, 5 + Math.floor((round - 1) / 3)); // 5x5 -> 8x8
  const getTargetCountForRound = () => Math.min(8, 3 + Math.floor((round - 1) / 2));
  const getTimeForRound = () => Math.max(5, 15 - Math.floor((round - 1) / 2)); // 15s -> 5s
  const getRewardForRound = () => Math.floor(10 * round * (1 + winStreak * 0.25));

  const generateGrid = useCallback(() => {
    const size = getGridSize();
    const totalCells = size * size;
    const numTargets = getTargetCountForRound();

    // Pick target glyph and fill glyphs
    const target = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const otherGlyphs = GLYPHS.filter(g => g !== target);

    const cells: GridCell[] = [];

    // Place targets at random positions
    const targetPositions = new Set<number>();
    while (targetPositions.size < numTargets) {
      targetPositions.add(Math.floor(Math.random() * totalCells));
    }

    for (let i = 0; i < totalCells; i++) {
      if (targetPositions.has(i)) {
        cells.push({ glyph: target, isTarget: true, found: false });
      } else {
        cells.push({
          glyph: otherGlyphs[Math.floor(Math.random() * otherGlyphs.length)],
          isTarget: false,
          found: false,
        });
      }
    }

    setTargetGlyph(target);
    setTargetCount(numTargets);
    setFoundCount(0);
    setGrid(cells);
    setReward(getRewardForRound());
    setLastClickCorrect(null);
  }, [round, winStreak]);

  const startGame = useCallback(() => {
    generateGrid();
    const time = getTimeForRound();
    setTimeLeft(time);
    setPhase('playing');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('failed');
          setWinStreak(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateGrid]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCellClick = useCallback(async (index: number) => {
    if (phase !== 'playing') return;

    const cell = grid[index];
    if (cell.found) return;

    if (cell.isTarget) {
      setLastClickCorrect(true);
      const newGrid = [...grid];
      newGrid[index] = { ...cell, found: true };
      setGrid(newGrid);

      const newFound = foundCount + 1;
      setFoundCount(newFound);

      if (newFound >= targetCount) {
        // Won!
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('success');
        const newStreak = winStreak + 1;
        setWinStreak(newStreak);
        await onEarnCoins(reward);
      }
    } else {
      // Wrong click - small time penalty
      setLastClickCorrect(false);
      setTimeLeft(prev => Math.max(1, prev - 1));
    }

    setTimeout(() => setLastClickCorrect(null), 300);
  }, [phase, grid, foundCount, targetCount, reward, winStreak, onEarnCoins]);

  const handlePlayAgain = () => {
    if (phase === 'success') {
      setRound(prev => prev + 1);
    } else {
      setRound(1);
      setWinStreak(0);
    }
    startGame();
  };

  const gridSize = getGridSize();

  return (
    <Card className="p-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
          <Eye className="w-6 h-6" />
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {phase === 'idle' && (
        <div className="text-center space-y-4">
          <div className="p-6 bg-muted/30 rounded-lg">
            <p className="text-4xl mb-4">🔮</p>
            <p className="text-muted-foreground text-sm mb-4">{t.cost}</p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Zap className="w-5 h-5" />
              {t.start}
            </Button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="space-y-4">
          {/* Header stats */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t.target}:</span>
              <span className="text-3xl bg-primary/10 px-3 py-1 rounded-lg border border-primary/30">
                {targetGlyph}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                {t.found}: {foundCount}/{targetCount}
              </Badge>
              <Badge variant={timeLeft <= 3 ? 'destructive' : 'secondary'} className="gap-1">
                <Timer className="w-3 h-3" />
                {timeLeft}s
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <Progress value={(foundCount / targetCount) * 100} className="h-2" />

          {/* Grid */}
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              maxWidth: `${gridSize * 52}px`,
            }}
          >
            {grid.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={cell.found}
                className={`
                  aspect-square rounded-md text-lg sm:text-xl flex items-center justify-center
                  border transition-all duration-150 select-none
                  ${cell.found
                    ? 'bg-primary/20 border-primary/40 scale-90 opacity-60'
                    : 'bg-card hover:bg-muted/50 border-border hover:border-primary/30 hover:scale-105 cursor-pointer active:scale-95'
                  }
                `}
              >
                {cell.glyph}
              </button>
            ))}
          </div>

          {/* Feedback flash */}
          {lastClickCorrect !== null && (
            <div className={`text-center text-sm font-bold ${lastClickCorrect ? 'text-primary' : 'text-destructive'}`}>
              {lastClickCorrect ? '✓' : '✗ -1s'}
            </div>
          )}

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t.round}: {round}</span>
            <span>{t.streak}: {winStreak}🔥</span>
            <span>{t.reward}: {reward} 🪙</span>
          </div>
        </div>
      )}

      {(phase === 'success' || phase === 'failed') && (
        <div className="text-center space-y-4">
          <div className={`p-6 rounded-lg ${phase === 'success' ? 'bg-primary/10 border border-primary/30' : 'bg-destructive/10 border border-destructive/30'}`}>
            {phase === 'success' ? (
              <>
                <Trophy className="w-12 h-12 mx-auto mb-3 text-primary" />
                <p className="text-xl font-bold text-primary">{t.success}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  +{reward} 🪙 | {t.streak}: {winStreak}🔥
                </p>
              </>
            ) : (
              <>
                <Timer className="w-12 h-12 mx-auto mb-3 text-destructive" />
                <p className="text-xl font-bold text-destructive">{t.failed}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ru' ? 'Серия сброшена' : 'Streak reset'}
                </p>
              </>
            )}
          </div>
          <Button onClick={handlePlayAgain} size="lg" className="gap-2">
            <Zap className="w-5 h-5" />
            {t.playAgain}
          </Button>
        </div>
      )}
    </Card>
  );
}
