import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { fetchQuote } from '../services/stockApi';
import { StockQuote } from '../types';
import { useStore } from '../store/useStore';

export function QuoteScreen() {
  const { quotes, isLoadingQuotes, refreshQuotes } = useStore();
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchResult, setSearchResult] = useState<StockQuote | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchSymbol.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    const result = await fetchQuote(searchSymbol.trim());
    setSearchResult(result ?? 'not_found');
    setIsSearching(false);
  };

  const portfolioQuotes = Object.values(quotes);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 查詢輸入 */}
      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>查詢股票即時報價</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchSymbol}
            onChangeText={setSearchSymbol}
            placeholder="輸入代號（例：2330 或 AAPL）"
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>查詢</Text>
            )}
          </TouchableOpacity>
        </View>

        {searchResult && searchResult !== 'not_found' && (
          <View style={styles.resultCard}>
            <View style={styles.resultLeft}>
              <Text style={styles.resultSymbol}>{searchResult.symbol}</Text>
              <Text style={styles.resultTime}>
                更新：{new Date(searchResult.lastUpdated).toLocaleTimeString('zh-TW')}
              </Text>
            </View>
            <View style={styles.resultRight}>
              <Text style={styles.resultPrice}>{searchResult.price.toFixed(2)}</Text>
              <Text
                style={[
                  styles.resultChange,
                  { color: searchResult.change >= 0 ? '#16a34a' : '#dc2626' },
                ]}
              >
                {searchResult.change >= 0 ? '+' : ''}{searchResult.change.toFixed(2)} (
                {searchResult.change >= 0 ? '+' : ''}{searchResult.changePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}
        {searchResult === 'not_found' && (
          <Text style={styles.notFound}>找不到此股票，請確認代號是否正確</Text>
        )}
      </View>

      {/* 持倉報價 */}
      <View style={styles.portfolioSection}>
        <View style={styles.portfolioHeader}>
          <Text style={styles.sectionTitle}>持倉即時報價</Text>
          <TouchableOpacity onPress={refreshQuotes} disabled={isLoadingQuotes}>
            {isLoadingQuotes ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={styles.refreshText}>重新整理</Text>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={portfolioQuotes}
          keyExtractor={(item) => item.symbol}
          ListEmptyComponent={
            <Text style={styles.emptyText}>尚無持倉股票可顯示，請先新增交易記錄</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.quoteCard}>
              <View>
                <Text style={styles.quoteSymbol}>{item.symbol}</Text>
                <Text style={styles.quoteTime}>
                  {new Date(item.lastUpdated).toLocaleTimeString('zh-TW')}
                </Text>
              </View>
              <View style={styles.quoteRight}>
                <Text style={styles.quotePrice}>{item.price.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.quoteChange,
                    { color: item.change >= 0 ? '#16a34a' : '#dc2626' },
                  ]}
                >
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchTitle: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  searchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  resultLeft: {},
  resultSymbol: { fontSize: 20, fontWeight: '700', color: '#0c4a6e' },
  resultTime: { fontSize: 11, color: '#7dd3fc', marginTop: 2 },
  resultRight: { alignItems: 'flex-end' },
  resultPrice: { fontSize: 24, fontWeight: '700', color: '#0c4a6e' },
  resultChange: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  notFound: { color: '#ef4444', marginTop: 10, fontSize: 14 },
  portfolioSection: { flex: 1, padding: 16 },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  refreshText: { color: '#2563eb', fontSize: 14 },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  quoteSymbol: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  quoteTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  quoteRight: { alignItems: 'flex-end' },
  quotePrice: { fontSize: 18, fontWeight: '700', color: '#334155' },
  quoteChange: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 30 },
});
