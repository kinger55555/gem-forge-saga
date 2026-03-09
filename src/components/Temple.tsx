import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Crystal } from '@/types/game';
import { Landmark, Dices, Zap, Route, Brain, Palette, Target, Eclipse, Gauge, MousePointerClick, Lock } from 'lucide-react';
import { ShellGame } from '@/components/temple/ShellGame';
import { CrystalClicker } from '@/components/temple/CrystalClicker';
import { TwoRoads } from '@/components/temple/TwoRoads';
import { MemoryGame } from '@/components/temple/MemoryGame';
import { ColorRoulette } from '@/components/temple/ColorRoulette';
import { QuickDraw } from '@/components/temple/QuickDraw';
import { NovaCollapse } from '@/components/temple/NovaCollapse';
import { PressureHold } from '@/components/temple/PressureHold';
import { SpamRace } from '@/components/temple/SpamRace';
import { GameInfoButton } from '@/components/temple/GameInfoButton';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TempleProps {
  crystals: Crystal[];
  coins: number;
  onEarnCoins: (amount: number) => Promise<void>;
  onConsumeCrystal: (crystalId: string) => Promise<void>;
  language: 'en' | 'ru';
}

export type MiniGameId = 'menu' | 'shell' | 'clicker' | 'tworoads' | 'memory' | 'roulette' | 'quickdraw' | 'nova' | 'pressure' | 'spam';

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
    pressureTitle: 'Pressure Hold',
    pressureDesc: 'Hold the button — release before the bar explodes! Win: 10-50% bonus.',
    spamTitle: 'Spam Race',
    spamDesc: 'Click as fast as you can in 3 seconds! Win: 10-45% bonus.',
    comingSoon: 'More games coming soon...',
    blocked: 'Blocked',
    gameBlocked: 'This game is currently blocked by admin',
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
    pressureTitle: 'Давление',
    pressureDesc: 'Держи кнопку — отпусти до взрыва шкалы! Победа: 10-50% бонус.',
    spamTitle: 'Спам-гонка',
    spamDesc: 'Кликай как можно быстрее за 3 секунды! Победа: 10-45% бонус.',
    comingSoon: 'Скоро больше игр...',
    blocked: 'Заблокировано',
    gameBlocked: 'Эта игра заблокирована администратором',
  },
};

