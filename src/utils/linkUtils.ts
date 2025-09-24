import { AdminLink, PickaxeLink } from '@/types/admin';

// Secret admin password (in real app, this would be server-side)
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
  type: 'normal' | 'legendary' | 'coins' | 'case', 
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
    case 'case':
      defaultName = `${value || 1} кейс${(value || 1) > 1 ? 'а' : ''}`;
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

// Legacy function for backwards compatibility
export function createPickaxeLink(type: 'normal' | 'legendary', customName?: string): PickaxeLink {
  const link = createAdminLink(type, customName);
  return {
    id: link.id,
    code: link.code,
    type,
    name: link.name,
    used: link.used,
    createdAt: link.createdAt,
    usedAt: link.usedAt,
  };
}

export function getActivationUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?link=${code}`;
}

export function parseAdminLinkFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('link') || urlParams.get('pickaxe'); // Support legacy pickaxe parameter
}

// Legacy function for backwards compatibility
export function parsePickaxeFromUrl(): string | null {
  return parseAdminLinkFromUrl();
}