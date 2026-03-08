import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Crystal } from '@/types/game';
import { Landmark, Dices, Zap } from 'lucide-react';
import { ShellGame } from '@/components/temple/ShellGame';
import { CrystalClicker } from '@/components/temple/CrystalClicker';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

type MiniGame = 'menu' | 'shell' | 'clicker';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Choose a game of fate',
    shellTitle: 'Shell Game',
    shellDesc: 'Track the rune under shuffling cups. Win: crystal back + 50% bonus.',
    clickerTitle: 'Crystal Clicker',
    clickerDesc: 'Tap fast enough to charge the crystal. Win: crystal back + 30% bonus.',
    comingSoon: 'More games coming soon...',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Выбери игру судьбы',
    shellTitle: 'Стаканчики',
    shellDesc: 'Следи за руной под стаканами. Победа: кристалл назад + 50% бонус.',
    clickerTitle: 'Кликер кристаллов',
    clickerDesc: 'Нажимай достаточно быстро чтобы зарядить кристалл. Победа: кристалл назад + 30% бонус.',
    comingSoon: 'Скоро больше игр...',
  },
};

const MINI_GAMES: { id: MiniGame; icon: typeof Dices; translationKey: 'shellTitle' | 'clickerTitle'; descKey: 'shellDesc' | 'clickerDesc' }[] = [
  { id: 'shell', icon: Dices, translationKey: 'shellTitle', descKey: 'shellDesc' },
  { id: 'clicker', icon: Zap, translationKey: 'clickerTitle', descKey: 'clickerDesc' },
];

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [currentGame, setCurrentGame] = useState<MiniGame>('menu');
  const t = translations[language];

  const goBack = () => setCurrentGame('menu');

  if (currentGame === 'shell') {
    return <ShellGame crystals={crystals} coins={coins} onEarnCoins={onEarnCoins} onConsumeCrystal={onConsumeCrystal} onBack={goBack} language={language} />;
  }

  if (currentGame === 'clicker') {
    return <CrystalClicker crystals={crystals} coins={coins} onEarnCoins={onEarnCoins} onConsumeCrystal={onConsumeCrystal} onBack={goBack} language={language} />;
  }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <h3 className="text-lg font-bold text-foreground">{t[game.translationKey]}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t[game.descKey]}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">{t.comingSoon}</p>
    </Card>
  );
}
