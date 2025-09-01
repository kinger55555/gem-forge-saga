export interface PickaxeLink {
  id: string;
  code: string;
  type: 'normal' | 'legendary';
  name: string;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}

export interface AdminState {
  isAdminMode: boolean;
  pickaxeLinks: PickaxeLink[];
}