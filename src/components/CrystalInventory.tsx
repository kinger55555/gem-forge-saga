import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Crystal } from '@/types/game';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Gem, Coins, ArrowUpDown, Landmark, Hammer, Gift, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CrystalInventoryProps {
  crystals: Crystal[];
  coins: number;
  onSellCrystal: (crystalId: string, price: number) => void;
  onPlayInTemple?: (crystal: Crystal) => void;
  onGoToForge?: () => void;
  onGiftCrystal?: (crystalId: string) => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    collection: 'Crystal Collection',
    coins: 'coins',
    noCrystals: 'You have no crystals yet.\nSelect a pickaxe and start mining!',
    sell: 'Sell',
    close: 'Close',
    crystalInfo: 'Crystal Info',
    rarity: 'Rarity',
    price: 'Price',
    sellConfirm: 'Sell for',
    playInTemple: 'Play in Temple',
    goToForge: 'Recycle in Forge',
    gift: 'Gift to friend',
    giftCreated: 'Gift link created!',
    copyLink: 'Copy link',
    copied: 'Copied!',
    redeemGift: 'Redeem crystal gift',
    redeemCode: 'Gift code',
    redeem: 'Redeem',
  },
  ru: {
    collection: 'Коллекция кристаллов',
    coins: 'монет',
    noCrystals: 'У вас пока нет кристаллов.\nВыберите кирку и начните добычу!',
    sell: 'Продать',
    close: 'Закрыть',
    crystalInfo: 'Информация о кристалле',
    rarity: 'Редкость',
    price: 'Цена',
    sellConfirm: 'Продать за',
    playInTemple: 'Играть в Храме',
    goToForge: 'В Кузницу',
    gift: 'Подарить другу',
    giftCreated: 'Ссылка на подарок создана!',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    redeemGift: 'Получить подарок',
    redeemCode: 'Код подарка',
    redeem: 'Получить',
  }
};

