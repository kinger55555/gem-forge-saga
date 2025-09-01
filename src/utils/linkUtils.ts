import { PickaxeLink } from '@/types/admin';

// Secret admin password (in real app, this would be server-side)
const ADMIN_PASSWORD = 'gemforge2024';

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generatePickaxeCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createPickaxeLink(type: 'normal' | 'legendary', customName?: string): PickaxeLink {
  const code = generatePickaxeCode();
  const defaultName = type === 'legendary' ? 'Легендарная кирка' : 'Обычная кирка';
  
  return {
    id: crypto.randomUUID(),
    code,
    type,
    name: customName || `${defaultName} (${code})`,
    used: false,
    createdAt: new Date(),
  };
}

export function getActivationUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?pickaxe=${code}`;
}

export function parsePickaxeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('pickaxe');
}