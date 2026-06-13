import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import { PnLBadge } from '../components/PnLBadge';
import { formatCurrency } from '../utils/calculations';

export function PortfolioScreen() {
  const { isLoadingQuotes, refreshQuotes, getPositions, getPortfolioSummary, isInitialized } =
    useStore();

  const positions = getPositions();
  const summary = getPortfolioSummary();

  useEffect(() => {
    if (isInitialized) refreshQuotes();
  }, [isInitialized]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoadingQuotes} onRefresh={refreshQuotes} />}
    >
      {/* 總覽卡片 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>投資組合總覽</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>市值</Text>
            <Text style={styles.bigValue}>{formatCurrency(summary.totalMarketValue)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>成本</Text>
            <Text style={styles.bigValue}>{formatCurrency(summary.totalCost)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>未實現損益</Text>
            <PnLBadge
              value={summary.totalUnrealizedPnL}
              percent={summary.totalUnrealizedPnLPercent}
              style={styles.pnlValue}
            />
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>已實現損益</Text>
            <PnLBadge value={summary.totalRealizedPnL} style={styles.pnlValue} />
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>股利收入</Text>
            <PnLBadge value={summary.totalDividends} style={styles.pnlValue} />
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>總損益</Text>
            <PnLBadge value={summary.totalPnL} style={styles.pnlValue} />
          </View>
        </View>
      </View>

      {/* 持倉列表 */}
      <Text style={styles.sectionTitle}>持倉明細</Text>
      {positions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>尚無持倉，請至「交易」頁面新增記錄</Text>
        </View>
      ) : (
        positions
          .filter((p) => p.quantity > 0)
          .map((pos) => (
            <View key={pos.symbol} style={styles.positionCard}>
              <View style={styles.positionHeader}>
                <View>
                  <Text style={styles.symbol}>{pos.symbol}</Text>
                  <Text style={styles.name}>{pos.name}</Text>
                </View>
                <View style={styles.positionRight}>
                  {isLoadingQuotes ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.price}>
                      {pos.currentPrice > 0 ? formatCurrency(pos.currentPrice) : '---'}
                    </Text>
                  )}
                  <Text style={styles.qty}>{pos.quantity} 股</Text>
                </View>
              </View>
              <View style={styles.positionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>市值</Text>
                  <Text style={styles.detailValue}>{formatCurrency(pos.marketValue)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>均成本</Text>
                  <Text style={styles.detailValue}>{formatCurrency(pos.averageCost)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>未實現損益</Text>
                  <PnLBadge value={pos.unrealizedPnL} percent={pos.unrealizedPnLPercent} />
                </View>
                {pos.realizedPnL !== 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>已實現損益</Text>
                    <PnLBadge value={pos.realizedPnL} />
                  </View>
                )}
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
  },
  summaryTitle: { color: '#93c5fd', fontSize: 14, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', marginBottom: 8 },
  summaryItem: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  bigValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  pnlValue: { fontSize: 15 },
  divider: { height: 1, backgroundColor: '#2d5282', marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginHorizontal: 16, marginBottom: 8 },
  positionCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  symbol: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  name: { fontSize: 12, color: '#64748b', marginTop: 2 },
  positionRight: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '600', color: '#334155' },
  qty: { fontSize: 12, color: '#64748b', marginTop: 2 },
  positionDetails: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