export function CrystalInventory({ crystals, coins, onSellCrystal, onPlayInTemple, onGoToForge, onGiftCrystal, language }: CrystalInventoryProps) {
  const t = translations[language];
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'none' | 'rarity' | 'price'>('none');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [giftLink, setGiftLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleSort = (type: 'rarity' | 'price') => {
    if (sortBy === type) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortDir('desc');
    }
  };

  const sortedCrystals = [...crystals].sort((a, b) => {
    if (sortBy === 'none') return 0;
    const diff = sortBy === 'rarity' ? a.rarity - b.rarity : a.price - b.price;
    return sortDir === 'desc' ? -diff : diff;
  });

  const handleSell = () => {
    if (!selectedCrystal) return;
    onSellCrystal(selectedCrystal.id, selectedCrystal.price);
    setSelectedCrystal(null);
  };

  const handlePlayInTemple = () => {
    if (!selectedCrystal || !onPlayInTemple) return;
    onPlayInTemple(selectedCrystal);
    setSelectedCrystal(null);
  };

  const handleGoToForge = () => {
    if (!onGoToForge) return;
    onGoToForge();
    setSelectedCrystal(null);
  };

  const handleGift = async () => {
    if (!selectedCrystal || !user) return;
    try {
      const { data, error } = await supabase
        .from('crystal_gifts')
        .insert({
          sender_id: user.id,
          red: selectedCrystal.red,
          green: selectedCrystal.green,
          blue: selectedCrystal.blue,
          rarity: selectedCrystal.rarity,
          price: selectedCrystal.price,
          color: selectedCrystal.color,
        })
        .select('code')
        .single();

      if (error) throw error;

      // Remove crystal from sender
      onGiftCrystal?.(selectedCrystal.id);

      const link = `${window.location.origin}?gift=${data.code}`;
      setGiftLink(link);
      toast.success(t.giftCreated);
    } catch (error) {
      console.error('Error creating gift:', error);
      toast.error('Failed to create gift');
    }
  };

  const handleCopyGiftLink = () => {
    if (!giftLink) return;
    navigator.clipboard.writeText(giftLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) return;
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_crystal_gift', { p_code: giftCode.trim() });
      if (error) {
        if (error.message.includes('invalid_or_used_gift')) {
          toast.error(language === 'ru' ? 'Неверный или уже использованный код!' : 'Invalid or already used code!');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success(language === 'ru' ? '💎 Кристалл получен!' : '💎 Crystal received!');
      setGiftCode('');
      // Trigger data refresh via selling with 0 (hack - we need a proper refresh)
      window.location.reload();
    } catch {
      toast.error('Error');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card">
          <Coins className="w-4 h-4 text-primary" />
          <span className="font-bold text-lg">{coins.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">{t.coins}</span>
        </div>
      </div>

      {/* Gift redemption */}
      <div className="flex gap-2 mb-3">
        <Input
          value={giftCode}
          onChange={(e) => setGiftCode(e.target.value)}
          placeholder={t.redeemCode}
          className="text-xs"
        />
        <Button size="sm" onClick={handleRedeemGift} disabled={isRedeeming || !giftCode.trim()} className="gap-1 shrink-0">
          <Gift className="w-3 h-3" />
          {t.redeem}
        </Button>
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Gem className="w-5 h-5" />
        {t.collection} ({crystals.length})
      </h2>

      {crystals.length > 0 && (
        <div className="flex gap-2 mb-3">
          <Button variant={sortBy === 'rarity' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('rarity')} className="gap-1 text-xs">
            <ArrowUpDown className="w-3 h-3" />
            {language === 'ru' ? 'Редкость' : 'Rarity'}
            {sortBy === 'rarity' && (sortDir === 'desc' ? ' ↓' : ' ↑')}
          </Button>
          <Button variant={sortBy === 'price' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('price')} className="gap-1 text-xs">
            <ArrowUpDown className="w-3 h-3" />
            {language === 'ru' ? 'Цена' : 'Price'}
            {sortBy === 'price' && (sortDir === 'desc' ? ' ↓' : ' ↑')}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 max-h-[600px] overflow-y-auto">
        {crystals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 whitespace-pre-line w-full">{t.noCrystals}</p>
        ) : (
          sortedCrystals.map((crystal) => (
            <div
              key={crystal.id}
              className="w-24 flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => setSelectedCrystal(crystal)}
            >
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center relative border border-border/30 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: crystal.color }}
              >
                <Gem className="w-8 h-8 text-white/80 drop-shadow-md" />
                <Badge
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0 text-white border-0 whitespace-nowrap"
                  style={{ backgroundColor: getRarityColor(crystal.rarity) }}
                >
                  {getRarityName(crystal.rarity, language)}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight text-center">
                RGB: {crystal.red}, {crystal.green}, {crystal.blue}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="w-3 h-3" />
                <span>{crystal.price.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedCrystal} onOpenChange={(open) => { if (!open) { setSelectedCrystal(null); setGiftLink(null); setCopied(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.crystalInfo}</DialogTitle>
          </DialogHeader>
          
          {selectedCrystal && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center border border-border/30"
                style={{ backgroundColor: selectedCrystal.color }}
              >
                <Gem className="w-14 h-14 text-white/80 drop-shadow-lg" />
              </div>

              <Badge
                className="text-sm px-3 py-1 text-white border-0"
                style={{ backgroundColor: getRarityColor(selectedCrystal.rarity) }}
              >
                {getRarityName(selectedCrystal.rarity, language)}
              </Badge>

              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  RGB({selectedCrystal.red}, {selectedCrystal.green}, {selectedCrystal.blue})
                </p>
                <div className="flex items-center justify-center gap-1 text-lg font-bold">
                  <Coins className="w-5 h-5 text-primary" />
                  {selectedCrystal.price.toLocaleString()} {t.coins}
                </div>
              </div>

              {/* Gift link display */}
              {giftLink && (
                <div className="w-full p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs text-muted-foreground break-all">{giftLink}</p>
                  <Button size="sm" variant="outline" className="w-full gap-1" onClick={handleCopyGiftLink}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? t.copied : t.copyLink}
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 w-full">
                  {onPlayInTemple && (
                    <Button variant="default" className="flex-1 gap-2" onClick={handlePlayInTemple}>
                      <Landmark className="w-4 h-4" />
                      {t.playInTemple}
                    </Button>
                  )}
                  {onGoToForge && (
                    <Button variant="secondary" className="flex-1 gap-2" onClick={handleGoToForge}>
                      <Hammer className="w-4 h-4" />
                      {t.goToForge}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  {!giftLink && (
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleGift}>
                      <Gift className="w-4 h-4" />
                      {t.gift}
                    </Button>
                  )}
                  <Button variant="destructive" className="flex-1" onClick={handleSell}>
                    {t.sellConfirm} {selectedCrystal.price.toLocaleString()}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setSelectedCrystal(null); setGiftLink(null); }}>
                  {t.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
