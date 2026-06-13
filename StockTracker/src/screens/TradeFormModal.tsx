import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Trade, TradeSide } from '../types';
import { useStore } from '../store/useStore';

interface Props {
  visible: boolean;
  trade: Trade | null;
  onClose: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TradeFormModal({ visible, trade, onClose }: Props) {
  const { addTrade, updateTrade } = useStore();

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [side, setSide] = useState<TradeSide>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol);
      setName(trade.name);
      setSide(trade.side);
      setQuantity(String(trade.quantity));
      setPrice(String(trade.price));
      setFee(String(trade.fee));
      setDate(trade.date);
      setNote(trade.note ?? '');
    } else {
      setSymbol('');
      setName('');
      setSide('buy');
      setQuantity('');
      setPrice('');
      setFee('30');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [trade, visible]);

  const handleSubmit = () => {
    if (!symbol.trim() || !quantity || !price || !date) {
      Alert.alert('請填寫必填欄位', '股票代號、數量、價格和日期為必填');
      return;
    }

    const tradeData: Trade = {
      id: trade?.id ?? generateId(),
      symbol: symbol.toUpperCase().trim(),
      name: name.trim() || symbol.toUpperCase().trim(),
      side,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fee: parseFloat(fee) || 0,
      date,
      note: note.trim() || undefined,
    };

    if (trade) {
      updateTrade(tradeData);
    } else {
      addTrade(tradeData);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{trade ? '編輯交易' : '新增交易'}</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.save}>儲存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* 買/賣切換 */}
          <View style={styles.sideToggle}>
            <TouchableOpacity
              style={[styles.sideBtn, side === 'buy' && styles.sideBtnActiveBuy]}
              onPress={() => setSide('buy')}
            >
              <Text style={[styles.sideBtnText, side === 'buy' && styles.sideBtnTextActive]}>
                買入
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideBtn, side === 'sell' && styles.sideBtnActiveSell]}
              onPress={() => setSide('sell')}
            >
              <Text style={[styles.sideBtnText, side === 'sell' && styles.sideBtnTextActive]}>
                賣出
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>股票代號 *</Text>
              <TextInput
                style={styles.input}
                value={symbol}
                onChangeText={setSymbol}
                placeholder="例：2330 或 AAPL"
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.field, { flex: 1.5 }]}>
              <Text style={styles.label}>股票名稱</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例：台積電"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>數量（股）*</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1000"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>價格（元）*</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="100.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>手續費（元）</Text>
              <TextInput
                style={styles.input}
                value={fee}
                onChangeText={setFee}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>交易日期 *</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2025-01-01"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>備註</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="選填"
              multiline
              numberOfLines={3}
            />
          </View>

          {quantity && price ? (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>交易金額預覽</Text>
              <Text style={styles.previewValue}>
                {(parseFloat(quantity || '0') * parseFloat(price || '0')).toLocaleString('zh-TW')} 元
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  cancel: { fontSize: 16, color: '#64748b' },
  save: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  form: { padding: 16 },
  sideToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  sideBtnActiveBuy: { backgroundColor: '#16a34a' },
  sideBtnActiveSell: { backgroundColor: '#dc2626' },
  sideBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  sideBtnTextActive: { color: '#fff' },
  row: { flexDirection: 'row', marginBottom: 0 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  preview: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  previewLabel: { fontSize: 13, color: '#3b82f6' },
  previewValue: { fontSize: 20, fontWeight: '700', color: '#1d4ed8', marginTop: 4 },
});
