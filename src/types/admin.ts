import { PickaxeRarity } from './game';

export type UserRole = 'admin' | 'moderator';

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

export interface ModTransfer {
  id: string;
  modUserId: string;
  targetUserId: string;
  amount: number;
  createdAt: Date;
}

export interface AdminState {
  isAdminMode: boolean;
  adminLinks: AdminLink[];
}
