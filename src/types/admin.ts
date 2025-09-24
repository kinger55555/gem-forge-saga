export interface AdminLink {
  id: string;
  code: string;
  type: 'normal' | 'legendary' | 'coins' | 'case';
  name: string;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
  value?: number; // For coins amount or case count
}

export interface AdminState {
  isAdminMode: boolean;
  adminLinks: AdminLink[];
}

// Legacy interface for backwards compatibility
export interface PickaxeLink extends Omit<AdminLink, 'type' | 'value'> {
  type: 'normal' | 'legendary';
}