const GAME_RULES: Record<string, { en: string; ru: string }> = {
  shell: {
    en: '1. Select a crystal to wager\n2. Watch which cup hides the glowing rune\n3. Cups shuffle — track the right one\n4. Pick the correct cup\n\n✅ Win: Keep crystal + 50% coin bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Запомни, под каким стаканом светящаяся руна\n3. Стаканы перемешаются — следи\n4. Выбери правильный стакан\n\n✅ Победа: Кристалл + 50% бонус монет\n❌ Проигрыш: Кристалл уничтожен',
  },
  clicker: {
    en: '1. Select a crystal to charge\n2. Tap as fast as possible to reach the target\n3. Higher rarity = more taps needed\n\n✅ Win: Keep crystal + 30% coin bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для зарядки\n2. Жми как можно быстрее до цели\n3. Выше редкость = больше нажатий\n\n✅ Победа: Кристалл + 30% бонус монет\n❌ Проигрыш: Кристалл уничтожен',
  },
  tworoads: {
    en: '1. Select a crystal to wager\n2. Choose left or right path\n3. 50/50 chance of winning\n\n✅ Win: Keep crystal + 10% coin bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Выбери левый или правый путь\n3. Шанс 50/50\n\n✅ Победа: Кристалл + 10% бонус монет\n❌ Проигрыш: Кристалл уничтожен',
  },
  memory: {
    en: '1. Select a crystal to wager\n2. Memorize the highlighted pattern\n3. Reproduce it from memory\n\n✅ Win: Keep crystal + 40% coin bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Запомни подсвеченный узор\n3. Воспроизведи по памяти\n\n✅ Победа: Кристалл + 40% бонус монет\n❌ Проигрыш: Кристалл уничтожен',
  },
  roulette: {
    en: '1. Select a crystal to wager\n2. A color wheel spins — stop it!\n3. Closer to your crystal\'s color = bigger bonus\n\n✅ Win (>30% match): Keep crystal + up to 60% bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Цветовое колесо крутится — останови!\n3. Ближе к цвету кристалла = больше бонус\n\n✅ Победа (>30% совпадение): Кристалл + до 60% бонуса\n❌ Проигрыш: Кристалл уничтожен',
  },
  quickdraw: {
    en: '1. Select a crystal to wager\n2. Wait for the green signal\n3. Tap as fast as you can — don\'t false start!\n\n✅ Win (<500ms): Keep crystal + 10-50% bonus\n❌ Lose (too slow or false start): Crystal destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Дождись зелёного сигнала\n3. Нажми как можно быстрее — без фальстартов!\n\n✅ Победа (<500мс): Кристалл + 10-50% бонуса\n❌ Проигрыш (медленно или фальстарт): Кристалл уничтожен',
  },
  nova: {
    en: '1. Select a crystal to wager\n2. A ring shrinks toward the center circle\n3. Tap when the ring perfectly aligns\n\n✅ Win (>30% accuracy): Keep crystal + up to 55% bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Кольцо сжимается к центру\n3. Нажми при идеальном совпадении\n\n✅ Победа (>30% точность): Кристалл + до 55% бонуса\n❌ Проигрыш: Кристалл уничтожен',
  },
  pressure: {
    en: '1. Select a crystal to wager\n2. Hold the button to fill the bar\n3. Release before it explodes!\n4. Higher fill = bigger bonus\n\n✅ Win (released in time): Keep crystal + 10-50% bonus\n❌ Lose (exploded): Crystal destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Зажми кнопку — шкала заполняется\n3. Отпусти до взрыва!\n4. Больше заполнение = больше бонус\n\n✅ Победа (отпустил вовремя): Кристалл + 10-50% бонуса\n❌ Проигрыш (взрыв): Кристалл уничтожен',
  },
  spam: {
    en: '1. Select a crystal to wager\n2. Click steadily for 6 seconds\n3. Keep CPS above 5 — stay consistent!\n\n✅ Win (≥40% consistency): Keep crystal + 10-45% bonus\n❌ Lose: Crystal is destroyed',
    ru: '1. Выбери кристалл для ставки\n2. Кликай стабильно 6 секунд\n3. Держи CPS выше 5 — будь ровным!\n\n✅ Победа (≥40% стабильность): Кристалл + 10-45% бонуса\n❌ Проигрыш: Кристалл уничтожен',
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
  { id: 'pressure', icon: Gauge, titleKey: 'pressureTitle', descKey: 'pressureDesc' },
  { id: 'spam', icon: MousePointerClick, titleKey: 'spamTitle', descKey: 'spamDesc' },
];

export function Temple({ crystals, coins, onEarnCoins, onConsumeCrystal, language }: TempleProps) {
  const [currentGame, setCurrentGame] = useState<MiniGameId>('menu');
  const [blockedGames, setBlockedGames] = useState<Set<string>>(new Set());
  const t = translations[language];

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('game_stats').select('game_id, blocked');
      if (data) {
        setBlockedGames(new Set(data.filter(g => g.blocked).map(g => g.game_id)));
      }
    })();
  }, [currentGame]);

  const handleSelectGame = (gameId: MiniGameId) => {
    if (blockedGames.has(gameId)) {
      toast.error(t.gameBlocked);
      return;
    }
    setCurrentGame(gameId);
  };

  const goBack = () => setCurrentGame('menu');
  const gameProps = { crystals, coins, onEarnCoins, onConsumeCrystal, onBack: goBack, language };

  if (currentGame === 'shell') return <ShellGame {...gameProps} />;
  if (currentGame === 'clicker') return <CrystalClicker {...gameProps} />;
  if (currentGame === 'tworoads') return <TwoRoads {...gameProps} />;
  if (currentGame === 'memory') return <MemoryGame {...gameProps} />;
  if (currentGame === 'roulette') return <ColorRoulette {...gameProps} />;
  if (currentGame === 'quickdraw') return <QuickDraw {...gameProps} />;
  if (currentGame === 'nova') return <NovaCollapse {...gameProps} />;
  if (currentGame === 'pressure') return <PressureHold {...gameProps} />;
  if (currentGame === 'spam') return <SpamRace {...gameProps} />;

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
          const isBlocked = blockedGames.has(game.id);
          const rules = GAME_RULES[game.id];
          return (
            <div key={game.id} className="relative">
              <button
                onClick={() => handleSelectGame(game.id)}
                className={`w-full group p-6 rounded-xl border-2 bg-card transition-all text-left flex flex-col gap-3 ${
                  isBlocked
                    ? 'border-destructive/30 opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                disabled={isBlocked}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    isBlocked ? 'bg-destructive/10' : 'bg-primary/10 group-hover:bg-primary/20'
                  }`}>
                    {isBlocked ? <Lock className="w-6 h-6 text-destructive" /> : <Icon className="w-6 h-6 text-primary" />}
                  </div>
                  {isBlocked && (
                    <Badge variant="destructive" className="text-[10px]">{t.blocked}</Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t[game.titleKey]}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t[game.descKey]}</p>
                </div>
              </button>
              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                <GameInfoButton
                  gameId={game.id}
                  title={t[game.titleKey]}
                  rules={rules ? rules[language] : ''}
                  language={language}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
