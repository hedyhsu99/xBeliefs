import { StockQuote } from '../types';

// 使用 Yahoo Finance 非官方 API 查詢股價（免費，無需 API Key）
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// 台股代號補上 .TW 後綴
function toYahooSymbol(symbol: string): string {
  // 如果已有後綴則不處理
  if (symbol.includes('.')) return symbol;
  // 純數字視為台股
  if (/^\d+$/.test(symbol)) return `${symbol}.TW`;
  return symbol;
}

export async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const yahooSymbol = toYahooSymbol(symbol);
    const url = `${YAHOO_FINANCE_BASE}/${yahooSymbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      price,
      change,
      changePercent,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  const results: Record<string, StockQuote> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      const q = await fetchQuote(sym);
      if (q) results[sym] = q;
    })
  );
  return results;
}
