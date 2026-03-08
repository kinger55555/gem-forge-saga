import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Crystal } from '@/types/game';
import { Landmark, Dices, Zap, Brain } from 'lucide-react';
import { ShellGame } from '@/components/temple/ShellGame';
import { CrystalClicker } from '@/components/temple/CrystalClicker';
import { Singularity } from '@/components/temple/Singularity';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

export type MiniGameId = 'menu' | 'shell' | 'clicker' | 'singularity';

const translations = {
  en: {
    title: 'The Temple',
    subtitle: 'Choose a game of fate',
    shellTitle: 'Shell Game',
    shellDesc: 'Track the rune under shuffling cups. Win: crystal + 50% bonus.',
    clickerTitle: 'Crystal Clicker',
    clickerDesc: 'Tap fast enough to charge the crystal. Win: crystal + 30% bonus.',
    singularityTitle: 'Singularity',
    singularityDesc: 'Survive 5 phases of timing mastery. Win: crystal + 70% bonus.',
    comingSoon: 'More games coming soon...',
  },
  ru: {
    title: 'Храм',
    subtitle: 'Выбери игру судьбы',
    shellTitle: 'Стаканчики',
    shellDesc: 'Следи за руной под стаканами. Победа: кристалл + 50% бонус.',
    clickerTitle: 'Кликер кристаллов',
    clickerDesc: 'Нажимай достаточно быстро. Победа: кристалл + 30% бонус.',
    singularityTitle: 'Сингулярность',
    singularityDesc: 'Пройди 5 фаз тайминга. Победа: кристалл + 70% бонус.',
    comingSoon: 'Скоро больше игр...',
  },
};

const MINI_GAMES: { id: MiniGameId; icon: typeof Dices; titleKey: keyof typeof translations.en; descKey: keyof typeof translations.en }[] = [
  { id: 'shell', icon: Dices, titleKey: 'shellTitle', descKey: 'shellDesc' },
  { id: 'clicker', icon: Zap, titleKey: 'clickerTitle', descKey: 'clickerDesc' },
  { id: 'singularity', icon: Brain, titleKey: 'singularityTitle', descKey: 'singularityDesc' },
];

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [currentGame, setCurrentGame] = useState<MiniGameId>('menu');
  const t = translations[language];

  const goBack = () => setCurrentGame('menu');

  if (currentGame === 'shell') {
    return <ShellGame crystals={crystals} coins={coins} onEarnCoins={onEarnCoins} onConsumeCrystal={onConsumeCrystal} onBack={goBack} language={language} />;
  }
  if (currentGame === 'clicker') {
    return <CrystalClicker crystals={crystals} coins={coins} onEarnCoins={onEarnCoins} onConsumeCrystal={onConsumeCrystal} onBack={goBack} language={language} />;
  }
  if (currentGame === 'singularity') {
    return <Singularity crystals={crystals} coins={coins} onEarnCoins={onEarnCoins} onConsumeCrystal={onConsumeCrystal} onBack={goBack} language={language} />;
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

      <p className="text-xs text-muted-foreground text-center mt-6">{t.comingSoon}</p>
    </Card>
  );
}
