import { useState, useCallback, useEffect } from 'react';
import { Pickaxe } from './Pickaxe';
import { MiningArea } from './MiningArea';
import { CrystalInventory } from './CrystalInventory';
import { AdminPanel } from './AdminPanel';
import { PickaxeHelp } from './PickaxeHelp';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  GameState, 
  MiningState, 
  Pickaxe as PickaxeType, 
  Crystal 
} from '@/types/game';
import { AdminState, PickaxeLink } from '@/types/admin';
import { 
  generateCrystal, 
  getRarityColor, 
  getRarityName 
} from '@/utils/crystalUtils';
import { parsePickaxeFromUrl } from '@/utils/linkUtils';
import { Plus, RotateCcw, Gift } from 'lucide-react';
import { toast } from 'sonner';

export function GameInterface() {
  const [gameState, setGameState] = useState<GameState>({
    pickaxes: [
      { id: '1', type: 'normal', name: 'Обычная кирка #1', used: false },
      { id: '2', type: 'normal', name: 'Обычная кирка #2', used: false },
      { id: '3', type: 'legendary', name: 'Легендарная кирка', used: false },
    ],
    crystals: [],
    currentPickaxe: null,
    miningState: MiningState.IDLE,
    currentCrystal: null,
    coins: 0,
  });

  const [adminState, setAdminState] = useState<AdminState>({
    isAdminMode: false,
    pickaxeLinks: [],
  });

  const activatePickaxeFromCode = useCallback((code: string) => {
    const link = adminState.pickaxeLinks.find(l => l.code === code && !l.used);
    
    if (!link) {
      toast.error('Недействительная или уже использованная ссылка на кирку!');
      return;
    }

    // Mark link as used
    setAdminState(prev => ({
      ...prev,
      pickaxeLinks: prev.pickaxeLinks.map(l => 
        l.id === link.id 
          ? { ...l, used: true, usedAt: new Date() }
          : l
      )
    }));

    // Add pickaxe to inventory
    const newPickaxe: PickaxeType = {
      id: crypto.randomUUID(),
      type: link.type,
      name: link.name,
      used: false
    };

    setGameState(prev => ({
      ...prev,
      pickaxes: [...prev.pickaxes, newPickaxe]
    }));

    toast.success(
      `🎁 Получена новая кирка: ${link.name}!`,
      { duration: 4000 }
    );
  }, [adminState.pickaxeLinks]);

  // Check for pickaxe activation on component mount
  useEffect(() => {
    const pickaxeCode = parsePickaxeFromUrl();
    if (pickaxeCode) {
      activatePickaxeFromCode(pickaxeCode);
      // Clean URL after activation
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [activatePickaxeFromCode]);

  const handleCreateLink = useCallback((link: PickaxeLink) => {
    setAdminState(prev => ({
      ...prev,
      pickaxeLinks: [...prev.pickaxeLinks, link]
    }));
  }, []);

  const handleToggleAdmin = useCallback((isAdmin: boolean) => {
    setAdminState(prev => ({
      ...prev,
      isAdminMode: isAdmin
    }));
  }, []);

  const selectPickaxe = useCallback((pickaxe: PickaxeType) => {
    if (pickaxe.used) {
      toast.error('Эта кирка уже использована!');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      currentPickaxe: pickaxe,
      miningState: MiningState.IDLE,
      currentCrystal: null
    }));
    
    toast.success(`Выбрана ${pickaxe.type === 'legendary' ? 'легендарная' : 'обычная'} кирка`);
  }, []);

  const mine = useCallback(() => {
    if (!gameState.currentPickaxe) return;

    if (gameState.miningState === MiningState.IDLE) {
      // Generate crystal and show rarity
      let crystal = generateCrystal();
      
      // For legendary pickaxe, reroll if rarity is 0
      if (gameState.currentPickaxe.type === 'legendary' && crystal.rarity === 0) {
        crystal = generateCrystal();
        // Keep rerolling until we get a non-common crystal
        while (crystal.rarity === 0) {
          crystal = generateCrystal();
        }
      }

      setGameState(prev => ({
        ...prev,
        miningState: MiningState.SHOWING_RARITY,
        currentCrystal: crystal
      }));
      
      toast.success(`Найден ${getRarityName(crystal.rarity).toLowerCase()} кристалл!`);
    } 
    else if (gameState.miningState === MiningState.SHOWING_RARITY) {
      // Show the actual crystal
      setGameState(prev => ({
        ...prev,
        miningState: MiningState.SHOWING_CRYSTAL
      }));
    }
    else if (gameState.miningState === MiningState.SHOWING_CRYSTAL && gameState.currentCrystal) {
      // Collect the crystal
      setGameState(prev => ({
        ...prev,
        crystals: [...prev.crystals, gameState.currentCrystal!],
        coins: prev.coins + gameState.currentCrystal!.price,
        pickaxes: prev.pickaxes.map(p => 
          p.id === prev.currentPickaxe!.id 
            ? { ...p, used: true }
            : p
        ),
        currentPickaxe: null,
        miningState: MiningState.IDLE,
        currentCrystal: null
      }));
      
      toast.success(
        `Кристалл добыт! +${gameState.currentCrystal.price.toLocaleString()} монет`
      );
    }
  }, [gameState.currentPickaxe, gameState.miningState, gameState.currentCrystal]);

  const resetPickaxes = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      pickaxes: prev.pickaxes.map(p => ({ ...p, used: false })),
      currentPickaxe: null,
      miningState: MiningState.IDLE,
      currentCrystal: null
    }));
    
    toast.success('Все кирки восстановлены!');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-cave">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gem Forge Saga
              </h1>
              <p className="text-muted-foreground">
                Добывайте кристаллы и собирайте коллекцию!
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <PickaxeHelp />
              
              <AdminPanel
                pickaxeLinks={adminState.pickaxeLinks}
                onCreateLink={handleCreateLink}
                isAdminMode={adminState.isAdminMode}
                onToggleAdmin={handleToggleAdmin}
              />
              
              <Button
                onClick={resetPickaxes}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Сброс кирок
              </Button>
              
              {gameState.currentPickaxe && (
                <Badge variant="outline" className="px-3 py-1">
                  Выбрана: {gameState.currentPickaxe.name}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Pickaxes and Mining */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickaxes */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Кирки
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {gameState.pickaxes.map((pickaxe) => (
                  <Pickaxe
                    key={pickaxe.id}
                    pickaxe={pickaxe}
                    onSelect={selectPickaxe}
                    isSelected={gameState.currentPickaxe?.id === pickaxe.id}
                    disabled={pickaxe.used}
                  />
                ))}
              </div>
            </Card>

            {/* Mining Area */}
            <MiningArea
              miningState={gameState.miningState}
              onMine={mine}
              rarityColor={gameState.currentCrystal ? getRarityColor(gameState.currentCrystal.rarity) : undefined}
              crystalColor={gameState.currentCrystal?.color}
              canMine={gameState.currentPickaxe !== null}
            />
          </div>

          {/* Right Panel - Inventory */}
          <div>
            <Card className="p-6">
              <CrystalInventory 
                crystals={gameState.crystals}
                coins={gameState.coins}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
