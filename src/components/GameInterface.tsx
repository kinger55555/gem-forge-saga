import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { Pickaxe } from './Pickaxe';
import { MiningArea } from './MiningArea';
import { CrystalInventory } from './CrystalInventory';
import { AdminPanel } from './AdminPanel';
import { PickaxeHelp } from './PickaxeHelp';
import { Shop } from './Shop';
import { PickaxeCodeInput } from './PickaxeCodeInput';
import { DailyRewards } from './DailyRewards';
import { Temple } from './Temple';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  MiningState, 
  Pickaxe as PickaxeType, 
  Crystal 
} from '@/types/game';
import { 
  generateCrystal, 
  getRarityColor, 
  getRarityName 
} from '@/utils/crystalUtils';
import { parsePickaxeFromUrl } from '@/utils/linkUtils';
import { Plus, LogOut, Globe, RotateCcw, Pickaxe as PickaxeIcon, Landmark } from 'lucide-react';
import { toast } from 'sonner';

const SeoHeader = () => (
  <header>
    <title>Gem Forge Saga - Mine crystals game</title>
    <meta name="description" content="Gem Forge Saga mining crystals and collecting game" />
    <link rel="canonical" href="/" />
  </header>
);

export function GameInterface() {
  const { user, signOut } = useAuth();
  const gameData = useGameData();
  const [language, setLanguage] = useState<'en' | 'ru'>('ru');
  const [currentPickaxe, setCurrentPickaxe] = useState<PickaxeType | null>(null);
  const [miningState, setMiningState] = useState<MiningState>(MiningState.IDLE);
  const [currentCrystal, setCurrentCrystal] = useState<Crystal | null>(null);
  const [showMiningModal, setShowMiningModal] = useState(false);

  const translations = {
    en: {
      title: 'Gem Forge Saga',
      subtitle: 'Mine crystals and collect them!',
      pickaxes: 'Pickaxes',
      selected: 'Selected',
      signOut: 'Sign Out',
      mine: 'Mine',
      temple: 'Temple',
    },
    ru: {
      title: 'Gem Forge Saga',
      subtitle: 'Добывайте кристаллы и собирайте коллекцию!',
      pickaxes: 'Кирки',
      selected: 'Выбрана',
      signOut: 'Выйти',
      mine: 'Шахта',
      temple: 'Храм',
    }
  };

  const t = translations[language];

  const activateAdminLinkFromCode = useCallback(async (code: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('redeem_admin_link', { p_code: code });

      if (error) {
        toast.error(language === 'ru' ? 'Неверная или уже использованная ссылка!' : 'Invalid or already used link!');
        return;
      }

      const link = data as any;
      if (link.type === 'coins') {
        toast.success(`💰 Получено ${link.value || 100} монет!`, { duration: 4000 });
      } else {
        toast.success(`🎁 Получена ${link.type} кирка!`, { duration: 4000 });
      }

      gameData.refreshData();
    } catch (error: any) {
      console.error('Error activating link:', error);
      toast.error('Failed to activate link');
    }
  }, [user, gameData, language]);

  useEffect(() => {
    const linkCode = parsePickaxeFromUrl();
    if (linkCode) {
      activateAdminLinkFromCode(linkCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [activateAdminLinkFromCode]);

  const selectPickaxe = useCallback((pickaxe: PickaxeType) => {
    if (pickaxe.used) {
      toast.error(language === 'en' ? 'This pickaxe is already used!' : 'Эта кирка уже использована!');
      return;
    }
    
    setCurrentPickaxe(pickaxe);
    setMiningState(MiningState.IDLE);
    setCurrentCrystal(null);
    setShowMiningModal(true);
    
    toast.success(`Selected ${pickaxe.type === 'legendary' ? 'legendary' : 'normal'} pickaxe`);
  }, [language]);

  const mine = useCallback(() => {
    if (!currentPickaxe) return;

    if (miningState === MiningState.IDLE) {
      const crystal = generateCrystal(currentPickaxe.type);
      
      setMiningState(MiningState.SHOWING_RARITY);
      setCurrentCrystal(crystal);
      
      toast.success(`Found ${getRarityName(crystal.rarity, language).toLowerCase()} crystal!`);
    } 
    else if (miningState === MiningState.SHOWING_RARITY) {
      setMiningState(MiningState.SHOWING_CRYSTAL);
    }
    else if (miningState === MiningState.SHOWING_CRYSTAL && currentCrystal) {
      gameData.saveCrystal(currentCrystal);
      gameData.usePickaxe(currentPickaxe.id);
      
      setCurrentPickaxe(null);
      setMiningState(MiningState.IDLE);
      setCurrentCrystal(null);
      setShowMiningModal(false);
      
      toast.success(`Crystal mined! It will be added to your collection.`);
    }
  }, [currentPickaxe, miningState, currentCrystal, gameData, language]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTempleEarnCoins = useCallback(async (amount: number) => {
    await gameData.addClickerEarnings(amount);
  }, [gameData]);

  if (gameData.loading) {
    return (
      <div className="min-h-screen bg-gradient-cave flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cave">
      <SeoHeader />
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'RU' : 'EN'}
              </Button>

              <PickaxeHelp language={language} />
              
              <AdminPanel
                language={language}
                onRefreshData={gameData.refreshData}
              />
              
              {currentPickaxe && (
                <Badge variant="outline" className="px-3 py-1">
                  {t.selected}: {currentPickaxe.name}
                </Badge>
              )}

              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t.signOut}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="mine" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="mine" className="gap-2">
              <PickaxeIcon className="w-4 h-4" />
              {t.mine}
            </TabsTrigger>
            <TabsTrigger value="temple" className="gap-2">
              <Landmark className="w-4 h-4" />
              {t.temple}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pickaxes */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t.pickaxes}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div></div>
                      <Button
                        onClick={gameData.clearUsedPickaxes}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!gameData.pickaxes.some(p => p.used)}
                      >
                        <RotateCcw className="w-4 h-4" />
                        {language === 'ru' ? 'Удалить использованные' : 'Delete used pickaxes'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {gameData.pickaxes.map((pickaxe) => (
                        <Pickaxe
                          key={pickaxe.id}
                          pickaxe={pickaxe}
                          onSelect={selectPickaxe}
                          isSelected={currentPickaxe?.id === pickaxe.id}
                          disabled={pickaxe.used}
                          language={language}
                        />
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Shop */}
                <Shop 
                  coins={gameData.coins}
                  onBuyPickaxe={gameData.buyPickaxe}
                />

                {/* Daily Rewards */}
                <DailyRewards 
                  onRewardClaimed={gameData.refreshData}
                  language={language}
                />

                {/* Pickaxe Code Input */}
                <PickaxeCodeInput 
                  onRedeemCode={activateAdminLinkFromCode}
                  language={language}
                />
              </div>

              {/* Right Panel - Inventory */}
              <div>
                <Card className="p-6">
                  <CrystalInventory 
                    crystals={gameData.crystals}
                    coins={gameData.coins}
                    onSellCrystal={gameData.sellCrystal}
                    language={language}
                  />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="temple">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Temple
                  crystals={gameData.crystals}
                  coins={gameData.coins}
                  onEarnCoins={handleTempleEarnCoins}
                  language={language}
                />
              </div>
              <div>
                <Card className="p-6">
                  <CrystalInventory 
                    crystals={gameData.crystals}
                    coins={gameData.coins}
                    onSellCrystal={gameData.sellCrystal}
                    language={language}
                  />
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mining Modal */}
        <Dialog open={showMiningModal} onOpenChange={setShowMiningModal}>
          <DialogContent className="max-w-2xl">
            <MiningArea
              miningState={miningState}
              onMine={mine}
              rarityColor={currentCrystal ? getRarityColor(currentCrystal.rarity) : undefined}
              crystalColor={currentCrystal?.color}
              canMine={currentPickaxe !== null}
              language={language}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
