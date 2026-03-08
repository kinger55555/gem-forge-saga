import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dice, DICE_TIERS, getTierName } from '@/types/dice';
import { Dices } from 'lucide-react';

interface DiceInventoryProps {
  dice: Dice[];
  selectedIds?: string[];
  onSelectDie?: (die: Dice) => void;
  maxSelect?: number;
  language: 'en' | 'ru';
}

const t = {
  en: { title: 'Your Dice', empty: 'No dice yet. Smelt crystals to create dice!', selected: 'selected' },
  ru: { title: 'Твои кубики', empty: 'Кубиков пока нет. Переплавь кристаллы!', selected: 'выбрано' },
};

const faceIcons: Record<string, string> = {
  sword: '⚔️', shield: '🛡️', tree: '🌳', rot: '💀',
};

export function DiceInventory({ dice, selectedIds = [], onSelectDie, maxSelect = 0, language }: DiceInventoryProps) {
  const l = t[language];

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
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {[...dice].sort((a, b) => b.tier - a.tier).map(die => {
            const isSelected = selectedIds.includes(die.id);
            const canSelect = onSelectDie && (isSelected || selectedIds.length < maxSelect);
            const faces = DICE_TIERS[die.tier] || [];
            const isArtifact = die.tier === 10;

            return (
              <Card
                key={die.id}
                className={`p-2 text-center transition-all ${onSelectDie ? 'cursor-pointer hover:scale-105' : ''} ${isSelected ? 'ring-2 ring-primary scale-105' : ''} ${!canSelect && onSelectDie ? 'opacity-40' : ''} ${isArtifact ? 'ring-1 ring-yellow-400/50' : ''}`}
                onClick={() => canSelect && onSelectDie?.(die)}
              >
                <div
                  className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-sm font-bold text-white shadow-md ${isArtifact ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: die.color }}
                >
                  {isArtifact ? '★' : `T${die.tier}`}
                </div>
                <p className="text-[10px] font-medium truncate">{getTierName(die.tier, language)}</p>
                <div className="flex justify-center gap-0.5 flex-wrap mt-0.5">
                  {faces.map((f, i) => (
                    <span key={i} className="text-[10px]">{faceIcons[f]}</span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
