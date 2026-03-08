import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Coins, Sparkles, ArrowLeft, Trophy, X, Eye, EyeOff, Zap, Brain } from 'lucide-react';

interface SingularityProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  onBack: () => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'Singularity',
    subtitle: 'Survive 5 phases of pure skill',
    selectCrystal: 'Select a crystal to offer',
    noCrystals: 'You need crystals to play',
    back: 'Back',
    worth: 'Worth',
    bonus: 'Bonus',
    playAgain: 'Try another crystal',
    phase: 'Phase',
    tap: 'TAP!',
    won: 'You survived the Singularity!',
    lost: 'Destroyed by the Singularity...',
    phases: [
      'The Vise — Hit the narrow zone',
      'Blindness — Tap in the dark',
      'Onslaught — Triple speed',
      'The Needle — Perfect precision',
      'Judgment — Trust the rhythm',
    ],
    getReady: 'Get ready...',
  },
  ru: {
    title: 'Сингулярность',
    subtitle: 'Пройди 5 фаз чистого скилла',
    selectCrystal: 'Выбери кристалл для подношения',
    noCrystals: 'Тебе нужны кристаллы чтобы играть',
    back: 'Назад',
    worth: 'Стоимость',
    bonus: 'Бонус',
    playAgain: 'Попробовать другой кристалл',
    phase: 'Фаза',
    tap: 'ЖМИИ!',
    won: 'Ты пережил Сингулярность!',
    lost: 'Уничтожен Сингулярностью...',
    phases: [
      'Тиски — Попади в узкую зону',
      'Слепота — Жми в темноте',
      'Натиск — Тройная скорость',
      'Игла — Идеальная точность',
      'Суд — Доверься ритму',
    ],
    getReady: 'Приготовься...',
  },
};

type Phase = 'select' | 'playing' | 'result';

interface PhaseConfig {
  barSpeed: number;       // ms for full sweep
  zoneWidth: number;      // % of bar width for target zone
  isDark: boolean;        // hide the bar indicator
  isBlindTap: boolean;    // hide everything, rhythm-based
  attempts: number;       // how many taps needed
}

function getPhaseConfigs(rarity: number): PhaseConfig[] {
  const diff = rarity <= 2 ? 1 : rarity <= 5 ? 1.3 : rarity <= 7 ? 1.6 : 2;
  return [
    { barSpeed: 1200 / diff, zoneWidth: 20 / diff, isDark: false, isBlindTap: false, attempts: 1 },
    { barSpeed: 1400 / diff, zoneWidth: 22 / diff, isDark: true, isBlindTap: false, attempts: 1 },
    { barSpeed: 500 / diff, zoneWidth: 18 / diff, isDark: false, isBlindTap: false, attempts: 2 },
    { barSpeed: 1600 / diff, zoneWidth: 8 / diff, isDark: false, isBlindTap: false, attempts: 1 },
    { barSpeed: 1200 / diff, zoneWidth: 20 / diff, isDark: false, isBlindTap: true, attempts: 1 },
  ];
}

