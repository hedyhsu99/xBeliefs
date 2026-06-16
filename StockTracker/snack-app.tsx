import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, Modal, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// ── 型別 ──────────────────────────────────────────────
type TradeSide = 'buy' | 'sell';
type DivFreq = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'irregular';

interface Trade {
  id: string; symbol: string; name: string; side: TradeSide;
  quantity: number; price: number; fee: number; date: string; note?: string;
}
interface Dividend {
  id: string; symbol: string; name: string; frequency: DivFreq;
  amountPerShare: number; quantity: number; totalAmount: number;
  exDividendDate: string; paymentDate: string; note?: string;
}
interface Position {
  symbol: string; name: string; quantity: number; averageCost: number;
  totalCost: number; currentPrice: number; marketValue: number;
  unrealizedPnL: number; unrealizedPnLPercent: number; realizedPnL: number;
}

// ── 工具函數 ──────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fmt = (v: number) => `NT$ ${v.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const freqLabel: Record<string, string> = {
  monthly: '月配', quarterly: '季配', 'semi-annual': '半年配',
  annual: '年配', irregular: '不定期',
};

function calcPositions(trades: Trade[], prices: Record<string, number>): Position[] {
  const map: Record<string, { symbol: string; name: string; lots: { qty: number; price: number }[]; realizedPnL: number; buyQty: number; sellQty: number }> = {};
  [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(t => {
    if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, name: t.name, lots: [], realizedPnL: 0, buyQty: 0, sellQty: 0 };
    const m = map[t.symbol];
    if (t.side === 'buy') {
      m.buyQty += t.quantity;
      m.lots.push({ qty: t.quantity, price: t.price + t.fee / t.quantity });
    } else {
      let rem = t.quantity, proceeds = t.quantity * t.price - t.fee, cost = 0;
      while (rem > 0 && m.lots.length > 0) {
        const l = m.lots[0];
        if (l.qty <= rem) { cost += l.qty * l.price; rem -= l.qty; m.lots.shift(); }
        else { cost += rem * l.price; l.qty -= rem; rem = 0; }
      }
      m.realizedPnL += proceeds - cost;
      m.sellQty += t.quantity;
    }
  });
  return Object.values(map).map(m => {
    const qty = m.buyQty - m.sellQty;
    const cost = m.lots.reduce((s, l) => s + l.qty * l.price, 0);
    const avgCost = qty > 0 ? cost / qty : 0;
    const cp = prices[m.symbol] ?? 0;
    const mv = qty * cp;
    const upnl = mv - cost;
    return { symbol: m.symbol, name: m.name, quantity: qty, averageCost: avgCost, totalCost: cost, currentPrice: cp, marketValue: mv, unrealizedPnL: upnl, unrealizedPnLPercent: cost > 0 ? (upnl / cost) * 100 : 0, realizedPnL: m.realizedPnL };
  }).filter(p => p.quantity > 0 || p.realizedPnL !== 0);
}

// ── 股價查詢 ──────────────────────────────────────────
async function fetchPrice(symbol: string): Promise<number> {
  const isTW = /^\d{4,}$/.test(symbol);
  const yahooSymbol = isTW ? `${symbol}.TW` : symbol;

  // 方法一：TWSE 即時 API（台股，盤中用 z，收盤後用 y）
  if (isTW) {
    try {
      const r = await fetch(
        `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${symbol}.tw&json=1&delay=0`,
        { headers: { Accept: 'application/json', Referer: 'https://mis.twse.com.tw' } }
      );
      const d = await r.json();
      const info = d?.msgArray?.[0];
      if (info) {
        const z = info.z; // 盤中即時價
        const y = info.y; // 昨日收盤
        if (z && z !== '-') return parseFloat(z);
        if (y && y !== '-') return parseFloat(y);
      }
    } catch {}
  }

  // 方法二：Yahoo Finance v8（台股加 .TW、美股直接用）
  try {
    const r = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', Accept: 'application/json' } }
    );
    const d = await r.json();
    const p = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (p) return p;
  } catch {}

  // 方法三：Yahoo Finance v7 quote
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', Accept: 'application/json' } }
    );
    const d = await r.json();
    const p = d?.quoteResponse?.result?.[0]?.regularMarketPrice;
    if (p) return p;
  } catch {}

  return 0;
}

