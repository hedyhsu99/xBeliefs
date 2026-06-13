export type TradeSide = 'buy' | 'sell';

export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'irregular';

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee: number;
  date: string; // ISO date string
  note?: string;
}

export interface Dividend {
  id: string;
  symbol: string;
  name: string;
  frequency: DividendFrequency;
  amountPerShare: number;
  exDividendDate: string;
  paymentDate: string;
  quantity: number;
  totalAmount: number;
  note?: string;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
}

export interface PortfolioSummary {
  totalCost: number;
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  totalRealizedPnL: number;
  totalDividends: number;
  totalPnL: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}