export function Singularity({ crystals, coins, onEarnCoins, onConsumeCrystal, onBack, language }: SingularityProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [barPosition, setBarPosition] = useState(0); // 0-100
  const [zoneStart, setZoneStart] = useState(40);
  const [won, setWon] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [phaseConfigs, setPhaseConfigs] = useState<PhaseConfig[]>([]);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const directionRef = useRef(1);
  const t = translations[language];

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const startGame = (crystal: Crystal) => {
    setSelectedCrystal(crystal);
    setWon(false);
    setCurrentPhaseIdx(0);
    setCurrentAttempt(0);
    const configs = getPhaseConfigs(crystal.rarity);
    setPhaseConfigs(configs);
    setPhase('playing');
    startPhase(configs, 0);
  };

  const startPhase = (configs: PhaseConfig[], idx: number) => {
    setIsTransitioning(true);
    setCurrentPhaseIdx(idx);
    setCurrentAttempt(0);

    // Random zone position
    const config = configs[idx];
    const zs = 10 + Math.random() * (80 - config.zoneWidth);
    setZoneStart(zs);

    setTimeout(() => {
      setIsTransitioning(false);
      startBarAnimation(configs[idx].barSpeed);
    }, 1500);
  };

  const startBarAnimation = (speed: number) => {
    startTimeRef.current = performance.now();
    directionRef.current = 1;
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const cycleTime = speed;
      const progress = (elapsed % (cycleTime * 2)) / cycleTime;
      const pos = progress <= 1 ? progress * 100 : (2 - progress) * 100;
      setBarPosition(pos);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const handleTap = useCallback(async () => {
    if (phase !== 'playing' || isTransitioning || !selectedCrystal) return;

    const config = phaseConfigs[currentPhaseIdx];
    const inZone = barPosition >= zoneStart && barPosition <= zoneStart + config.zoneWidth;

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;

    // Flash feedback
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (!inZone) {
      // Failed
      setWon(false);
      setPhase('result');
      await onConsumeCrystal(selectedCrystal.id);
      return;
    }

    const nextAttempt = currentAttempt + 1;
    if (nextAttempt < config.attempts) {
      // More attempts needed in this phase
      setCurrentAttempt(nextAttempt);
      const zs = 10 + Math.random() * (80 - config.zoneWidth);
      setZoneStart(zs);
      startBarAnimation(config.barSpeed);
      return;
    }

    // Phase cleared
    const nextPhase = currentPhaseIdx + 1;
    if (nextPhase >= phaseConfigs.length) {
      // Won!
      setWon(true);
      setPhase('result');
      const bonus = Math.floor(selectedCrystal.price * 0.7);
      await onEarnCoins(bonus);
    } else {
      startPhase(phaseConfigs, nextPhase);
    }
  }, [phase, isTransitioning, barPosition, zoneStart, currentPhaseIdx, currentAttempt, phaseConfigs, selectedCrystal, onEarnCoins, onConsumeCrystal]);

  const resetGame = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPhase('select');
    setSelectedCrystal(null);
    setBarPosition(0);
  };

  // === RENDERS ===

  if (crystals.length === 0 && phase === 'select') {
    return (
      <Card className="p-8 text-center">
        <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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

        {/* Phase descriptions */}
        <div className="mb-6 space-y-2">
          {t.phases.map((desc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              {desc}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center mb-4">{t.selectCrystal}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
          {crystals.map(crystal => {
            const rarityColor = getRarityColor(crystal.rarity);
            const bonus = Math.floor(crystal.price * 0.7);
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
  const bonus = Math.floor(selectedCrystal.price * 0.7);
  const config = phaseConfigs[currentPhaseIdx] || phaseConfigs[0];

  // Playing / result
  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Flash overlay */}
      {showFlash && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-foreground/20" />
      )}

      {/* Phase-specific screen shake */}
      <div className={`relative z-10 ${currentPhaseIdx === 2 && !isTransitioning && phase === 'playing' ? 'animate-[insane-shake_0.1s_infinite]' : ''}`}>
        {/* Header */}
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

        {/* Phase indicator */}
        {phase === 'playing' && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-1 mb-2">
              {phaseConfigs.map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                    i < currentPhaseIdx ? 'bg-primary' :
                    i === currentPhaseIdx ? 'bg-primary animate-pulse' :
                    'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm font-medium text-muted-foreground">
              {isTransitioning ? t.getReady : `${t.phase} ${currentPhaseIdx + 1}: ${t.phases[currentPhaseIdx]?.split('—')[0]}`}
            </p>
          </div>
        )}

        {/* Timing bar */}
        {phase === 'playing' && !isTransitioning && (
          <div className="mb-8">
            <div
              className="relative w-full h-16 rounded-xl border-2 border-border overflow-hidden cursor-pointer select-none"
              onClick={handleTap}
              style={{
                backgroundColor: config.isDark ? 'hsl(var(--background))' : 'hsl(var(--muted))',
              }}
            >
              {/* Target zone - hidden in blind tap mode */}
              {!config.isBlindTap && (
                <div
                  className="absolute top-0 h-full rounded transition-opacity duration-300"
                  style={{
                    left: `${zoneStart}%`,
                    width: `${config.zoneWidth}%`,
                    backgroundColor: 'hsl(142 76% 36% / 0.3)',
                    borderLeft: '2px solid hsl(142 76% 36% / 0.6)',
                    borderRight: '2px solid hsl(142 76% 36% / 0.6)',
                    opacity: config.isDark ? 0.15 : 1,
                  }}
                />
              )}

              {/* Moving indicator - hidden in dark mode */}
              <div
                className="absolute top-0 h-full w-1 rounded-full transition-none"
                style={{
                  left: `${barPosition}%`,
                  backgroundColor: config.isDark ? 'hsl(var(--foreground) / 0.1)' : 'hsl(var(--primary))',
                  boxShadow: config.isDark ? 'none' : '0 0 10px hsl(var(--primary) / 0.5)',
                }}
              />

              {/* Dark mode strobe flashes */}
              {config.isDark && !config.isBlindTap && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    animation: 'flicker 0.8s infinite',
                    backgroundColor: 'hsl(var(--foreground) / 0.03)',
                  }}
                />
              )}

              {/* Tap instruction */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-lg font-bold ${config.isDark ? 'text-foreground/10' : 'text-foreground/30'}`}>
                  {t.tap}
                </span>
              </div>
            </div>

            {/* Phase icon */}
            <div className="flex justify-center mt-3">
              {currentPhaseIdx === 0 && <Zap className="w-5 h-5 text-primary" />}
              {currentPhaseIdx === 1 && <EyeOff className="w-5 h-5 text-muted-foreground" />}
              {currentPhaseIdx === 2 && <Zap className="w-5 h-5 text-destructive animate-pulse" />}
              {currentPhaseIdx === 3 && <Eye className="w-5 h-5 text-primary" />}
              {currentPhaseIdx === 4 && <Brain className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        )}

        {/* Transition screen */}
        {phase === 'playing' && isTransitioning && (
          <div className="py-16 text-center animate-pulse">
            <div className="text-4xl mb-4">
              {currentPhaseIdx === 0 && '⚡'}
              {currentPhaseIdx === 1 && '🌑'}
              {currentPhaseIdx === 2 && '🔥'}
              {currentPhaseIdx === 3 && '🎯'}
              {currentPhaseIdx === 4 && '👁️'}
            </div>
            <p className="text-lg font-bold text-foreground">{t.phases[currentPhaseIdx]}</p>
            <p className="text-sm text-muted-foreground mt-2">{t.getReady}</p>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="text-center space-y-4 animate-fade-in py-8">
            <div className={`text-6xl ${won ? '' : 'grayscale opacity-50'}`}>
              {won ? '✨' : '💀'}
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
            <p className="text-xs text-muted-foreground">
              {t.phase} {currentPhaseIdx + 1}/5
            </p>
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