// ── 顏色元件 ──────────────────────────────────────────
function PnL({ value, pct, size = 14 }: { value: number; pct?: number; size?: number }) {
  const c = value >= 0 ? '#16a34a' : '#dc2626';
  const s = value >= 0 ? '+' : '';
  return (
    <Text style={{ color: c, fontWeight: '600', fontSize: size }}>
      {s}{value.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}
      {pct !== undefined ? ` (${fmtPct(pct)})` : ''}
    </Text>
  );
}

// ── 主 App ────────────────────────────────────────────
type Tab = 'portfolio' | 'trades' | 'dividends' | 'analytics' | 'quote';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('portfolio');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('trades').then(v => v && setTrades(JSON.parse(v)));
    AsyncStorage.getItem('dividends').then(v => v && setDividends(JSON.parse(v)));
  }, []);

  const saveTrades = (t: Trade[]) => { setTrades(t); AsyncStorage.setItem('trades', JSON.stringify(t)); };
  const saveDividends = (d: Dividend[]) => { setDividends(d); AsyncStorage.setItem('dividends', JSON.stringify(d)); };

  const refreshPrices = async () => {
    const syms = [...new Set(trades.map(t => t.symbol))];
    if (!syms.length) return;
    setLoading(true);
    const p: Record<string, number> = {};
    await Promise.all(syms.map(async s => { p[s] = await fetchPrice(s); }));
    setPrices(p);
    setLoading(false);
  };

  useEffect(() => { if (trades.length) refreshPrices(); }, [trades.length]);

  const positions = calcPositions(trades, prices);
  const holding = positions.filter(p => p.quantity > 0);
  const totalCost = holding.reduce((s, p) => s + p.totalCost, 0);
  const totalMV = holding.reduce((s, p) => s + p.marketValue, 0);
  const totalUpnl = totalMV - totalCost;
  const totalRpnl = positions.reduce((s, p) => s + p.realizedPnL, 0);
  const totalDiv = dividends.reduce((s, d) => s + d.totalAmount, 0);

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'portfolio', icon: '📊', label: '組合' },
    { key: 'trades', icon: '📋', label: '交易' },
    { key: 'dividends', icon: '💰', label: '配息' },
    { key: 'analytics', icon: '📈', label: '分析' },
    { key: 'quote', icon: '🔍', label: '報價' },
  ];

  return (
    <View style={s.root}>
      <View style={s.content}>
        {tab === 'portfolio' && <PortfolioTab holding={holding} totalCost={totalCost} totalMV={totalMV} totalUpnl={totalUpnl} totalRpnl={totalRpnl} totalDiv={totalDiv} loading={loading} onRefresh={refreshPrices} />}
        {tab === 'trades' && <TradesTab trades={trades} onSave={saveTrades} />}
        {tab === 'dividends' && <DividendsTab dividends={dividends} onSave={saveDividends} />}
        {tab === 'analytics' && <AnalyticsTab positions={positions} holding={holding} dividends={dividends} totalCost={totalCost} totalMV={totalMV} totalUpnl={totalUpnl} totalRpnl={totalRpnl} totalDiv={totalDiv} trades={trades} />}
        {tab === 'quote' && <QuoteTab prices={prices} trades={trades} onRefresh={refreshPrices} loading={loading} />}
      </View>
      <View style={[s.tabBar, { paddingBottom: insets.bottom || 8 }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={s.tabBtn} onPress={() => setTab(t.key)}>
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.key && s.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── 投資組合 ──────────────────────────────────────────
function PortfolioTab({ holding, totalCost, totalMV, totalUpnl, totalRpnl, totalDiv, loading, onRefresh }: any) {
  return (
    <ScrollView style={s.scroll} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>投資組合總覽</Text>
        <Row label="市值" value={<Text style={s.bigWhite}>{fmt(totalMV)}</Text>} />
        <Row label="成本" value={<Text style={s.bigWhite}>{fmt(totalCost)}</Text>} />
        <View style={s.hr} />
        <Row label="未實現損益" value={<PnL value={totalUpnl} pct={totalCost > 0 ? (totalUpnl / totalCost) * 100 : 0} size={15} />} />
        <Row label="已實現損益" value={<PnL value={totalRpnl} size={15} />} />
        <Row label="股利收入" value={<PnL value={totalDiv} size={15} />} />
        <Row label="總損益" value={<PnL value={totalUpnl + totalRpnl + totalDiv} size={15} />} />
      </View>
      <Text style={s.sec}>持倉明細</Text>
      {holding.length === 0 && <Empty text="尚無持倉，請至「交易」頁面新增記錄" />}
      {holding.map(p => (
        <View key={p.symbol} style={s.card}>
          <View style={s.row}>
            <View><Text style={s.symbol}>{p.symbol}</Text><Text style={s.sub}>{p.name}</Text></View>
            <View style={{ alignItems: 'flex-end' }}>
              {loading ? <ActivityIndicator size="small" /> : <Text style={s.price}>{p.currentPrice > 0 ? `$${p.currentPrice}` : '---'}</Text>}
              <Text style={s.sub}>{p.quantity} 股</Text>
            </View>
          </View>
          <View style={s.hr2} />
          <Row label="市值" value={<Text style={s.val}>{fmt(p.marketValue)}</Text>} />
          <Row label="均成本" value={<Text style={s.val}>{fmt(p.averageCost)}</Text>} />
          <Row label="未實現損益" value={<PnL value={p.unrealizedPnL} pct={p.unrealizedPnLPercent} />} />
          {p.realizedPnL !== 0 && <Row label="已實現損益" value={<PnL value={p.realizedPnL} />} />}
        </View>
      ))}
    </ScrollView>
  );
}

// ── 交易記錄 ──────────────────────────────────────────
function TradesTab({ trades, onSave }: { trades: Trade[]; onSave: (t: Trade[]) => void }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const del = (t: Trade) => Alert.alert('刪除交易', `確定刪除 ${t.symbol}？`, [
    { text: '取消', style: 'cancel' },
    { text: '刪除', style: 'destructive', onPress: () => onSave(trades.filter(x => x.id !== t.id)) },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList data={sorted} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={<Empty text="尚無交易記錄，點右下角 + 新增" />}
        renderItem={({ item: t }) => (
          <TouchableOpacity style={s.card} onPress={() => { setEditing(t); setModal(true); }} onLongPress={() => del(t)}>
            <View style={s.row}>
              <View style={s.row}>
                <View style={[s.badge, t.side === 'buy' ? s.buyBadge : s.sellBadge]}>
                  <Text style={s.badgeT}>{t.side === 'buy' ? '買' : '賣'}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={s.symbol}>{t.symbol}</Text>
                  <Text style={s.sub}>{t.name} · {t.date}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.val}>{t.quantity} 股</Text>
                <Text style={s.sub}>@{t.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )} />
      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setModal(true); }}>
        <Text style={s.fabT}>+</Text>
      </TouchableOpacity>
      <TradeForm visible={modal} trade={editing} onClose={() => setModal(false)}
        onSave={t => { onSave(editing ? trades.map(x => x.id === t.id ? t : x) : [...trades, t]); setModal(false); }} />
    </View>
  );
}

function TradeForm({ visible, trade, onClose, onSave }: any) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [side, setSide] = useState<TradeSide>('buy');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('30');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (trade) { setSymbol(trade.symbol); setName(trade.name); setSide(trade.side); setQty(String(trade.quantity)); setPrice(String(trade.price)); setFee(String(trade.fee)); setDate(trade.date); }
    else { setSymbol(''); setName(''); setSide('buy'); setQty(''); setPrice(''); setFee('30'); setDate(new Date().toISOString().split('T')[0]); }
  }, [trade, visible]);

  const submit = () => {
    if (!symbol || !qty || !price) return Alert.alert('請填寫股票代號、數量、價格');
    onSave({ id: trade?.id ?? uid(), symbol: symbol.toUpperCase(), name: name || symbol.toUpperCase(), side, quantity: +qty, price: +price, fee: +fee || 0, date });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f0f4f8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.mHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>取消</Text></TouchableOpacity>
          <Text style={s.mTitle}>{trade ? '編輯交易' : '新增交易'}</Text>
          <TouchableOpacity onPress={submit}><Text style={s.saveBtn}>儲存</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={s.toggle}>
            <TouchableOpacity style={[s.tBtn, side === 'buy' && { backgroundColor: '#16a34a' }]} onPress={() => setSide('buy')}>
              <Text style={[s.tBtnT, side === 'buy' && { color: '#fff' }]}>買入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tBtn, side === 'sell' && { backgroundColor: '#dc2626' }]} onPress={() => setSide('sell')}>
              <Text style={[s.tBtnT, side === 'sell' && { color: '#fff' }]}>賣出</Text>
            </TouchableOpacity>
          </View>
          <View style={s.fRow}>
            <Field label="股票代號 *" value={symbol} onChange={setSymbol} placeholder="2330" flex={1} caps />
            <View style={{ width: 10 }} />
            <Field label="股票名稱" value={name} onChange={setName} placeholder="台積電" flex={1.5} />
          </View>
          <View style={s.fRow}>
            <Field label="數量（股）*" value={qty} onChange={setQty} placeholder="1000" kb="numeric" flex={1} />
            <View style={{ width: 10 }} />
            <Field label="價格（元）*" value={price} onChange={setPrice} placeholder="100" kb="decimal-pad" flex={1} />
          </View>
          <View style={s.fRow}>
            <Field label="手續費" value={fee} onChange={setFee} placeholder="30" kb="numeric" flex={1} />
            <View style={{ width: 10 }} />
            <Field label="日期 *" value={date} onChange={setDate} placeholder="2025-01-01" flex={1} />
          </View>
          {qty && price && <View style={s.preview}><Text style={s.previewL}>交易金額</Text><Text style={s.previewV}>{(+qty * +price).toLocaleString()} 元</Text></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 配息記錄 ──────────────────────────────────────────
function DividendsTab({ dividends, onSave }: { dividends: Dividend[]; onSave: (d: Dividend[]) => void }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Dividend | null>(null);
  const total = dividends.reduce((s, d) => s + d.totalAmount, 0);

  const del = (d: Dividend) => Alert.alert('刪除配息', `確定刪除 ${d.symbol}？`, [
    { text: '取消', style: 'cancel' },
    { text: '刪除', style: 'destructive', onPress: () => onSave(dividends.filter(x => x.id !== d.id)) },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.summaryCard, { margin: 16, alignItems: 'center' }]}>
        <Text style={{ color: '#6ee7b7', fontSize: 13 }}>股利收入總計</Text>
        <Text style={s.bigWhite}>{fmt(total)}</Text>
        <Text style={{ color: '#a7f3d0', fontSize: 12 }}>{dividends.length} 筆記錄</Text>
      </View>
      <FlatList data={[...dividends].sort((a, b) => new Date(b.exDividendDate).getTime() - new Date(a.exDividendDate).getTime())}
        keyExtractor={i => i.id} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        ListEmptyComponent={<Empty text="尚無配息記錄，點右下角 + 新增" />}
        renderItem={({ item: d }) => (
          <TouchableOpacity style={s.card} onPress={() => { setEditing(d); setModal(true); }} onLongPress={() => del(d)}>
            <View style={s.row}>
              <View style={s.row}>
                <Text style={s.symbol}>{d.symbol}</Text>
                <View style={s.freqBadge}><Text style={s.freqT}>{freqLabel[d.frequency]}</Text></View>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#059669' }}>{fmt(d.totalAmount)}</Text>
            </View>
            <Text style={s.sub}>{d.name}</Text>
            <View style={s.hr2} />
            <Row label="每股股利" value={<Text style={s.val}>{fmt(d.amountPerShare)}</Text>} />
            <Row label="持有股數" value={<Text style={s.val}>{d.quantity} 股</Text>} />
            <Row label="除息日" value={<Text style={s.val}>{d.exDividendDate}</Text>} />
          </TouchableOpacity>
        )} />
      <TouchableOpacity style={[s.fab, { backgroundColor: '#059669' }]} onPress={() => { setEditing(null); setModal(true); }}>
        <Text style={s.fabT}>+</Text>
      </TouchableOpacity>
      <DividendForm visible={modal} dividend={editing} onClose={() => setModal(false)}
        onSave={d => { onSave(editing ? dividends.map(x => x.id === d.id ? d : x) : [...dividends, d]); setModal(false); }} />
    </View>
  );
}

