import { PickaxeRarity } from './game';

export interface AdminLink {
  id: string;
  code: string;
  type: PickaxeRarity | 'coins';
  name: string;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
  value?: number;
}

export interface AdminState {
  isAdminMode: boolean;
  adminLinks: AdminLink[];
}
