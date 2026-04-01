// ユーザー型
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

// 商品型
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

// カテゴリ型
export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
}

// カートアイテム型
export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// 注文・注文アイテム型
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  address_id?: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}
