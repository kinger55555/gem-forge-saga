export interface AdminLink {
  id: string;
  code: string;
  type: 'normal' | 'legendary' | 'coins';
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
