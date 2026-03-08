import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dice, DICE_TIERS } from '@/types/dice';
import { Dices } from 'lucide-react';

interface DiceInventoryProps {
  dice: Dice[];
  selectedIds?: string[];
  onSelectDie?: (die: Dice) => void;
  maxSelect?: number;
  language: 'en' | 'ru';
}

const t = {
  en: { title: 'Your Dice', empty: 'No dice yet. Smelt crystals to create dice!', tier: 'T', selected: 'selected' },
  ru: { title: 'Твои кубики', empty: 'Кубиков пока нет. Переплавь кристаллы!', tier: 'Т', selected: 'выбрано' },
};

const faceIcons: Record<string, string> = {
  sword: '⚔️', shield: '🛡️', tree: '🌳', rot: '💀',
};

const tierColors: Record<number, string> = {
  1: 'hsl(var(--rarity-trash))',
  2: 'hsl(var(--rarity-normal))',
  3: 'hsl(var(--rarity-rare))',
  4: 'hsl(var(--rarity-epic))',
  5: 'hsl(var(--rarity-mythic))',
  6: 'hsl(var(--rarity-legendary))',
  7: 'hsl(var(--rarity-insane))',
  8: 'hsl(var(--rarity-demonic))',
  9: 'hsl(var(--rarity-silent))',
};

export function DiceInventory({ dice, selectedIds = [], onSelectDie, maxSelect = 0, language }: DiceInventoryProps) {
  const l = t[language];

  // Group dice by tier
  const grouped: Record<number, Dice[]> = {};
  dice.forEach(d => {
    if (!grouped[d.tier]) grouped[d.tier] = [];
    grouped[d.tier].push(d);
  });

  const sortedTiers = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Dices className="w-5 h-5" />
          {l.title}
        </h3>
        {maxSelect > 0 && (
          <Badge variant="secondary">{selectedIds.length} / {maxSelect} {l.selected}</Badge>
        )}
      </div>

      {dice.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{l.empty}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {sortedTiers.map(tier =>
            grouped[tier].map(die => {
              const isSelected = selectedIds.includes(die.id);
              const canSelect = onSelectDie && (isSelected || selectedIds.length < maxSelect);
              const faces = DICE_TIERS[die.tier] || [];

              return (
                <Card
                  key={die.id}
                  className={`p-2 text-center cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-primary scale-105' : ''} ${!canSelect && onSelectDie ? 'opacity-50' : ''}`}
                  onClick={() => canSelect && onSelectDie?.(die)}
                >
                  <div
                    className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: tierColors[die.tier] || 'hsl(var(--muted))' }}
                  >
                    {die.tier}
                  </div>
                  <div className="flex justify-center gap-0.5 flex-wrap">
                    {faces.map((f, i) => (
                      <span key={i} className="text-xs">{faceIcons[f]}</span>
                    ))}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
