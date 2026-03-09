export type ProductStatus = "available" | "sold" | "hidden";
export type ProductCategory = "clothing" | "leather" | "herbals" | "vintage";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
export type BlogPostStatus = "draft" | "published";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: ProductCategory;
  images: string[];
  featured_image: string;
  status: ProductStatus;
  is_one_of_one: boolean;
  is_featured: boolean;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  square_payment_id: string;
  status: OrderStatus;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  featured_image: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Cart types
export interface CartItem {
  product: Pick<Product, "id" | "name" | "slug" | "price" | "featured_image" | "status">;
}
