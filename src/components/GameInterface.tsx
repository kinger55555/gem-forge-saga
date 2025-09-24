import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { PickaxeCase } from './PickaxeCase';
import { Pickaxe } from './Pickaxe';
import { MiningArea } from './MiningArea';
import { CrystalInventory } from './CrystalInventory';
import { AdminPanel } from './AdminPanel';
import { PickaxeHelp } from './PickaxeHelp';
import { Shop } from './Shop';
import { Clicker } from './Clicker';
import { PickaxeCodeInput } from './PickaxeCodeInput';
import { DailyRewards } from './DailyRewards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
import { Plus, Gift, LogOut, Globe, User, RotateCcw } from 'lucide-react';

// SEO: semantic structure for main page
const SeoHeader = () => (
  <header>
    <title>Gem Forge Saga - Mine crystals game</title>
    <meta name="description" content="Gem Forge Saga mining crystals and collecting game" />
    <link rel="canonical" href="/" />
  </header>
);
import { toast } from 'sonner';

export function GameInterface() {
  const { user, signOut } = useAuth();
  const gameData = useGameData();
  const [language, setLanguage] = useState<'en' | 'ru'>('ru');
  const [currentPickaxe, setCurrentPickaxe] = useState<(PickaxeType & { pickaxeKey?: string }) | null>(null);
  const [miningState, setMiningState] = useState<MiningState>(MiningState.IDLE);
  const [currentCrystal, setCurrentCrystal] = useState<Crystal | null>(null);
  const [showMiningModal, setShowMiningModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const translations = {
    en: {
      title: 'Gem Forge Saga',
      subtitle: 'Mine crystals and collect them!',
      pickaxes: 'Pickaxes',
      selected: 'Selected',
      signOut: 'Sign Out',
      chooseLang: 'Language'
    },
    ru: {
      title: 'Gem Forge Saga',
      subtitle: 'Добывайте кристаллы и собирайте коллекцию!',
      pickaxes: 'Кирки',
      selected: 'Выбрана',
      signOut: 'Выйти',
      chooseLang: 'Язык'
    }
  };

  const t = translations[language];

  const activatePickaxeFromCode = useCallback(async (code: string) => {
    if (!user) return;

    try {
      const { data: link, error } = await supabase
        .from('admin_links')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .maybeSingle();

      if (error || !link) {
        toast.error('Invalid or already used pickaxe link!');
        return;
      }

      const [updateLinkRes, insertPickaxeRes] = await Promise.all([
        supabase
          .from('admin_links')
          .update({ 
            used: true, 
            used_by: user.id, 
            used_at: new Date().toISOString() 
          })
          .eq('id', link.id),
        supabase
          .from('pickaxes')
          .insert({
            user_id: user.id,
            type: link.type,
            name: link.name,
            used: false
          })
      ]);

      if (updateLinkRes.error) throw updateLinkRes.error;
      if (insertPickaxeRes.error) throw insertPickaxeRes.error;

      gameData.refreshData();
      toast.success(`🎁 Received new pickaxe: ${link.name}!`, { duration: 4000 });
    } catch (error: any) {
      console.error('Error activating pickaxe:', error);
      toast.error('Failed to activate pickaxe');
    }
  }, [user, gameData]);

  // Check for pickaxe activation on component mount
  useEffect(() => {
    const pickaxeCode = parsePickaxeFromUrl();
    if (pickaxeCode) {
      activatePickaxeFromCode(pickaxeCode);
      // Clean URL after activation
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [activatePickaxeFromCode]);

  const handleToggleAdmin = useCallback((isAdmin: boolean) => {
    setIsAdminMode(isAdmin);
  }, []);

  const selectPickaxe = useCallback((pickaxe: PickaxeType & { pickaxeKey?: string }) => {
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
      // First click → show rarity color cue based on rarity points
      const crystal = generateCrystal(currentPickaxe.pickaxeKey);
      
      setMiningState(MiningState.SHOWING_RARITY);
      setCurrentCrystal(crystal);
      
      toast.success(`Found ${getRarityName(crystal.rarity, language).toLowerCase()} crystal!`);
      
      toast.success(`Found ${getRarityName(crystal.rarity, language).toLowerCase()} crystal!`);
    } 
    else if (miningState === MiningState.SHOWING_RARITY) {
      // Show the actual crystal
      setMiningState(MiningState.SHOWING_CRYSTAL);
    }
    else if (miningState === MiningState.SHOWING_CRYSTAL && currentCrystal) {
      // Collect the crystal
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

  const handleClickerClick = () => {
    gameData.addClickerEarnings(0.1);
  };

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
                isAdminMode={isAdminMode}
                onToggleAdmin={handleToggleAdmin}
                language={language}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Pickaxes */}
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

            {/* Pickaxe Case */}
            <PickaxeCase 
              coins={gameData.coins}
              onOpenCase={gameData.addPickaxeFromCase}
              language={language}
            />

            {/* Shop */}
            <Shop 
              coins={gameData.coins}
              onBuySpecificPickaxe={gameData.buySpecificPickaxe}
            />

            {/* Clicker */}
            <Clicker 
              clickerEarnings={gameData.clickerEarnings}
              onClick={handleClickerClick}
            />

            {/* Daily Rewards */}
            <DailyRewards 
              onRewardClaimed={gameData.refreshData}
              language={language}
            />

            {/* Pickaxe Code Input */}
            <PickaxeCodeInput 
              onRedeemCode={activatePickaxeFromCode}
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
