export type ProductCategory =
  | 'Academic Notes'
  | 'Exam Prep'
  | 'Coding & Tech'
  | 'Skill Development'
  | 'Personal Growth'
  | 'Planners & Organizers'
  | 'Bundles'
  | 'Digital Notebooks'
  | 'Code Libraries'
  | 'Digital Journals'
  | 'AI Services'
  | 'Psychology'
  | 'Economics';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  rating?: number;
  reviewCount?: number;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  hasStaticContent?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
}

// This User type is for placeholder data, not for authenticated users.
// Authenticated user data comes from Firebase Auth and Firestore.
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  browsingHistory: string[];
  purchaseHistory: string[];
}

export interface SalesData {
  name: string;
  total: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Order {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  createdAt: any; // Firestore Timestamp
  items: OrderItem[];
  totalAmount: number;
  userUpiId?: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  feedback?: string;
  suggestion?: string;
  createdAt: any; // Firestore Timestamp
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  createdAt: any; // Firestore Timestamp
}
