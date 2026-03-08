import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crystal } from '@/types/game';
import { Dice } from '@/types/dice';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Flame } from 'lucide-react';

interface CrystalSmelterProps {
  crystals: Crystal[];
  onSmelt: (crystalId: string, tier: number, color: string) => void;
  language: 'en' | 'ru';
}

const t = {
  en: {
    title: 'Smelt Crystal into Die',
    subtitle: 'Select a crystal to forge into a die',
    smelt: 'Smelt',
    noCrystals: 'No crystals to smelt',
    tier: 'Tier',
    artifact: 'Artifact',
  },
  ru: {
    title: 'Переплавка кристалла в кубик',
    subtitle: 'Выбери кристалл для переплавки',
    smelt: 'Переплавить',
    noCrystals: 'Нет кристаллов для переплавки',
    tier: 'Тир',
    artifact: 'Артефакт',
  },
};

const faceIcons: Record<string, string> = {
  sword: '⚔️', shield: '🛡️', tree: '🌳', rot: '💀',
};

export function CrystalSmelter({ crystals, onSmelt, language }: CrystalSmelterProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const l = t[language];

  const selected = crystals.find(c => c.id === selectedId);
  const resultTier = selected ? Math.min(selected.rarity + 1, 10) : 0;

  const handleSmelt = () => {
    if (!selected) return;
    onSmelt(selected.id, resultTier, selected.color);
    setSelectedId(null);
  };

  if (crystals.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{l.noCrystals}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">{l.title}</h3>
        <p className="text-sm text-muted-foreground">{l.subtitle}</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {crystals.map(c => {
          const isSelected = selectedId === c.id;
          const tier = Math.min(c.rarity + 1, 10);
          return (
            <Card
              key={c.id}
              className={`p-2 cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-primary scale-105' : ''}`}
              onClick={() => setSelectedId(isSelected ? null : c.id)}
            >
              <div
                className="w-full aspect-square rounded-lg mb-1"
                style={{ backgroundColor: c.color }}
              />
              <p className="text-[10px] text-center font-semibold truncate">
                {tier === 10 ? (language === 'ru' ? 'Артф.' : 'Artf.') : `T${tier}`}
              </p>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-3">
          <Card className="p-4 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: selected.color }}
            >
              {resultTier === 10 ? '★' : `T${resultTier}`}
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {getRarityName(selected.rarity, language)} → {resultTier === 10 ? l.artifact : `${l.tier} ${resultTier}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Цвет кубика будет цветом кристалла' : 'Die color will match crystal color'}
              </p>
            </div>
          </Card>
          <Button onClick={handleSmelt} className="w-full gap-2">
            <Flame className="w-4 h-4" />
            {l.smelt}
          </Button>
        </div>
      )}
    </div>
  );
}
