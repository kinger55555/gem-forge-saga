import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PickaxeReel } from './PickaxeReel';
import { Package, Sparkles, Crown } from 'lucide-react';
import { rollPickaxeFromCase, PICKAXE_DEFINITIONS, getRarityFromPickaxe, createPickaxeFromKey } from '@/utils/pickaxeUtils';
import { toast } from 'sonner';

interface PickaxeCaseProps {
  coins: number;
  onOpenCase: (pickaxe: { type: 'normal' | 'legendary'; name: string; used: boolean; pickaxeKey: string }) => void;
  language?: 'en' | 'ru';
}

export function PickaxeCase({ coins, onOpenCase, language = 'ru' }: PickaxeCaseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningPickaxe, setWinningPickaxe] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  
  const casePrice = 500;
  const canAfford = coins >= casePrice;

  const translations = {
    en: {
      title: 'Pickaxe Case',
      description: 'Open to get a random pickaxe!',
      open: 'Open Case',
      opening: 'Opening...',
      youGot: 'You got:',
      close: 'Close',
      notEnoughCoins: 'Not enough coins!'
    },
    ru: {
      title: 'Кейс с кирками',
      description: 'Откройте, чтобы получить случайную кирку!',
      open: 'Открыть кейс',
      opening: 'Открываем...',
      youGot: 'Вы получили:',
      close: 'Закрыть',
      notEnoughCoins: 'Недостаточно монет!'
    }
  };

  const t = translations[language];

  const handleOpenCase = async () => {
    if (!canAfford) {
      toast.error(t.notEnoughCoins);
      return;
    }

    // Get seed from URL token or generate random
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const seed = token ? parseInt(token, 36) : Math.floor(Math.random() * 1000000);
    
    const pickedPickaxe = rollPickaxeFromCase(seed);
    setWinningPickaxe(pickedPickaxe);
    setIsModalOpen(true);
    setIsSpinning(true);
    setShowResult(false);
  };

  const handleSpinComplete = (pickaxe: string) => {
    setIsSpinning(false);
    setShowResult(true);
    
    // Create pickaxe object and call parent callback
    const pickaxeData = createPickaxeFromKey(pickaxe);
    onOpenCase(pickaxeData);
    
    // Play sound effects based on rarity
    const rarity = getRarityFromPickaxe(pickaxe);
    if (rarity === 'legendary') {
      toast.success(`🎉 LEGENDARY! ${PICKAXE_DEFINITIONS[pickaxe].name}`, { 
        duration: 6000,
        style: { 
          background: 'hsl(var(--rarity-legendary))',
          color: 'hsl(var(--rarity-legendary-foreground))'
        }
      });
    } else {
      toast.success(`${PICKAXE_DEFINITIONS[pickaxe].name} (${rarity})`, { duration: 4000 });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSpinning(false);
    setShowResult(false);
    setWinningPickaxe('');
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center border-2 border-primary/30">
              <Package className="w-10 h-10 text-primary" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-accent animate-sparkle" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{t.title}</h3>
            <p className="text-muted-foreground text-sm">{t.description}</p>
            <p className="text-lg font-semibold text-primary">{casePrice} coins</p>
          </div>

          <Button
            onClick={handleOpenCase}
            disabled={!canAfford}
            size="lg"
            className="w-full gap-2"
          >
            <Package className="w-5 h-5" />
            {t.open}
          </Button>
          
          {!canAfford && (
            <p className="text-destructive text-sm">{t.notEnoughCoins}</p>
          )}
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{t.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <PickaxeReel
              winningPickaxe={winningPickaxe}
              onSpinComplete={handleSpinComplete}
              isSpinning={isSpinning}
            />
            
            {showResult && (
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-rarity-legendary" />
                  <h3 className="text-xl font-bold">{t.youGot}</h3>
                  <Crown className="w-6 h-6 text-rarity-legendary" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-primary">
                    {PICKAXE_DEFINITIONS[winningPickaxe]?.name}
                  </h4>
                  <p className={`
                    text-lg font-semibold
                    ${getRarityFromPickaxe(winningPickaxe) === 'legendary' ? 'text-rarity-legendary' : ''}
                    ${getRarityFromPickaxe(winningPickaxe) === 'epic' ? 'text-rarity-rare' : ''}
                    ${getRarityFromPickaxe(winningPickaxe) === 'rare' ? 'text-rarity-uncommon' : ''}
                    ${getRarityFromPickaxe(winningPickaxe) === 'common' ? 'text-rarity-common' : ''}
                  `}>
                    {getRarityFromPickaxe(winningPickaxe).charAt(0).toUpperCase() + 
                     getRarityFromPickaxe(winningPickaxe).slice(1)}
                  </p>
                  <p className="text-muted-foreground">
                    {PICKAXE_DEFINITIONS[winningPickaxe]?.effect}
                  </p>
                </div>
                
                <Button onClick={handleCloseModal} size="lg" className="mt-4">
                  {t.close}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}