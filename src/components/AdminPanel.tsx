import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createAdminLink, getActivationUrl, isAdmin } from '@/utils/linkUtils';
import { AdminLink } from '@/types/admin';
import { PickaxeRarity } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { 
  Settings, 
  Link,
  Copy,
  Trash2,
  Coins,
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

export function AdminPanel({ language = 'ru', onRefreshData, visible = false, onToggle }: AdminPanelProps) {
  const { user } = useAuth();
  const [adminLinks, setAdminLinks] = useState<AdminLink[]>([]);
  const [customName, setCustomName] = useState('');
  const [coinAmount, setCoinAmount] = useState('100');
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const isAdminUser = user ? isAdmin(user) : false;

  useEffect(() => {
    if (isAdminUser) {
      loadAdminLinks();
    }
  }, [isAdminUser]);

  if (!isAdminUser) return null;

  if (!visible) {
    return (
      <Button onClick={onToggle} variant="outline" size="sm" className="gap-1">
        <Settings className="w-4 h-4" />
        Админ
      </Button>
    );
  }

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

  const handleCreateLink = async (type: PickaxeRarity | 'coins') => {
    let value: number | undefined;
    
    if (type === 'coins') {
      value = parseInt(coinAmount) || 100;
    }
    
    const link = createAdminLink(type, customName, value);
    
    try {
      const { error } = await supabase
        .from('admin_links')
        .insert({
          code: link.code,
          type: link.type,
          name: link.name,
          used: false,
          value: link.value
        });

      if (error) {
        toast.error('Ошибка при создании ссылки!');
        return;
      }

      setAdminLinks(prev => [link, ...prev]);
      setCustomName('');
      
      toast.success(type === 'coins' 
        ? `Создана ссылка на ${value} монет!`
        : `Создана ссылка на ${getRarityName(TIER_INDEX[type as PickaxeRarity], language)} кирку!`
      );
    } catch (error) {
      toast.error('Неожиданная ошибка при создании ссылки!');
    }
  };

  const handleGiveToSelf = async (type: PickaxeRarity | 'coins') => {
    let value: number | undefined;
    if (type === 'coins') {
      value = parseInt(coinAmount) || 100;
    }
    const link = createAdminLink(type, 'Self-grant', value);

    try {
      const { error: insertError } = await supabase
        .from('admin_links')
        .insert({ code: link.code, type: link.type, name: link.name, used: false, value: link.value });
      if (insertError) { toast.error('Ошибка создания!'); return; }

      const { data, error: redeemError } = await supabase.rpc('redeem_admin_link', { p_code: link.code });
      if (redeemError) { toast.error('Ошибка активации!'); return; }

      onRefreshData?.();
      toast.success(type === 'coins'
        ? `Получено ${value} монет!`
        : `Получена ${getRarityName(TIER_INDEX[type as PickaxeRarity], language)} кирка!`
      );
    } catch {
      toast.error('Ошибка!');
    }
  };

  const handleCopyLink = (code: string) => {
    const url = getActivationUrl(code);
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована в буфер обмена!');
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const linkToDelete = adminLinks.find(link => link.id === id);
      if (!linkToDelete) return;

      const { error } = await supabase
        .from('admin_links')
        .delete()
        .eq('code', linkToDelete.code);

      if (error) {
        toast.error('Ошибка при удалении ссылки!');
        return;
      }

      setAdminLinks(prev => prev.filter(link => link.id !== id));
      toast.success('Ссылка удалена!');
    } catch (error) {
      toast.error('Неожиданная ошибка при удалении ссылки!');
    }
  };

  const getTypeLabel = (link: AdminLink) => {
    if (link.type === 'coins') return 'Монеты';
    const tier = TIER_INDEX[link.type as PickaxeRarity];
    return getRarityName(tier, language);
  };

  const getTypeColor = (link: AdminLink) => {
    if (link.type === 'coins') return undefined;
    return getRarityColor(TIER_INDEX[link.type as PickaxeRarity]);
  };

  return (
    <Card className="p-6 border-primary/20 bg-gradient-crystal">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Админ-панель
        </h2>
        <Button onClick={onToggle} variant="ghost" size="sm">✕</Button>
      </div>

      <div className="space-y-6">
        {/* Create Pickaxe Links */}
        <div className="space-y-3">
          <h3 className="font-medium">Создать ссылку на кирку</h3>
          
          <div>
            <Label htmlFor="customName">Название (необязательно)</Label>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Кастомное название..."
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
                    title="Дать себе"
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
          <h3 className="font-medium">Создать ссылку на монеты</h3>
          
          <div>
            <Label htmlFor="coinAmount">Количество монет</Label>
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
            <Button 
              onClick={() => handleCreateLink('coins')}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Coins className="w-4 h-4" />
              Создать ссылку
            </Button>
            <Button
              onClick={() => handleGiveToSelf('coins')}
              className="gap-2"
            >
              <Coins className="w-4 h-4" />
              Дать себе
            </Button>
          </div>
        </div>

        {adminLinks.length > 0 && (
          <>
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Созданные ссылки</h3>
              
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
                      Код: {link.code}
                      {link.value && ` • Значение: ${link.value}`}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCopyLink(link.code)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Копировать ссылку
                      </Button>
                      <Button 
                        onClick={() => handleDeleteLink(link.id)}
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
