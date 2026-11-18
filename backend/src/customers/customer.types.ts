export interface CustomerCacheEntry {
  _id: string;
  name: string;
  email: string;
  type: 'NORMAL';
  parent_customer_id: string | null;
  created_at: string;
}

export interface CustomerResponse {
  customer_id: string;
  name: string;
  email: string;
  type: 'NORMAL';
  parent_customer_id: string | null;
  created_at: string;
}
