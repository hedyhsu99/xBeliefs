import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useStore } from '../store/useStore';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { PnLBadge } from '../components/PnLBadge';

const { width } = Dimensions.get('window');

export function AnalyticsScreen() {
  const { trades, dividends, getPositions, getPortfolioSummary } = useStore();
  const positions = getPositions();
  const summary = getPortfolioSummary();

  const allPositions = positions; // 包含已清倉的
  const holdingPositions = positions.filter((p) => p.quantity > 0);

  // 計算贏率
  const closedPositions = positions.filter((p) => p.quantity === 0 && p.realizedPnL !== 0);
  const winCount = closedPositions.filter((p) => p.realizedPnL > 0).length;
  const winRate = closedPositions.length > 0 ? (winCount / closedPositions.length) * 100 : 0;

  // 按損益排名
  const sortedByPnL = [...holdingPositions].sort(
    (a, b) => b.unrealizedPnL - a.unrealizedPnL
  );

  // 配息統計（按股票分組）
  const dividendBySymbol: Record<string, number> = {};
  dividends.forEach((d) => {
    dividendBySymbol[d.symbol] = (dividendBySymbol[d.symbol] ?? 0) + d.totalAmount;
  });
  const dividendRanking = Object.entries(dividendBySymbol)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // 計算投資組合比例（以市值）
  const totalMV = holdingPositions.reduce((sum, p) => sum + p.marketValue, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 關鍵指標 */}
      <Text style={styles.sectionTitle}>關鍵指標</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>總投入成本</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.totalCost)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>目前市值</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.totalMarketValue)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>未實現損益</Text>
          <PnLBadge
            value={summary.totalUnrealizedPnL}
            percent={summary.totalUnrealizedPnLPercent}
            style={styles.metricPnl}
          />
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>已實現損益</Text>
          <PnLBadge value={summary.totalRealizedPnL} style={styles.metricPnl} />
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>股利收入</Text>
          <PnLBadge value={summary.totalDividends} style={styles.metricPnl} />
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>交易筆數</Text>
          <Text style={styles.metricValue}>{trades.length} 筆</Text>
        </View>
      </View>

      {/* 贏率 */}
      {closedPositions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>交易勝率</Text>
          <View style={styles.winRateCard}>
            <View style={styles.winRateBar}>
              <View
                style={[styles.winBarFill, { width: `${winRate}%`, backgroundColor: '#16a34a' }]}
              />
              <View
                style={[styles.winBarFill, { width: `${100 - winRate}%`, backgroundColor: '#dc2626' }]}
              />
            </View>
            <View style={styles.winRateLabels}>
              <Text style={styles.winLabel}>
                <Text style={{ color: '#16a34a' }}>● </Text>獲利 {winCount} 筆
              </Text>
              <Text style={styles.winRateText}>{winRate.toFixed(1)}%</Text>
              <Text style={styles.winLabel}>
                虧損 {closedPositions.length - winCount} 筆<Text style={{ color: '#dc2626' }}> ●</Text>
              </Text>
            </View>
          </View>
        </>
      )}

      {/* 持倉損益排名 */}
      {sortedByPnL.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>持倉損益排名</Text>
          {sortedByPnL.map((pos, i) => (
            <View key={pos.symbol} style={styles.rankCard}>
              <View style={styles.rankLeft}>
                <Text style={styles.rankNum}>#{i + 1}</Text>
                <View>
                  <Text style={styles.rankSymbol}>{pos.symbol}</Text>
                  <Text style={styles.rankName}>{pos.name}</Text>
                </View>
              </View>
              <View style={styles.rankRight}>
                <PnLBadge value={pos.unrealizedPnL} percent={pos.unrealizedPnLPercent} />
                {totalMV > 0 && (
                  <Text style={styles.rankWeight}>
                    {((pos.marketValue / totalMV) * 100).toFixed(1)}% 比重
                  </Text>
                )}
              </View>
            </View>
          ))}
        </>
      )}

      {/* 配息排名 */}
      {dividendRanking.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>股利收入排名</Text>
          {dividendRanking.map(([symbol, amount], i) => (
            <View key={symbol} style={styles.rankCard}>
              <View style={styles.rankLeft}>
                <Text style={styles.rankNum}>#{i + 1}</Text>
                <Text style={styles.rankSymbol}>{symbol}</Text>
              </View>
              <Text style={[styles.rankSymbol, { color: '#059669' }]}>
                {formatCurrency(amount)}
              </Text>
            </View>
          ))}
        </>
      )}

      {allPositions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>新增交易記錄後，分析資料將顯示於此</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  metricValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  metricPnl: { fontSize: 15 },
  winRateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  winRateBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  winBarFill: { height: '100%' },
  winRateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winLabel: { fontSize: 13, color: '#64748b' },
  winRateText: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  rankCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#94a3b8', width: 30 },
  rankSymbol: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  rankName: { fontSize: 12, color: '#64748b' },
  rankRight: { alignItems: 'flex-end' },
  rankWeight: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
});
