import { AdminLink } from '@/types/admin';

const ADMIN_PASSWORD = 'gemforge2024';

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

export function createAdminLink(
  type: 'normal' | 'legendary' | 'coins', 
  customName?: string, 
  value?: number
): AdminLink {
  const code = generateLinkCode();
  let defaultName = '';
  
  switch (type) {
    case 'normal':
      defaultName = 'Обычная кирка';
      break;
    case 'legendary':
      defaultName = 'Легендарная кирка';
      break;
    case 'coins':
      defaultName = `${value || 100} монет`;
      break;
  }
  
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
