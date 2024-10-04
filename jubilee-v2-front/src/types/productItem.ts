export interface IProductSync {
  description: string;
  id: string;
  image_url: string;
  image_url_thumb: string;
  synced: boolean;
  title: string;
}

export interface IProduct {
  category: string;
  description: string;
  id: string;
  image_url: string;
  image_url_thumb: string;
  keywords: string[];
  optimized: boolean;
  premium_keywords: string[];
  product_type: string;
  title: string;
  vendor: string;
}

export interface ISyncPayload {
  ids: string[];
}