function DividendForm({ visible, dividend, onClose, onSave }: any) {
  const FREQS: DivFreq[] = ['monthly', 'quarterly', 'semi-annual', 'annual', 'irregular'];
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<DivFreq>('quarterly');
  const [aps, setAps] = useState('');
  const [qty, setQty] = useState('');
  const [exDate, setExDate] = useState(new Date().toISOString().split('T')[0]);
  const [payDate, setPayDate] = useState('');

  useEffect(() => {
    if (dividend) { setSymbol(dividend.symbol); setName(dividend.name); setFreq(dividend.frequency); setAps(String(dividend.amountPerShare)); setQty(String(dividend.quantity)); setExDate(dividend.exDividendDate); setPayDate(dividend.paymentDate); }
    else { setSymbol(''); setName(''); setFreq('quarterly'); setAps(''); setQty(''); setExDate(new Date().toISOString().split('T')[0]); setPayDate(''); }
  }, [dividend, visible]);

  const total = (+aps || 0) * (+qty || 0);
  const submit = () => {
    if (!symbol || !aps || !qty) return Alert.alert('請填寫股票代號、每股股利、持有股數');
    onSave({ id: dividend?.id ?? uid(), symbol: symbol.toUpperCase(), name: name || symbol.toUpperCase(), frequency: freq, amountPerShare: +aps, quantity: +qty, totalAmount: total, exDividendDate: exDate, paymentDate: payDate || exDate });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f0f4f8' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.mHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>取消</Text></TouchableOpacity>
          <Text style={s.mTitle}>{dividend ? '編輯配息' : '新增配息'}</Text>
          <TouchableOpacity onPress={submit}><Text style={[s.saveBtn, { color: '#059669' }]}>儲存</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={s.fRow}>
            <Field label="股票代號 *" value={symbol} onChange={setSymbol} placeholder="0050" flex={1} caps />
            <View style={{ width: 10 }} />
            <Field label="股票名稱" value={name} onChange={setName} placeholder="台灣50" flex={1.5} />
          </View>
          <Text style={s.fieldL}>配息頻率</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {FREQS.map(f => (
              <TouchableOpacity key={f} style={[s.freqBtn2, freq === f && { backgroundColor: '#059669' }]} onPress={() => setFreq(f)}>
                <Text style={[s.freqBtnT, freq === f && { color: '#fff' }]}>{freqLabel[f]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.fRow}>
            <Field label="每股股利 *" value={aps} onChange={setAps} placeholder="1.5" kb="decimal-pad" flex={1} />
            <View style={{ width: 10 }} />
            <Field label="持有股數 *" value={qty} onChange={setQty} placeholder="1000" kb="numeric" flex={1} />
          </View>
          <View style={s.fRow}>
            <Field label="除息日 *" value={exDate} onChange={setExDate} placeholder="2025-07-01" flex={1} />
            <View style={{ width: 10 }} />
            <Field label="發放日" value={payDate} onChange={setPayDate} placeholder="2025-08-15" flex={1} />
          </View>
          {total > 0 && <View style={[s.preview, { backgroundColor: '#f0fdf4' }]}><Text style={{ color: '#059669', fontSize: 13 }}>股利總金額</Text><Text style={[s.previewV, { color: '#065f46' }]}>{total.toLocaleString()} 元</Text></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 分析 ──────────────────────────────────────────────
function AnalyticsTab({ positions, holding, dividends, totalCost, totalMV, totalUpnl, totalRpnl, totalDiv, trades }: any) {
  const closed = positions.filter((p: Position) => p.quantity === 0 && p.realizedPnL !== 0);
  const wins = closed.filter((p: Position) => p.realizedPnL > 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const byPnL = [...holding].sort((a, b) => b.unrealizedPnL - a.unrealizedPnL);
  const divMap: Record<string, number> = {};
  dividends.forEach((d: Dividend) => { divMap[d.symbol] = (divMap[d.symbol] ?? 0) + d.totalAmount; });
  const divRank = Object.entries(divMap).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={s.sec}>關鍵指標</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: '總投入成本', v: <Text style={s.val}>{fmt(totalCost)}</Text> },
          { label: '目前市值', v: <Text style={s.val}>{fmt(totalMV)}</Text> },
          { label: '未實現損益', v: <PnL value={totalUpnl} pct={totalCost > 0 ? totalUpnl / totalCost * 100 : 0} /> },
          { label: '已實現損益', v: <PnL value={totalRpnl} /> },
          { label: '股利收入', v: <PnL value={totalDiv} /> },
          { label: '交易筆數', v: <Text style={s.val}>{trades.length} 筆</Text> },
        ].map(({ label, v }) => (
          <View key={label} style={[s.card, { width: '47%' }]}>
            <Text style={s.sub}>{label}</Text>
            {v}
          </View>
        ))}
      </View>
      {closed.length > 0 && <>
        <Text style={s.sec}>交易勝率</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ flex: winRate, backgroundColor: '#16a34a' }} />
            <View style={{ flex: 100 - winRate, backgroundColor: '#dc2626' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.sub}>獲利 {wins} 筆</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b' }}>{winRate.toFixed(1)}%</Text>
            <Text style={s.sub}>虧損 {closed.length - wins} 筆</Text>
          </View>
        </View>
      </>}
      {byPnL.length > 0 && <>
        <Text style={s.sec}>持倉損益排名</Text>
        {byPnL.map((p: Position, i: number) => (
          <View key={p.symbol} style={[s.card, s.row]}>
            <View style={s.row}>
              <Text style={[s.sub, { width: 28, fontSize: 15, fontWeight: '700' }]}>#{i + 1}</Text>
              <View><Text style={s.symbol}>{p.symbol}</Text><Text style={s.sub}>{p.name}</Text></View>
            </View>
            <PnL value={p.unrealizedPnL} pct={p.unrealizedPnLPercent} />
          </View>
        ))}
      </>}
      {divRank.length > 0 && <>
        <Text style={s.sec}>股利收入排名</Text>
        {divRank.map(([sym, amt], i) => (
          <View key={sym} style={[s.card, s.row]}>
            <View style={s.row}>
              <Text style={[s.sub, { width: 28, fontSize: 15, fontWeight: '700' }]}>#{i + 1}</Text>
              <Text style={s.symbol}>{sym}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#059669' }}>{fmt(amt as number)}</Text>
          </View>
        ))}
      </>}
      {positions.length === 0 && <Empty text="新增交易記錄後，分析資料將顯示於此" />}
    </ScrollView>
  );
}

// ── 報價 ──────────────────────────────────────────────
function QuoteTab({ prices, trades, onRefresh, loading }: any) {
  const [sym, setSym] = useState('');
  const [result, setResult] = useState<number | 'not_found' | null>(null);
  const [searching, setSearching] = useState(false);
  const symbols = [...new Set((trades as Trade[]).map(t => t.symbol))];

  const search = async () => {
    if (!sym.trim()) return;
    setSearching(true); setResult(null);
    const p = await fetchPrice(sym.trim());
    setResult(p > 0 ? p : 'not_found');
    setSearching(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text style={s.sub}>查詢股票即時報價</Text>
        <View style={[s.row, { marginTop: 8, gap: 10 }]}>
          <TextInput style={[s.input, { flex: 1 }]} value={sym} onChangeText={setSym} placeholder="輸入代號（例：2330 或 AAPL）" autoCapitalize="characters" returnKeyType="search" onSubmitEditing={search} />
          <TouchableOpacity style={s.searchBtn} onPress={search} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>查詢</Text>}
          </TouchableOpacity>
        </View>
        {result !== null && result !== 'not_found' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', borderRadius: 10, padding: 14, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0c4a6e' }}>{sym.toUpperCase()}</Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0c4a6e' }}>${result}</Text>
          </View>
        )}
        {result === 'not_found' && <Text style={{ color: '#ef4444', marginTop: 8 }}>找不到此股票</Text>}
      </View>
      <FlatList data={symbols} keyExtractor={i => i} contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={s.sec2}>持倉即時報價</Text>
            <TouchableOpacity onPress={onRefresh} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={{ color: '#2563eb' }}>重新整理</Text>}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<Empty text="尚無持倉股票" />}
        renderItem={({ item }) => (
          <View style={[s.card, s.row]}>
            <Text style={s.symbol}>{item}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>
              {prices[item] > 0 ? `$${prices[item]}` : '---'}
            </Text>
          </View>
        )} />
    </View>
  );
}

