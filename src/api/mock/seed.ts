/** Simulated traders. Phones follow the contract's demo numbers. */
export interface SeedTrader {
  trader_id: number;
  shop_name: string;
  type: string;
  phone: string;
  /** Average expected daily M-PESA sales in KES. */
  base_daily_sales: number;
  /** Rent, supplier costs and existing debts due in the next 7 days. */
  weekly_obligations: number;
}

export const SEED_TRADERS: SeedTrader[] = [
  {
    trader_id: 101,
    shop_name: 'Mama Njeri General Store',
    type: 'general',
    phone: '+254700000101',
    base_daily_sales: 9500,
    weekly_obligations: 21000,
  },
  {
    trader_id: 102,
    shop_name: 'Baraka Kiosk',
    type: 'kiosk',
    phone: '+254700000102',
    base_daily_sales: 4500,
    weekly_obligations: 14000,
  },
  {
    trader_id: 103,
    shop_name: 'Wanjiku Cereals',
    type: 'cereals',
    phone: '+254700000103',
    base_daily_sales: 11500,
    weekly_obligations: 25000,
  },
];

/** Index = UTC weekday (0 = Sunday). Factors sum to 7 so a week averages to the base. */
export const WEEKDAY_FACTORS = [1.05, 0.85, 0.9, 0.95, 1.0, 1.15, 1.1];

export const STOCK_ITEMS = ['Cooking oil', 'Sugar', 'Maize flour', 'Rice', 'Milk', 'Bread'];

export const DISPUTE_REASONS = ['Wrong balance', 'Double deduction', 'Other'];
