import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pickaxe, Gem, Coins, Landmark, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface WelcomeTutorialProps {
  open: boolean;
  onClose: () => void;
  language: 'en' | 'ru';
}

const steps = {
  ru: [
    {
      icon: Sparkles,
      title: 'Добро пожаловать в Gem Forge Saga!',
      description: 'Добывайте уникальные кристаллы, собирайте коллекцию и зарабатывайте монеты. Давайте разберёмся, как всё устроено!',
      color: 'hsl(280, 100%, 70%)',
    },
    {
      icon: Pickaxe,
      title: 'Кирки',
      description: 'Кирки — ваш главный инструмент. Каждая кирка одноразовая и определяет редкость найденного кристалла. Чем круче кирка — тем ценнее находка!',
      color: 'hsl(210, 40%, 50%)',
    },
    {
      icon: Gem,
      title: 'Кристаллы',
      description: 'Используйте кирку, чтобы добыть кристалл. Кристаллы бывают разной редкости — от обычных до артефактных. Продавайте их за монеты или коллекционируйте!',
      color: 'hsl(160, 60%, 45%)',
    },
    {
      icon: Coins,
      title: 'Магазин',
      description: 'За монеты можно покупать новые кирки в магазине. Копите на редкие кирки — они дают шанс найти самые ценные кристаллы!',
      color: 'hsl(45, 93%, 47%)',
    },
    {
      icon: Landmark,
      title: 'Храм',
      description: 'В Храме вы можете зарабатывать монеты кликами. Заходите каждый день за ежедневными наградами. Удачи в добыче!',
      color: 'hsl(270, 70%, 55%)',
    },
  ],
  en: [
    {
      icon: Sparkles,
      title: 'Welcome to Gem Forge Saga!',
      description: 'Mine unique crystals, build your collection, and earn coins. Let\'s learn how everything works!',
      color: 'hsl(280, 100%, 70%)',
    },
    {
      icon: Pickaxe,
      title: 'Pickaxes',
      description: 'Pickaxes are your main tool. Each pickaxe is single-use and determines the rarity of the crystal you find. Better pickaxes mean rarer finds!',
      color: 'hsl(210, 40%, 50%)',
    },
    {
      icon: Gem,
      title: 'Crystals',
      description: 'Use a pickaxe to mine a crystal. Crystals come in different rarities — from common to artifact. Sell them for coins or collect them!',
      color: 'hsl(160, 60%, 45%)',
    },
    {
      icon: Coins,
      title: 'Shop',
      description: 'Spend coins to buy new pickaxes in the shop. Save up for rare pickaxes — they give you a chance to find the most valuable crystals!',
      color: 'hsl(45, 93%, 47%)',
    },
    {
      icon: Landmark,
      title: 'Temple',
      description: 'Earn coins by clicking in the Temple. Come back every day for daily rewards. Good luck mining!',
      color: 'hsl(270, 70%, 55%)',
    },
  ],
};

export function WelcomeTutorial({ open, onClose, language }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0);
  const currentSteps = steps[language];
  const current = currentSteps[step];
  const Icon = current.icon;
  const isLast = step === currentSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setStep(0); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none">
        {/* Top colored area */}
        <div
          className="flex items-center justify-center py-10 transition-colors duration-500"
          style={{ background: `linear-gradient(135deg, ${current.color}, hsl(var(--card)))` }}
        >
          <div
            className="rounded-full p-5 bg-background/20 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${current.color}` }}
          >
            <Icon className="w-12 h-12 text-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{current.description}</p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 py-2">
            {currentSteps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i === step ? current.color : 'hsl(var(--muted))',
                  transform: i === step ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={handlePrev} className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                {language === 'ru' ? 'Назад' : 'Back'}
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 gap-1"
              style={{ background: current.color }}
            >
              {isLast
                ? (language === 'ru' ? 'Начать игру!' : 'Start playing!')
                : (language === 'ru' ? 'Далее' : 'Next')}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