// ── 共用元件 ──────────────────────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
      <Text style={s.sub}>{label}</Text>
      {value}
    </View>
  );
}
function Field({ label, value, onChange, placeholder, kb, flex, caps }: any) {
  return (
    <View style={{ flex, marginBottom: 14 }}>
      <Text style={s.fieldL}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={kb} autoCapitalize={caps ? 'characters' : 'none'} />
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return <View style={{ alignItems: 'center', paddingVertical: 50 }}><Text style={s.sub}>{text}</Text></View>;
}

// ── 樣式 ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { flex: 1 },
  scroll: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tabBtn: { flex: 1, alignItems: 'center', paddingTop: 8 },
  tabLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  tabActive: { color: '#2563eb', fontWeight: '600' },
  summaryCard: { margin: 16, padding: 16, backgroundColor: '#1e3a5f', borderRadius: 16 },
  summaryTitle: { color: '#93c5fd', fontSize: 14, marginBottom: 12 },
  bigWhite: { color: '#fff', fontSize: 22, fontWeight: '700', paddingVertical: 4 },
  hr: { height: 1, backgroundColor: '#2d5282', marginVertical: 10 },
  hr2: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  sec: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  sec2: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '600', color: '#334155' },
  val: { fontSize: 14, fontWeight: '500', color: '#334155' },
  badge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  buyBadge: { backgroundColor: '#dcfce7' },
  sellBadge: { backgroundColor: '#fee2e2' },
  badgeT: { fontWeight: '700', fontSize: 14 },
  freqBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  freqT: { fontSize: 11, color: '#065f46', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabT: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  mTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  cancel: { fontSize: 16, color: '#64748b' },
  saveBtn: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  toggle: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 16 },
  tBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tBtnT: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  fRow: { flexDirection: 'row' },
  fieldL: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
  preview: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  previewL: { fontSize: 13, color: '#3b82f6' },
  previewV: { fontSize: 22, fontWeight: '700', color: '#1d4ed8', marginTop: 4 },
  freqBtn2: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  freqBtnT: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  searchBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center', minWidth: 70, alignItems: 'center', paddingVertical: 10 },
});
