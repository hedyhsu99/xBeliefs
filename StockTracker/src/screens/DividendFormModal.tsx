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
import { Dividend, DividendFrequency } from '../types';
import { useStore } from '../store/useStore';
import { dividendFrequencyLabel } from '../utils/calculations';

interface Props {
  visible: boolean;
  dividend: Dividend | null;
  onClose: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const FREQUENCIES: DividendFrequency[] = ['monthly', 'quarterly', 'semi-annual', 'annual', 'irregular'];

export function DividendFormModal({ visible, dividend, onClose }: Props) {
  const { addDividend, updateDividend } = useStore();

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<DividendFrequency>('quarterly');
  const [amountPerShare, setAmountPerShare] = useState('');
  const [quantity, setQuantity] = useState('');
  const [exDividendDate, setExDividendDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (dividend) {
      setSymbol(dividend.symbol);
      setName(dividend.name);
      setFrequency(dividend.frequency);
      setAmountPerShare(String(dividend.amountPerShare));
      setQuantity(String(dividend.quantity));
      setExDividendDate(dividend.exDividendDate);
      setPaymentDate(dividend.paymentDate);
      setNote(dividend.note ?? '');
    } else {
      setSymbol('');
      setName('');
      setFrequency('quarterly');
      setAmountPerShare('');
      setQuantity('');
      setExDividendDate(new Date().toISOString().split('T')[0]);
      setPaymentDate('');
      setNote('');
    }
  }, [dividend, visible]);

  const totalAmount = parseFloat(amountPerShare || '0') * parseFloat(quantity || '0');

  const handleSubmit = () => {
    if (!symbol.trim() || !amountPerShare || !quantity || !exDividendDate) {
      Alert.alert('請填寫必填欄位', '股票代號、每股股利、持有股數和除息日為必填');
      return;
    }

    const data: Dividend = {
      id: dividend?.id ?? generateId(),
      symbol: symbol.toUpperCase().trim(),
      name: name.trim() || symbol.toUpperCase().trim(),
      frequency,
      amountPerShare: parseFloat(amountPerShare),
      quantity: parseFloat(quantity),
      totalAmount,
      exDividendDate,
      paymentDate: paymentDate || exDividendDate,
      note: note.trim() || undefined,
    };

    if (dividend) {
      updateDividend(data);
    } else {
      addDividend(data);
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
          <Text style={styles.title}>{dividend ? '編輯配息' : '新增配息記錄'}</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.save}>儲存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>股票代號 *</Text>
              <TextInput
                style={styles.input}
                value={symbol}
                onChangeText={setSymbol}
                placeholder="例：0050"
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.field, { flex: 1.5 }]}>
              <Text style={styles.label}>股票名稱</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例：台灣50"
              />
            </View>
          </View>

          {/* 配息頻率 */}
          <View style={styles.field}>
            <Text style={styles.label}>配息頻率</Text>
            <View style={styles.freqContainer}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>
                    {dividendFrequencyLabel(f)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>每股股利（元）*</Text>
              <TextInput
                style={styles.input}
                value={amountPerShare}
                onChangeText={setAmountPerShare}
                placeholder="1.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>持有股數 *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1000"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>除息日 *</Text>
              <TextInput
                style={styles.input}
                value={exDividendDate}
                onChangeText={setExDividendDate}
                placeholder="2025-07-01"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>發放日</Text>
              <TextInput
                style={styles.input}
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="2025-08-15"
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
              numberOfLines={2}
            />
          </View>

          {totalAmount > 0 && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>股利總金額</Text>
              <Text style={styles.previewValue}>
                {totalAmount.toLocaleString('zh-TW')} 元
              </Text>
            </View>
          )}
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
  save: { fontSize: 16, color: '#059669', fontWeight: '600' },
  form: { padding: 16 },
  row: { flexDirection: 'row' },
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
  textArea: { height: 70, textAlignVertical: 'top' },
  freqContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  freqBtnActive: { backgroundColor: '#059669' },
  freqBtnText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  freqBtnTextActive: { color: '#fff' },
  preview: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  previewLabel: { fontSize: 13, color: '#059669' },
  previewValue: { fontSize: 22, fontWeight: '700', color: '#065f46', marginTop: 4 },
});
