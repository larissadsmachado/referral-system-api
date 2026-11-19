export interface CustomerCacheEntry {  //formato do cliente guardado no Redis.
  _id: string;
  name: string;
  email: string;
  type: 'NORMAL';
  parent_customer_id: string | null;
  created_at: string;
}

//formato do cliente devolvido pela API
export interface CustomerResponse { 
  customer_id: string;
  name: string;
  email: string;
  type: 'NORMAL';
  parent_customer_id: string | null;
  created_at: string;
}
