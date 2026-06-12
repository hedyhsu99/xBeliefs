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
import { Trade } from '../types';
import { formatCurrency } from '../utils/calculations';
import { TradeFormModal } from './TradeFormModal';

export function TradesScreen() {
  const { trades, deleteTrade } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = (trade: Trade) => {
    Alert.alert('刪除交易', `確定要刪除 ${trade.symbol} 的 ${trade.side === 'buy' ? '買入' : '賣出'} 記錄嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => deleteTrade(trade.id),
      },
    ]);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTrade(null);
    setShowForm(true);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTrades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>尚無交易記錄</Text>
            <Text style={styles.emptySubText}>點擊右下角 + 新增第一筆交易</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => handleDelete(item)}
            onPress={() => handleEdit(item)}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.badge, item.side === 'buy' ? styles.buyBadge : styles.sellBadge]}>
                <Text style={styles.badgeText}>{item.side === 'buy' ? '買' : '賣'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.qty}>{item.quantity} 股</Text>
              <Text style={styles.price}>@{formatCurrency(item.price)}</Text>
              <Text style={styles.total}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
              {item.fee > 0 && (
                <Text style={styles.fee}>手續費 {formatCurrency(item.fee)}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TradeFormModal
        visible={showForm}
        trade={editingTrade}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buyBadge: { backgroundColor: '#dcfce7' },
  sellBadge: { backgroundColor: '#fee2e2' },
  badgeText: { fontWeight: '700', fontSize: 14 },
  cardInfo: { flex: 1 },
  symbol: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  name: { fontSize: 12, color: '#64748b' },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  qty: { fontSize: 14, fontWeight: '600', color: '#334155' },
  price: { fontSize: 12, color: '#64748b' },
  total: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  fee: { fontSize: 11, color: '#94a3b8' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
});
