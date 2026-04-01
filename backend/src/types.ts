export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name?: string;
  image_url?: string;
  stock: number;
  created_at: string;
  updated_at: string;
}
