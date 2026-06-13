import { Trade, Position, PortfolioSummary, Dividend } from '../types';

export function calculatePositions(trades: Trade[], quotes: Record<string, number>): Position[] {
  const positionMap: Record<string, {
    symbol: string;
    name: string;
    buyQuantity: number;
    sellQuantity: number;
    totalBuyCost: number;
    realizedPnL: number;
    buyLots: Array<{ quantity: number; price: number }>;
  }> = {};

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const trade of sortedTrades) {
    if (!positionMap[trade.symbol]) {
      positionMap[trade.symbol] = {
        symbol: trade.symbol,
        name: trade.name,
        buyQuantity: 0,
        sellQuantity: 0,
        totalBuyCost: 0,
        realizedPnL: 0,
        buyLots: [],
      };
    }

    const pos = positionMap[trade.symbol];

    if (trade.side === 'buy') {
      pos.buyQuantity += trade.quantity;
      pos.totalBuyCost += trade.quantity * trade.price + trade.fee;
      pos.buyLots.push({ quantity: trade.quantity, price: trade.price + trade.fee / trade.quantity });
    } else {
      // FIFO 計算已實現損益
      let remainingToSell = trade.quantity;
      let sellProceeds = trade.quantity * trade.price - trade.fee;
      let costBasis = 0;

      while (remainingToSell > 0 && pos.buyLots.length > 0) {
        const lot = pos.buyLots[0];
        if (lot.quantity <= remainingToSell) {
          costBasis += lot.quantity * lot.price;
          remainingToSell -= lot.quantity;
          pos.buyLots.shift();
        } else {
          costBasis += remainingToSell * lot.price;
          lot.quantity -= remainingToSell;
          remainingToSell = 0;
        }
      }

      pos.realizedPnL += sellProceeds - costBasis;
      pos.sellQuantity += trade.quantity;
    }
  }

  return Object.values(positionMap)
    .map((pos) => {
      const remainingQty = pos.buyQuantity - pos.sellQuantity;
      const remainingCost = pos.buyLots.reduce((sum, lot) => sum + lot.quantity * lot.price, 0);
      const avgCost = remainingQty > 0 ? remainingCost / remainingQty : 0;
      const currentPrice = quotes[pos.symbol] ?? 0;
      const marketValue = remainingQty * currentPrice;
      const unrealizedPnL = marketValue - remainingCost;
      const unrealizedPnLPercent = remainingCost > 0 ? (unrealizedPnL / remainingCost) * 100 : 0;

      return {
        symbol: pos.symbol,
        name: pos.name,
        quantity: remainingQty,
        averageCost: avgCost,
        totalCost: remainingCost,
        currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        realizedPnL: pos.realizedPnL,
      };
    })
    .filter((pos) => pos.quantity > 0 || pos.realizedPnL !== 0);
}

export function calculatePortfolioSummary(
  positions: Position[],
  dividends: Dividend[]
): PortfolioSummary {
  const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalUnrealizedPnL = totalMarketValue - totalCost;
  const totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;
  const totalRealizedPnL = positions.reduce((sum, p) => sum + p.realizedPnL, 0);
  const totalDividends = dividends.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPnL = totalUnrealizedPnL + totalRealizedPnL + totalDividends;

  return {
    totalCost,
    totalMarketValue,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    totalRealizedPnL,
    totalDividends,
    totalPnL,
  };
}

export function formatCurrency(value: number, currency = 'TWD'): string {
  if (currency === 'TWD') {
    return `NT$ ${value.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function dividendFrequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    monthly: '月配',
    quarterly: '季配',
    'semi-annual': '半年配',
    annual: '年配',
    irregular: '不定期',
  };
  return map[freq] ?? freq;
}
