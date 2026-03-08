import { AdminLink } from '@/types/admin';
import { PickaxeRarity } from '@/types/game';

const ADMIN_PASSWORD = '6767676767676';

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generateLinkCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const PICKAXE_NAMES: Record<PickaxeRarity, string> = {
  trash: 'Мусорная кирка',
  normal: 'Обычная кирка',
  rare: 'Редкая кирка',
  epic: 'Эпическая кирка',
  mythic: 'Мифическая кирка',
  legendary: 'Легендарная кирка',
  insane: 'Безумная кирка',
  demonic: 'Демоническая кирка',
  silent: 'Тихая кирка',
  artifact: 'Артефактная кирка',
};

export function createAdminLink(
  type: PickaxeRarity | 'coins',
  customName?: string,
  value?: number
): AdminLink {
  const code = generateLinkCode();
  let defaultName = type === 'coins' ? `${value || 100} монет` : PICKAXE_NAMES[type as PickaxeRarity];

  return {
    id: crypto.randomUUID(),
    code,
    type,
    name: customName || `${defaultName} (${code})`,
    used: false,
    createdAt: new Date(),
    value,
  };
}

export function getActivationUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?link=${code}`;
}

export function parseAdminLinkFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('link') || urlParams.get('pickaxe');
}

export function parsePickaxeFromUrl(): string | null {
  return parseAdminLinkFromUrl();
}
