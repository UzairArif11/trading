export interface Order {
  id: number;
  created_at: Date | null;
  symbol: string;
  quantity: number;
  direction: string;
  entry_price: number;
  TP: number;
  SL: number;
  netEUR: number;
  quote_asset:string,
  status: string;
  userId: number;
  margin: number;
  exit_price: number;
  order_id: string;
  status_updated_at: Date | null;
  totalUnrealizedPnL: number;
  expires_at: string | Date | null;
  comment: string;
  amount: number;
  asset_type: string;
  converted_entry_price: number;
  exchange_rate: number;
  lot_size: number;
  trade_type: string;
  lot_step: number;
}