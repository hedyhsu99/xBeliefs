import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Dividend } from '../types';
import { formatCurrency, dividendFrequencyLabel } from '../utils/calculations';
import { DividendFormModal } from './DividendFormModal';

export function DividendsScreen() {
  const { dividends, deleteDividend } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingDividend, setEditingDividend] = useState<Dividend | null>(null);

  const totalDividends = dividends.reduce((sum, d) => sum + d.totalAmount, 0);

  const sortedDividends = [...dividends].sort(
    (a, b) => new Date(b.exDividendDate).getTime() - new Date(a.exDividendDate).getTime()
  );

  const handleDelete = (d: Dividend) => {
    Alert.alert('刪除配息記錄', `確定要刪除 ${d.symbol} 的配息記錄嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => deleteDividend(d.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 統計卡片 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>股利收入總計</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalDividends)}</Text>
        <Text style={styles.summaryCount}>{dividends.length} 筆記錄</Text>
      </View>

      <FlatList
        data={sortedDividends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>尚無配息記錄</Text>
            <Text style={styles.emptySubText}>點擊右下角 + 新增配息記錄</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => handleDelete(item)}
            onPress={() => {
              setEditingDividend(item);
              setShowForm(true);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.symbolRow}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <View style={styles.freqBadge}>
                  <Text style={styles.freqText}>{dividendFrequencyLabel(item.frequency)}</Text>
                </View>
              </View>
              <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>每股股利</Text>
                <Text style={styles.detailValue}>{formatCurrency(item.amountPerShare)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>持有股數</Text>
                <Text style={styles.detailValue}>{item.quantity} 股</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>除息日</Text>
                <Text style={styles.detailValue}>{item.exDividendDate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>發放日</Text>
                <Text style={styles.detailValue}>{item.paymentDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingDividend(null);
          setShowForm(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <DividendFormModal
        visible={showForm}
        dividend={editingDividend}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#065f46',
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryLabel: { color: '#6ee7b7', fontSize: 13 },
  summaryValue: { color: '#fff', fontSize: 28, fontWeight: '700', marginVertical: 4 },
  summaryCount: { color: '#a7f3d0', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  freqBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freqText: { fontSize: 11, color: '#065f46', fontWeight: '600' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#059669' },
  name: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 10 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem: { width: '47%' },
  detailLabel: { fontSize: 11, color: '#94a3b8' },
  detailValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
});
