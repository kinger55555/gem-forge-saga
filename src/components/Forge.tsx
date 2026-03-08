import { Card } from '@/components/ui/card';
import { Crystal } from '@/types/game';
import { Hammer } from 'lucide-react';

interface ForgeProps {
  crystals: Crystal[];
  coins: number;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    title: 'The Forge',
    subtitle: 'Recycle crystals into cubes',
    comingSoon: 'The Forge is being built... Come back soon!',
    description: 'Here you will be able to recycle your crystals into cubes. Rarer crystals produce cubes with more properties.',
  },
  ru: {
    title: 'Кузница',
    subtitle: 'Перерабатывай кристаллы в кубики',
    comingSoon: 'Кузница строится... Возвращайся скоро!',
    description: 'Здесь можно будет перерабатывать кристаллы в кубики. Чем реже кристалл, тем больше свойств у кубика.',
  },
};

export function Forge({ crystals, coins, language }: ForgeProps) {
  const t = translations[language];

  return (
    <Card className="p-8">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Hammer className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="max-w-md mx-auto p-6 rounded-xl border-2 border-dashed border-border bg-muted/30">
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">{t.comingSoon}</p>
      </div>
    </Card>
  );
}
