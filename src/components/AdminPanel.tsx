import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createAdminLink, getActivationUrl, isAdmin, hasModeratorAccess, isModerator } from '@/utils/linkUtils';
import { AdminLink } from '@/types/admin';
import { PickaxeRarity } from '@/types/game';
import { getRarityColor, getRarityName, calculateRarity, calculatePrice } from '@/utils/crystalUtils';
import { 
  Settings, 
  Link,
  Copy,
  Trash2,
  Coins,
  Send,
  Gem,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminPanelProps {
  language?: 'en' | 'ru';
  onRefreshData?: () => void;
  visible?: boolean;
  onToggle?: () => void;
}

const ALL_PICKAXE_TYPES: PickaxeRarity[] = ['trash', 'normal', 'rare', 'epic', 'mythic', 'legendary', 'insane', 'demonic', 'silent', 'artifact'];

const TIER_INDEX: Record<PickaxeRarity, number> = {
  trash: 0, normal: 1, rare: 2, epic: 3, mythic: 4, legendary: 5, insane: 6, demonic: 7, silent: 8, artifact: 9,
};

const DAILY_LIMIT = 2500;

const tr = {
  en: {
    admin: 'Admin',
    moderator: 'Moderator',
    adminPanel: 'Admin Panel',
    modPanel: 'Moderator Panel',
    sendCoins: 'Send coins to player',
    remainingToday: 'Remaining today',
    playerEmail: 'Player email',
    coinAmount: 'Coin amount',
    sending: 'Sending...',
    sendCoinsBtn: 'Send coins',
    historyToday: 'Today\'s history',
    coins: 'coins',
    createPickaxeLink: 'Create pickaxe link',
    nameOptional: 'Name (optional)',
    customName: 'Custom name...',
    createCoinLink: 'Create coin link',
    coinAmountLabel: 'Coin amount',
    createLink: 'Create link',
    giveSelf: 'Give to self',
    createCrystalLink: 'Create crystal link',
    byRarity: 'By rarity',
    byRgb: 'By RGB',
    rarity09: 'Rarity (0-9)',
    cleanup: 'Cleanup',
    deleteAllCrystals: 'Delete all crystals',
    createdLinks: 'Created links',
    code: 'Code',
    value: 'Value',
    copyLink: 'Copy link',
    delete: 'Delete',
    // toast messages
    errorCreating: 'Error creating link!',
    createdCoinLink: (v: number) => `Created link for ${v} coins!`,
    createdPickaxeLink: (name: string) => `Created link for ${name} pickaxe!`,
    errorActivating: 'Error activating!',
    receivedCoins: (v: number) => `Received ${v} coins!`,
    receivedPickaxe: (name: string) => `Received ${name} pickaxe!`,
    confirmDeleteCrystals: 'Delete ALL crystals? This is irreversible!',
    errorDeleting: 'Error deleting!',
    allCrystalsDeleted: 'All crystals deleted!',
    linkCopied: 'Link copied to clipboard!',
    errorDeletingLink: 'Error deleting link!',
    linkDeleted: 'Link deleted!',
    unexpectedError: 'Unexpected error!',
    enterEmail: 'Enter player email!',
    enterValidAmount: 'Enter a valid amount!',
    dailyLimitExceeded: (remaining: number) => `Daily limit exceeded! Remaining: ${remaining} coins`,
    userNotFound: 'User not found!',
    cannotSendSelf: 'Cannot send to yourself!',
    dailyLimitReached: 'Daily limit reached!',
    sendError: 'Send error!',
    sentCoins: (amount: number, email: string) => `Sent ${amount} coins to ${email}!`,
    crystalLinkCreated: 'Crystal link created!',
    crystalReceived: 'Crystal received!',
    error: 'Error!',
    coinsLabel: 'Coins',
  },
  ru: {
    admin: 'Админ',
    moderator: 'Модератор',
    adminPanel: 'Админ-панель',
    modPanel: 'Модератор-панель',
    sendCoins: 'Отправить монеты игроку',
    remainingToday: 'Осталось сегодня',
    playerEmail: 'Email игрока',
    coinAmount: 'Количество монет',
    sending: 'Отправка...',
    sendCoinsBtn: 'Отправить монеты',
    historyToday: 'История сегодня',
    coins: 'монет',
    createPickaxeLink: 'Создать ссылку на кирку',
    nameOptional: 'Название (необязательно)',
    customName: 'Кастомное название...',
    createCoinLink: 'Создать ссылку на монеты',
    coinAmountLabel: 'Количество монет',
    createLink: 'Создать ссылку',
    giveSelf: 'Дать себе',
    createCrystalLink: 'Создать ссылку на кристалл',
    byRarity: 'По редкости',
    byRgb: 'По RGB',
    rarity09: 'Редкость (0-9)',
    cleanup: 'Очистка',
    deleteAllCrystals: 'Удалить все кристаллы',
    createdLinks: 'Созданные ссылки',
    code: 'Код',
    value: 'Значение',
    copyLink: 'Копировать ссылку',
    delete: 'Удалить',
    errorCreating: 'Ошибка при создании ссылки!',
    createdCoinLink: (v: number) => `Создана ссылка на ${v} монет!`,
    createdPickaxeLink: (name: string) => `Создана ссылка на ${name} кирку!`,
    errorActivating: 'Ошибка активации!',
    receivedCoins: (v: number) => `Получено ${v} монет!`,
    receivedPickaxe: (name: string) => `Получена ${name} кирка!`,
    confirmDeleteCrystals: 'Удалить ВСЕ кристаллы? Это действие необратимо!',
    errorDeleting: 'Ошибка удаления!',
    allCrystalsDeleted: 'Все кристаллы удалены!',
    linkCopied: 'Ссылка скопирована в буфер обмена!',
    errorDeletingLink: 'Ошибка при удалении ссылки!',
    linkDeleted: 'Ссылка удалена!',
    unexpectedError: 'Неожиданная ошибка!',
    enterEmail: 'Введите email игрока!',
    enterValidAmount: 'Введите корректную сумму!',
    dailyLimitExceeded: (remaining: number) => `Превышен дневной лимит! Осталось: ${remaining} монет`,
    userNotFound: 'Пользователь не найден!',
    cannotSendSelf: 'Нельзя отправить себе!',
    dailyLimitReached: 'Дневной лимит исчерпан!',
    sendError: 'Ошибка отправки!',
    sentCoins: (amount: number, email: string) => `Отправлено ${amount} монет на ${email}!`,
    crystalLinkCreated: 'Ссылка на кристалл создана!',
    crystalReceived: 'Кристалл получен!',
    error: 'Ошибка!',
    coinsLabel: 'Монеты',
  },
};

export function AdminPanel({ language = 'ru', onRefreshData, visible = false, onToggle }: AdminPanelProps) {
  const { user } = useAuth();
  const l = tr[language];
  const [adminLinks, setAdminLinks] = useState<AdminLink[]>([]);
  const [customName, setCustomName] = useState('');
  const [coinAmount, setCoinAmount] = useState('100');
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const [crystalMode, setCrystalMode] = useState<'rgb' | 'rarity'>('rarity');
  const [crystalR, setCrystalR] = useState('128');
  const [crystalG, setCrystalG] = useState('0');
  const [crystalB, setCrystalB] = useState('255');
  const [crystalRarity, setCrystalRarity] = useState('5');

  const [targetEmail, setTargetEmail] = useState('');
  const [modCoinAmount, setModCoinAmount] = useState('100');
  const [todaySent, setTodaySent] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [transferHistory, setTransferHistory] = useState<{ amount: number; created_at: string; target_user_id: string }[]>([]);

  const isAdminUser = user ? isAdmin(user) : false;
  const isModUser = user ? isModerator(user) : false;
  const hasAccess = user ? hasModeratorAccess(user) : false;

  const loadAdminLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from('admin_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdminLinks((data || []).map(link => ({
        id: link.id,
        code: link.code,
        type: link.type as AdminLink['type'],
        name: link.name,
        used: link.used,
        createdAt: new Date(link.created_at),
        usedAt: link.used_at ? new Date(link.used_at) : undefined,
        value: link.value ?? undefined,
      })));
    } catch (error) {
      console.error('Error loading admin links:', error);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const loadModTransfers = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('mod_transfers')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transfers = data || [];
      setTransferHistory(transfers);
      setTodaySent(transfers.reduce((sum: number, t: any) => sum + t.amount, 0));
    } catch (error) {
      console.error('Error loading mod transfers:', error);
    }
  };

  useEffect(() => {
    if (isAdminUser) {
      loadAdminLinks();
    }
    if (hasAccess) {
      loadModTransfers();
    }
  }, [isAdminUser, hasAccess]);

  if (!hasAccess) return null;

  if (!visible) {
    return (
      <Button onClick={onToggle} variant="outline" size="sm" className="gap-1">
        <Settings className="w-4 h-4" />
        {isAdminUser ? l.admin : l.moderator}
      </Button>
    );
  }

  const handleCreateLink = async (type: PickaxeRarity | 'coins') => {
    let value: number | undefined;
    if (type === 'coins') {
      value = parseInt(coinAmount) || 100;
    }
    const link = createAdminLink(type, customName, value);
    try {
      const { error } = await supabase
        .from('admin_links')
        .insert({ code: link.code, type: link.type, name: link.name, used: false, value: link.value });
      if (error) { toast.error(l.errorCreating); return; }
      setAdminLinks(prev => [link, ...prev]);
      setCustomName('');
      toast.success(type === 'coins'
        ? l.createdCoinLink(value!)
        : l.createdPickaxeLink(getRarityName(TIER_INDEX[type as PickaxeRarity], language))
      );
    } catch { toast.error(l.unexpectedError); }
  };

  const handleGiveToSelf = async (type: PickaxeRarity | 'coins') => {
    let value: number | undefined;
    if (type === 'coins') { value = parseInt(coinAmount) || 100; }
    const link = createAdminLink(type, 'Self-grant', value);
    try {
      const { error: insertError } = await supabase
        .from('admin_links')
        .insert({ code: link.code, type: link.type, name: link.name, used: false, value: link.value });
      if (insertError) { toast.error(l.errorCreating); return; }
      const { error: redeemError } = await supabase.rpc('redeem_admin_link', { p_code: link.code });
      if (redeemError) { toast.error(l.errorActivating); return; }
      onRefreshData?.();
      toast.success(type === 'coins'
        ? l.receivedCoins(value!)
        : l.receivedPickaxe(getRarityName(TIER_INDEX[type as PickaxeRarity], language))
      );
    } catch { toast.error(l.error); }
  };

  const handleClearCrystals = async () => {
    if (!confirm(l.confirmDeleteCrystals)) return;
    try {
      const { error } = await supabase.from('crystals').delete().eq('user_id', user!.id);
      if (error) { toast.error(l.errorDeleting); return; }
      onRefreshData?.();
      toast.success(l.allCrystalsDeleted);
    } catch { toast.error(l.error); }
  };

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(getActivationUrl(code));
    toast.success(l.linkCopied);
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const linkToDelete = adminLinks.find(link => link.id === id);
      if (!linkToDelete) return;
      const { error } = await supabase.from('admin_links').delete().eq('code', linkToDelete.code);
      if (error) { toast.error(l.errorDeletingLink); return; }
      setAdminLinks(prev => prev.filter(link => link.id !== id));
      toast.success(l.linkDeleted);
    } catch { toast.error(l.unexpectedError); }
  };

  const handleSendCoins = async () => {
    if (!targetEmail.trim()) { toast.error(l.enterEmail); return; }
    const amount = parseInt(modCoinAmount) || 0;
    if (amount <= 0) { toast.error(l.enterValidAmount); return; }
    if (isModUser && todaySent + amount > DAILY_LIMIT) {
      toast.error(l.dailyLimitExceeded(DAILY_LIMIT - todaySent));
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.rpc('send_mod_coins', {
        p_target_email: targetEmail.trim(),
        p_amount: amount,
      });

      if (error) {
        if (error.message.includes('user_not_found')) toast.error(l.userNotFound);
        else if (error.message.includes('cannot_send_to_self')) toast.error(l.cannotSendSelf);
        else if (error.message.includes('daily_limit_exceeded')) toast.error(l.dailyLimitReached);
        else toast.error(l.sendError);
        return;
      }

      toast.success(l.sentCoins(amount, targetEmail));
      setTargetEmail('');
      setModCoinAmount('100');
      loadModTransfers();
    } catch {
      toast.error(l.error);
    } finally {
      setIsSending(false);
    }
  };

  const getTypeLabel = (link: AdminLink) => {
    if (link.type === 'coins') return l.coinsLabel;
    return getRarityName(TIER_INDEX[link.type as PickaxeRarity], language);
  };

  const getTypeColor = (link: AdminLink) => {
    if (link.type === 'coins') return undefined;
    return getRarityColor(TIER_INDEX[link.type as PickaxeRarity]);
  };

  const remaining = DAILY_LIMIT - todaySent;

  return (
    <Card className="p-6 border-primary/20 bg-gradient-crystal">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {isAdminUser ? l.adminPanel : l.modPanel}
        </h2>
        <Button onClick={onToggle} variant="ghost" size="sm">✕</Button>
      </div>

      <div className="space-y-6">
        {/* Send Coins Section */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Send className="w-4 h-4" />
            {l.sendCoins}
          </h3>

          {isModUser && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{l.remainingToday}:</span>
              <Badge variant={remaining > 0 ? 'outline' : 'destructive'}>
                {remaining} / {DAILY_LIMIT}
              </Badge>
            </div>
          )}

          <div>
            <Label htmlFor="targetEmail">{l.playerEmail}</Label>
            <Input
              id="targetEmail"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="player@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="modCoinAmount">{l.coinAmount}</Label>
            <Input
              id="modCoinAmount"
              type="number"
              value={modCoinAmount}
              onChange={(e) => setModCoinAmount(e.target.value)}
              placeholder="100"
              min="1"
              max={isModUser ? String(remaining) : undefined}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSendCoins}
            disabled={isSending || (isModUser && remaining <= 0)}
            className="w-full gap-2"
          >
            <Coins className="w-4 h-4" />
            {isSending ? l.sending : l.sendCoinsBtn}
          </Button>

          {transferHistory.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-muted-foreground font-medium">{l.historyToday}:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {transferHistory.map((t, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex justify-between">
                    <span>{t.target_user_id.slice(0, 8)}...</span>
                    <span>{t.amount} {l.coins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ADMIN-ONLY SECTIONS */}
        {isAdminUser && (
          <>
            <Separator />

            {/* Create Pickaxe Links */}
            <div className="space-y-3">
              <h3 className="font-medium">{l.createPickaxeLink}</h3>
              <div>
                <Label htmlFor="customName">{l.nameOptional}</Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={l.customName}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALL_PICKAXE_TYPES.map((type) => {
                  const tier = TIER_INDEX[type];
                  const color = getRarityColor(tier);
                  return (
                    <div key={type} className="flex gap-1">
                      <Button
                        onClick={() => handleCreateLink(type)}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs flex-1"
                        style={{ borderColor: color, color }}
                      >
                        <Link className="w-3 h-3" />
                        {getRarityName(tier, language)}
                      </Button>
                      <Button
                        onClick={() => handleGiveToSelf(type)}
                        size="sm"
                        className="text-xs px-2"
                        style={{ backgroundColor: color, color: 'hsl(var(--background))' }}
                        title={l.giveSelf}
                      >
                        +
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Create Coin Links */}
            <div className="space-y-3">
              <h3 className="font-medium">{l.createCoinLink}</h3>
              <div>
                <Label htmlFor="coinAmount">{l.coinAmountLabel}</Label>
                <Input
                  id="coinAmount"
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleCreateLink('coins')} variant="outline" className="flex-1 gap-2">
                  <Coins className="w-4 h-4" />
                  {l.createLink}
                </Button>
                <Button onClick={() => handleGiveToSelf('coins')} className="gap-2">
                  <Coins className="w-4 h-4" />
                  {l.giveSelf}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Create Crystal Links */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Gem className="w-4 h-4" />
                {l.createCrystalLink}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={crystalMode === 'rarity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCrystalMode('rarity')}
                >
                  {l.byRarity}
                </Button>
                <Button
                  variant={crystalMode === 'rgb' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCrystalMode('rgb')}
                >
                  {l.byRgb}
                </Button>
              </div>

              {crystalMode === 'rarity' ? (
                <div>
                  <Label>{l.rarity09}</Label>
                  <Input
                    type="number"
                    value={crystalRarity}
                    onChange={(e) => setCrystalRarity(e.target.value)}
                    min="0" max="9"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">R</Label>
                    <Input type="number" value={crystalR} onChange={(e) => setCrystalR(e.target.value)} min="0" max="255" />
                  </div>
                  <div>
                    <Label className="text-xs">G</Label>
                    <Input type="number" value={crystalG} onChange={(e) => setCrystalG(e.target.value)} min="0" max="255" />
                  </div>
                  <div>
                    <Label className="text-xs">B</Label>
                    <Input type="number" value={crystalB} onChange={(e) => setCrystalB(e.target.value)} min="0" max="255" />
                  </div>
                </div>
              )}

              {crystalMode === 'rgb' && (
                <div
                  className="w-full h-8 rounded-lg border border-border"
                  style={{ backgroundColor: `rgb(${crystalR}, ${crystalG}, ${crystalB})` }}
                />
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={async () => {
                    const code = crypto.randomUUID().slice(0, 12);
                    const r = crystalMode === 'rgb' ? parseInt(crystalR) || 0 : null;
                    const g = crystalMode === 'rgb' ? parseInt(crystalG) || 0 : null;
                    const b = crystalMode === 'rgb' ? parseInt(crystalB) || 0 : null;
                    const rarity = crystalMode === 'rarity' ? (parseInt(crystalRarity) || 0) : null;
                    try {
                      const { error } = await supabase.from('admin_links').insert({
                        code,
                        type: 'crystal',
                        name: customName || 'Crystal Link',
                        used: false,
                        value: rarity,
                        crystal_red: r,
                        crystal_green: g,
                        crystal_blue: b,
                      });
                      if (error) throw error;
                      loadAdminLinks();
                      toast.success(l.crystalLinkCreated);
                    } catch { toast.error(l.error); }
                  }}
                >
                  <Link className="w-4 h-4" />
                  {l.createLink}
                </Button>
                <Button
                  className="gap-2"
                  onClick={async () => {
                    const code = crypto.randomUUID().slice(0, 12);
                    const r = crystalMode === 'rgb' ? parseInt(crystalR) || 0 : null;
                    const g = crystalMode === 'rgb' ? parseInt(crystalG) || 0 : null;
                    const b = crystalMode === 'rgb' ? parseInt(crystalB) || 0 : null;
                    const rarity = crystalMode === 'rarity' ? (parseInt(crystalRarity) || 0) : null;
                    try {
                      const { error: insertErr } = await supabase.from('admin_links').insert({
                        code,
                        type: 'crystal',
                        name: 'Self-grant crystal',
                        used: false,
                        value: rarity,
                        crystal_red: r,
                        crystal_green: g,
                        crystal_blue: b,
                      });
                      if (insertErr) throw insertErr;
                      const { error: redeemErr } = await supabase.rpc('redeem_admin_link', { p_code: code });
                      if (redeemErr) throw redeemErr;
                      onRefreshData?.();
                      toast.success(l.crystalReceived);
                    } catch { toast.error(l.error); }
                  }}
                >
                  <Gem className="w-4 h-4" />
                  {l.giveSelf}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">{l.cleanup}</h3>
              <Button onClick={handleClearCrystals} variant="destructive" size="sm" className="w-full gap-2">
                <Trash2 className="w-4 h-4" />
                {l.deleteAllCrystals}
              </Button>
            </div>

            {adminLinks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium">{l.createdLinks}</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {adminLinks.map((link) => (
                      <div key={link.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{link.name}</div>
                          <Badge
                            variant="outline"
                            style={getTypeColor(link) ? { borderColor: getTypeColor(link), color: getTypeColor(link) } : undefined}
                          >
                            {getTypeLabel(link)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {l.code}: {link.code}
                          {link.value && ` • ${l.value}: ${link.value}`}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleCopyLink(link.code)} size="sm" variant="outline" className="flex-1 gap-1">
                            <Copy className="w-3 h-3" />
                            {l.copyLink}
                          </Button>
                          <Button onClick={() => handleDeleteLink(link.id)} size="sm" variant="destructive" className="gap-1">
                            <Trash2 className="w-3 h-3" />
                            {l.delete}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
