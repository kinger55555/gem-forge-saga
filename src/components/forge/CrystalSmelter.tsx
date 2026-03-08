import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { Dice, CRYSTALS_PER_DICE, DICE_TIERS } from '@/types/dice';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Flame } from 'lucide-react';

interface CrystalSmelterProps {
  crystals: Crystal[];
  onSmelt: (crystalIds: string[], tier: number) => void;
  language: 'en' | 'ru';
}

const t = {
  en: {
    title: 'Smelt Crystals into Dice',
    subtitle: 'Select 3 crystals of the same rarity to forge a die',
    smelt: 'Smelt',
    noCrystals: 'No crystals to smelt',
    selected: 'selected',
    tier: 'Tier',
    faces: 'Faces',
    selectRarity: 'Choose rarity to smelt',
  },
  ru: {
    title: 'Переплавка кристаллов в кубики',
    subtitle: 'Выбери 3 кристалла одной редкости чтобы создать кубик',
    smelt: 'Переплавить',
    noCrystals: 'Нет кристаллов для переплавки',
    selected: 'выбрано',
    tier: 'Тир',
    faces: 'Грани',
    selectRarity: 'Выбери редкость для переплавки',
  },
};

export function CrystalSmelter({ crystals, onSmelt, language }: CrystalSmelterProps) {
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null);
  const l = t[language];

  // Group crystals by rarity, only show groups with >= CRYSTALS_PER_DICE
  const grouped: Record<number, Crystal[]> = {};
  crystals.forEach(c => {
    if (!grouped[c.rarity]) grouped[c.rarity] = [];
    grouped[c.rarity].push(c);
  });

  const availableRarities = Object.entries(grouped)
    .filter(([, arr]) => arr.length >= CRYSTALS_PER_DICE)
    .map(([r]) => Number(r))
    .sort((a, b) => a - b);

  const handleSmelt = () => {
    if (selectedRarity === null) return;
    const group = grouped[selectedRarity];
    if (!group || group.length < CRYSTALS_PER_DICE) return;
    const ids = group.slice(0, CRYSTALS_PER_DICE).map(c => c.id);
    const tier = Math.min(selectedRarity + 1, 9);
    onSmelt(ids, tier);
    setSelectedRarity(null);
  };

  const faceIcons: Record<string, string> = {
    sword: '⚔️', shield: '🛡️', tree: '🌳', rot: '💀',
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">{l.title}</h3>
        <p className="text-sm text-muted-foreground">{l.subtitle}</p>
      </div>

      {availableRarities.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{l.noCrystals}</p>
      ) : (
        <div className="space-y-3">
          {availableRarities.map(rarity => {
            const count = grouped[rarity].length;
            const tier = Math.min(rarity + 1, 9);
            const faces = DICE_TIERS[tier] || [];
            const isSelected = selectedRarity === rarity;

            return (
              <Card
                key={rarity}
                className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedRarity(isSelected ? null : rarity)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: getRarityColor(rarity) }}
                    />
                    <div>
                      <p className="font-semibold">{getRarityName(rarity, language)}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} / {CRYSTALS_PER_DICE} → {l.tier} {tier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {faces.map((f, i) => (
                      <span key={i} className="text-base">{faceIcons[f]}</span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedRarity !== null && (
        <Button onClick={handleSmelt} className="w-full gap-2">
          <Flame className="w-4 h-4" />
          {l.smelt} → {l.tier} {Math.min(selectedRarity + 1, 9)}
        </Button>
      )}
    </div>
  );
}
