import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Crystal } from '@/types/game';
import { Landmark, Dices, Zap, Route, Brain, Palette, Target, Eclipse } from 'lucide-react';
import { ShellGame } from '@/components/temple/ShellGame';
import { CrystalClicker } from '@/components/temple/CrystalClicker';
import { TwoRoads } from '@/components/temple/TwoRoads';
import { MemoryGame } from '@/components/temple/MemoryGame';
import { ColorRoulette } from '@/components/temple/ColorRoulette';
import { QuickDraw } from '@/components/temple/QuickDraw';
import { NovaCollapse } from '@/components/temple/NovaCollapse';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

export type MiniGameId = 'menu' | 'shell' | 'clicker' | 'tworoads' | 'memory' | 'roulette' | 'quickdraw' | 'nova';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Choose a game of fate',
    shellTitle: 'Shell Game',
    shellDesc: 'Track the rune under shuffling cups. Win: crystal + 50% bonus.',
    clickerTitle: 'Crystal Clicker',
    clickerDesc: 'Tap fast enough to charge the crystal. Win: crystal + 30% bonus.',
    tworoadsTitle: 'Two Roads',
    tworoadsDesc: 'Pick one of two paths — 50/50 chance. Win: crystal + 10% bonus.',
    memoryTitle: 'Memory',
    memoryDesc: 'Memorize the pattern and reproduce it. Win: crystal + 40% bonus.',
    rouletteTitle: 'Color Roulette',
    rouletteDesc: 'Stop the wheel near your crystal\'s color. Win: up to 60% bonus.',
    quickdrawTitle: 'Quick Draw',
    quickdrawDesc: 'React to the signal ASAP. False start = loss. Win: 10-50% bonus.',
    novaTitle: 'Nova Collapse',
    novaDesc: 'Time the shrinking ring to match the circle. Win: up to 55% bonus.',
    comingSoon: 'More games coming soon...',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Выбери игру судьбы',
    shellTitle: 'Стаканчики',
    shellDesc: 'Следи за руной под стаканами. Победа: кристалл + 50% бонус.',
    clickerTitle: 'Кликер кристаллов',
    clickerDesc: 'Нажимай достаточно быстро. Победа: кристалл + 30% бонус.',
    tworoadsTitle: 'Два Пути',
    tworoadsDesc: 'Выбери одну из двух дорог — шанс 50/50. Победа: кристалл + 10% бонус.',
    memoryTitle: 'Память',
    memoryDesc: 'Запомни узор и воспроизведи. Победа: кристалл + 40% бонус.',
    rouletteTitle: 'Рулетка цветов',
    rouletteDesc: 'Останови колесо рядом с цветом кристалла. До 60% бонус.',
    quickdrawTitle: 'Реакция',
    quickdrawDesc: 'Среагируй на сигнал. Фальстарт = потеря. Победа: 10-50% бонус.',
    novaTitle: 'Коллапс Новы',
    novaDesc: 'Попади в момент совпадения кольца с кругом. До 55% бонус.',
    comingSoon: 'Скоро больше игр...',
  },
};

const MINI_GAMES: { id: MiniGameId; icon: typeof Dices; titleKey: keyof typeof translations.en; descKey: keyof typeof translations.en }[] = [
  { id: 'shell', icon: Dices, titleKey: 'shellTitle', descKey: 'shellDesc' },
  { id: 'clicker', icon: Zap, titleKey: 'clickerTitle', descKey: 'clickerDesc' },
  { id: 'tworoads', icon: Route, titleKey: 'tworoadsTitle', descKey: 'tworoadsDesc' },
  { id: 'memory', icon: Brain, titleKey: 'memoryTitle', descKey: 'memoryDesc' },
  { id: 'roulette', icon: Palette, titleKey: 'rouletteTitle', descKey: 'rouletteDesc' },
  { id: 'quickdraw', icon: Target, titleKey: 'quickdrawTitle', descKey: 'quickdrawDesc' },
  { id: 'nova', icon: Eclipse, titleKey: 'novaTitle', descKey: 'novaDesc' },
];

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [currentGame, setCurrentGame] = useState<MiniGameId>('menu');
  const t = translations[language];

  const goBack = () => setCurrentGame('menu');
  const gameProps = { crystals, coins, onEarnCoins, onConsumeCrystal, onBack: goBack, language };

  if (currentGame === 'shell') return <ShellGame {...gameProps} />;
  if (currentGame === 'clicker') return <CrystalClicker {...gameProps} />;
  if (currentGame === 'tworoads') return <TwoRoads {...gameProps} />;
  if (currentGame === 'memory') return <MemoryGame {...gameProps} />;
  if (currentGame === 'roulette') return <ColorRoulette {...gameProps} />;
  if (currentGame === 'quickdraw') return <QuickDraw {...gameProps} />;

  // Menu
  return (
    <Card className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
          <Landmark className="w-6 h-6" />
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MINI_GAMES.map(game => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => setCurrentGame(game.id)}
              className="group p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-left flex flex-col gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t[game.titleKey]}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t[game.descKey]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
