import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pickaxe as PickaxeIcon, Zap, Crown, Shield, Gem } from 'lucide-react';
import { PICKAXE_DEFINITIONS, getRarityFromPickaxe } from '@/utils/pickaxeUtils';

interface PickaxeCaseTileProps {
  pickaxeKey: string;
  isWinning?: boolean;
}

export function PickaxeCaseTile({ pickaxeKey, isWinning }: PickaxeCaseTileProps) {
  const definition = PICKAXE_DEFINITIONS[pickaxeKey];
  const rarity = getRarityFromPickaxe(pickaxeKey);
  
  if (!definition) return null;

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Gem;
      case 'rare': return Shield;
      default: return PickaxeIcon;
    }
  };

  const Icon = getRarityIcon(rarity);

  return (
    <Card className={`
      relative p-4 w-32 h-40 flex-shrink-0 transition-all duration-300
      ${isWinning ? 'ring-4 ring-primary shadow-2xl scale-105 animate-glow-pulse' : ''}
      bg-gradient-to-br from-card to-card/80 border-2
      ${rarity === 'legendary' ? 'border-rarity-legendary bg-gradient-to-br from-rarity-legendary/20 to-card' : ''}
      ${rarity === 'epic' ? 'border-rarity-rare bg-gradient-to-br from-rarity-rare/20 to-card' : ''}
      ${rarity === 'rare' ? 'border-rarity-uncommon bg-gradient-to-br from-rarity-uncommon/20 to-card' : ''}
      ${rarity === 'common' ? 'border-rarity-common bg-gradient-to-br from-rarity-common/20 to-card' : ''}
    `}>
      <div className="flex flex-col items-center justify-between h-full">
        {/* Icon */}
        <div className={`
          relative p-2 rounded-lg flex-shrink-0
          ${rarity === 'legendary' ? 'bg-rarity-legendary/20' : ''}
          ${rarity === 'epic' ? 'bg-rarity-rare/20' : ''}  
          ${rarity === 'rare' ? 'bg-rarity-uncommon/20' : ''}
          ${rarity === 'common' ? 'bg-rarity-common/20' : ''}
        `}>
          <Icon className={`
            w-6 h-6
            ${rarity === 'legendary' ? 'text-rarity-legendary' : ''}
            ${rarity === 'epic' ? 'text-rarity-rare' : ''}
            ${rarity === 'rare' ? 'text-rarity-uncommon' : ''}
            ${rarity === 'common' ? 'text-rarity-common' : ''}
          `} />
          {rarity === 'legendary' && (
            <Zap className="absolute -top-1 -right-1 w-3 h-3 text-rarity-legendary animate-sparkle" />
          )}
        </div>

        {/* Name */}
        <div className="text-center flex-grow flex flex-col justify-center">
          <h4 className="font-medium text-xs leading-tight mb-1">
            {definition.name}
          </h4>
        </div>

        {/* Rarity Badge */}
        <Badge 
          variant="outline" 
          className={`
            text-xs px-1 py-0 border-current flex-shrink-0
            ${rarity === 'legendary' ? 'text-rarity-legendary border-rarity-legendary' : ''}
            ${rarity === 'epic' ? 'text-rarity-rare border-rarity-rare' : ''}
            ${rarity === 'rare' ? 'text-rarity-uncommon border-rarity-uncommon' : ''}
            ${rarity === 'common' ? 'text-rarity-common border-rarity-common' : ''}
          `}
        >
          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
        </Badge>
      </div>
    </Card>
  );
}