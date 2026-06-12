import { create } from 'zustand';
import { Trade, Dividend, StockQuote } from '../types';
import { loadTrades, saveTrades, loadDividends, saveDividends } from '../services/storage';
import { fetchMultipleQuotes } from '../services/stockApi';
import { calculatePositions, calculatePortfolioSummary } from '../utils/calculations';

interface AppState {
  trades: Trade[];
  dividends: Dividend[];
  quotes: Record<string, StockQuote>;
  isLoadingQuotes: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  addDividend: (dividend: Dividend) => Promise<void>;
  updateDividend: (dividend: Dividend) => Promise<void>;
  deleteDividend: (id: string) => Promise<void>;
  refreshQuotes: () => Promise<void>;

  // Computed selectors (called as functions to stay reactive)
  getPositions: () => ReturnType<typeof calculatePositions>;
  getPortfolioSummary: () => ReturnType<typeof calculatePortfolioSummary>;
}

export const useStore = create<AppState>((set, get) => ({
  trades: [],
  dividends: [],
  quotes: {},
  isLoadingQuotes: false,
  isInitialized: false,

  initialize: async () => {
    const [trades, dividends] = await Promise.all([loadTrades(), loadDividends()]);
    set({ trades, dividends, isInitialized: true });
    // 非阻塞的背景查詢股價
    get().refreshQuotes();
  },

  addTrade: async (trade) => {
    const trades = [...get().trades, trade];
    set({ trades });
    await saveTrades(trades);
    await get().refreshQuotes();
  },

  updateTrade: async (trade) => {
    const trades = get().trades.map((t) => (t.id === trade.id ? trade : t));
    set({ trades });
    await saveTrades(trades);
  },

  deleteTrade: async (id) => {
    const trades = get().trades.filter((t) => t.id !== id);
    set({ trades });
    await saveTrades(trades);
  },

  addDividend: async (dividend) => {
    const dividends = [...get().dividends, dividend];
    set({ dividends });
    await saveDividends(dividends);
  },

  updateDividend: async (dividend) => {
    const dividends = get().dividends.map((d) => (d.id === dividend.id ? dividend : d));
    set({ dividends });
    await saveDividends(dividends);
  },

  deleteDividend: async (id) => {
    const dividends = get().dividends.filter((d) => d.id !== id);
    set({ dividends });
    await saveDividends(dividends);
  },

  refreshQuotes: async () => {
    const { trades } = get();
    const symbols = [...new Set(trades.map((t) => t.symbol))];
    if (symbols.length === 0) return;

    set({ isLoadingQuotes: true });
    const quotesMap = await fetchMultipleQuotes(symbols);
    set({ quotes: quotesMap, isLoadingQuotes: false });
  },

  getPositions: () => {
    const { trades, quotes } = get();
    const priceMap: Record<string, number> = {};
    Object.entries(quotes).forEach(([sym, q]) => {
      priceMap[sym] = q.price;
    });
    return calculatePositions(trades, priceMap);
  },

  getPortfolioSummary: () => {
    const { dividends } = get();
    const positions = get().getPositions();
    return calculatePortfolioSummary(positions, dividends);
  },
}));
