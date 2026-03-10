import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MiningState } from '@/types/game';
import { Hammer, Sparkles } from 'lucide-react';

interface MiningAreaProps {
  miningState: MiningState;
  onMine: () => void;
  rarityColor?: string;
  crystalColor?: string;
  canMine: boolean;
  language?: 'en' | 'ru';
}

const translations = {
  en: {
    mine: 'Mine',
    clickToMine: 'Click to start mining',
    selectPickaxe: 'Select a pickaxe to begin',
    mineButton: 'Mine',
    crystalFound: 'Crystal found!',
    showCrystal: 'Show crystal',
    collectCrystal: 'Collect crystal',
  },
  ru: {
    mine: 'Шахта',
    clickToMine: 'Кликните, чтобы начать добычу',
    selectPickaxe: 'Выберите кирку для начала',
    mineButton: 'Добывать',
    crystalFound: 'Кристалл найден!',
    showCrystal: 'Показать кристалл',
    collectCrystal: 'Забрать кристалл',
  },
};

export function MiningArea({ 
  miningState, 
  onMine, 
  rarityColor, 
  crystalColor,
  canMine,
  language = 'ru'
}: MiningAreaProps) {
  const t = translations[language];

  return (
    <Card className="relative p-8 bg-gradient-cave border-2 border-border/50 min-h-[300px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6">
        {miningState === MiningState.IDLE && (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.mine}</h2>
              <p className="text-muted-foreground">
                {canMine ? t.clickToMine : t.selectPickaxe}
              </p>
            </div>
            
            <Button
              onClick={onMine}
              disabled={!canMine}
              size="lg"
              className="relative px-8 py-4 text-lg font-semibold bg-secondary hover:bg-secondary/80 disabled:opacity-50"
            >
              <Hammer className="w-6 h-6 mr-2" />
              {t.mineButton}
            </Button>
            
            <div className="absolute top-4 left-4">
              <Sparkles className="w-4 h-4 text-primary/50 animate-sparkle" />
            </div>
            <div className="absolute bottom-4 right-4">
              <Sparkles className="w-3 h-3 text-accent/50 animate-sparkle" style={{ animationDelay: '0.5s' }} />
            </div>
          </>
        )}
        
        {miningState === MiningState.SHOWING_RARITY && (
          <div className="text-center">
            <div 
              className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-current animate-glow-pulse flex items-center justify-center"
              style={{ color: rarityColor }}
            >
              <Sparkles className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium mb-4">{t.crystalFound}</p>
            <Button
              onClick={onMine}
              size="lg"
              variant="outline"
              className="border-current"
              style={{ borderColor: rarityColor, color: rarityColor }}
            >
              {t.showCrystal}
            </Button>
          </div>
        )}
        
        {miningState === MiningState.SHOWING_CRYSTAL && crystalColor && (
          <div className="text-center">
            <div 
              className="w-32 h-32 mx-auto mb-4 rounded-lg animate-crystal-emerge shadow-crystal border-2 border-white/20 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: crystalColor, opacity: 0.8 }}
            >
              <div 
                className="absolute inset-0"
                style={{ background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)` }}
              />
              <Sparkles className="w-16 h-16 text-white/90" />
            </div>
            <Button
              onClick={onMine}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {t.collectCrystal}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
