import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, Modal, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, RefreshControl, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

// ── 主題定義 ──────────────────────────────────────────
const lightTheme = {
  bg: '#f0f4f8', card: '#ffffff', text: '#1e293b', sub: '#64748b',
  border: '#e2e8f0', tabBg: '#ffffff', tabActive: '#2563eb', tabInactive: '#94a3b8',
  inputBg: '#ffffff', headerBg: '#ffffff', headerBorder: '#e2e8f0',
  summaryBg: '#1e3a5f',
};
const darkTheme = {
  bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', sub: '#94a3b8',
  border: '#334155', tabBg: '#1e293b', tabActive: '#60a5fa', tabInactive: '#475569',
  inputBg: '#334155', headerBg: '#1e293b', headerBorder: '#334155',
  summaryBg: '#0f2a4a',
};

type ThemeMode = 'system' | 'light' | 'dark';
type Theme = typeof lightTheme;

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
    const cost = m.lots.reduce((acc, l) => acc + l.qty * l.price, 0);
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
  const prefix = value >= 0 ? '+' : '';
  return (
    <Text style={{ color: c, fontWeight: '600', fontSize: size }}>
      {prefix}{value.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}
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
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [tab, setTab] = useState<Tab>('portfolio');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [holdingOrder, setHoldingOrder] = useState<string[]>([]);

  // 計算實際主題
  const resolvedScheme = themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;
  const th: Theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;

  // 主題循環切換：system → light → dark → system
  const cycleTheme = () => {
    setThemeMode(prev => {
      const next: ThemeMode = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      AsyncStorage.setItem('themeMode', next);
      return next;
    });
  };

  const themeIcon = themeMode === 'system' ? '🌐' : themeMode === 'light' ? '☀️' : '🌙';

  const saveHoldingOrder = (order: string[]) => {
    setHoldingOrder(order);
    AsyncStorage.setItem('holdingOrder', JSON.stringify(order));
  };

  useEffect(() => {
    AsyncStorage.getItem('trades').then(v => v && setTrades(JSON.parse(v)));
    AsyncStorage.getItem('dividends').then(v => v && setDividends(JSON.parse(v)));
    AsyncStorage.getItem('holdingOrder').then(v => v && setHoldingOrder(JSON.parse(v)));
    AsyncStorage.getItem('themeMode').then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setThemeMode(v);
    });
  }, []);

  const saveTrades = (t: Trade[]) => { setTrades(t); AsyncStorage.setItem('trades', JSON.stringify(t)); };
  const saveDividends = (d: Dividend[]) => { setDividends(d); AsyncStorage.setItem('dividends', JSON.stringify(d)); };

  const refreshPrices = async () => {
    const syms = [...new Set(trades.map(t => t.symbol))];
    if (!syms.length) return;
    setLoading(true);
    const p: Record<string, number> = {};
    await Promise.all(syms.map(async sym => { p[sym] = await fetchPrice(sym); }));
    setPrices(p);
    setLoading(false);
  };

  useEffect(() => { if (trades.length) refreshPrices(); }, [trades.length]);

  const positions = calcPositions(trades, prices);
  const holding = positions.filter(p => p.quantity > 0);
  const totalCost = holding.reduce((acc, p) => acc + p.totalCost, 0);
  const totalMV = holding.reduce((acc, p) => acc + p.marketValue, 0);
  const totalUpnl = totalMV - totalCost;
  const totalRpnl = positions.reduce((acc, p) => acc + p.realizedPnL, 0);
  const totalDiv = dividends.reduce((acc, d) => acc + d.totalAmount, 0);

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'portfolio', icon: '📊', label: '組合' },
    { key: 'trades', icon: '📋', label: '交易' },
    { key: 'dividends', icon: '💰', label: '配息' },
    { key: 'analytics', icon: '📈', label: '分析' },
    { key: 'quote', icon: '🔍', label: '報價' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: th.bg }]}>
      {/* App Header */}
      <View style={[s.appHeader, { backgroundColor: th.headerBg, borderBottomColor: th.headerBorder }]}>
        <Text style={[s.appHeaderTitle, { color: th.text }]}>StockTracker</Text>
        <TouchableOpacity style={s.themeBtn} onPress={cycleTheme}>
          <Text style={{ fontSize: 20 }}>{themeIcon}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {tab === 'portfolio' && <PortfolioTab th={th} holding={holding} totalCost={totalCost} totalMV={totalMV} totalUpnl={totalUpnl} totalRpnl={totalRpnl} totalDiv={totalDiv} loading={loading} onRefresh={refreshPrices} holdingOrder={holdingOrder} onReorder={saveHoldingOrder} />}
        {tab === 'trades' && <TradesTab th={th} trades={trades} onSave={saveTrades} />}
        {tab === 'dividends' && <DividendsTab th={th} dividends={dividends} onSave={saveDividends} />}
        {tab === 'analytics' && <AnalyticsTab th={th} positions={positions} holding={holding} dividends={dividends} totalCost={totalCost} totalMV={totalMV} totalUpnl={totalUpnl} totalRpnl={totalRpnl} totalDiv={totalDiv} trades={trades} />}
        {tab === 'quote' && <QuoteTab th={th} prices={prices} trades={trades} onRefresh={refreshPrices} loading={loading} />}
      </View>
      <View style={[s.tabBar, { backgroundColor: th.tabBg, borderTopColor: th.border, paddingBottom: insets.bottom || 8 }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={s.tabBtn} onPress={() => setTab(t.key)}>
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={[s.tabLabel, { color: tab === t.key ? th.tabActive : th.tabInactive }, tab === t.key && s.tabActiveStyle]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── 投資組合 ──────────────────────────────────────────
function PortfolioTab({ th, holding, totalCost, totalMV, totalUpnl, totalRpnl, totalDiv, loading, onRefresh, holdingOrder, onReorder }: any) {
  const ordered: Position[] = [...holding].sort((a: Position, b: Position) => {
    const ai = holdingOrder.indexOf(a.symbol);
    const bi = holdingOrder.indexOf(b.symbol);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...ordered];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next.map((p: Position) => p.symbol));
  };

  return (
    <FlatList
      data={ordered}
      keyExtractor={(p: Position) => p.symbol}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          <View style={[s.summaryCard, { backgroundColor: th.summaryBg }]}>
            <Text style={s.summaryTitle}>投資組合總覽</Text>
            <Row label="市值" value={<Text style={s.bigWhite}>{fmt(totalMV)}</Text>} th={th} />
            <Row label="成本" value={<Text style={s.bigWhite}>{fmt(totalCost)}</Text>} th={th} />
            <View style={s.hr} />
            <Row label="未實現損益" value={<PnL value={totalUpnl} pct={totalCost > 0 ? (totalUpnl / totalCost) * 100 : 0} size={15} />} th={th} />
            <Row label="已實現損益" value={<PnL value={totalRpnl} size={15} />} th={th} />
            <Row label="股利收入" value={<PnL value={totalDiv} size={15} />} th={th} />
            <Row label="總損益" value={<PnL value={totalUpnl + totalRpnl + totalDiv} size={15} />} th={th} />
          </View>
          <Text style={[s.sec, { color: th.text, paddingHorizontal: 4 }]}>持倉明細</Text>
          {holding.length === 0 && <Empty text="尚無持倉，請至「交易」頁面新增記錄" th={th} />}
        </View>
      }
      renderItem={({ item: p, index }) => (
        <View style={[s.card, { backgroundColor: th.card }]}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.symbol, { color: th.text }]}>{p.symbol}</Text>
              <Text style={[s.sub, { color: th.sub }]}>{p.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {loading ? <ActivityIndicator size="small" /> : <Text style={[s.price, { color: th.text }]}>{p.currentPrice > 0 ? `$${p.currentPrice}` : '---'}</Text>}
              <Text style={[s.sub, { color: th.sub }]}>{p.quantity} 股</Text>
            </View>
            {holding.length > 1 && (
              <View style={{ marginLeft: 10, gap: 4 }}>
                <TouchableOpacity onPress={() => move(index!, -1)} style={[s.orderBtn, { backgroundColor: th.border }]}>
                  <Text style={{ fontSize: 12, color: th.text }}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => move(index!, 1)} style={[s.orderBtn, { backgroundColor: th.border }]}>
                  <Text style={{ fontSize: 12, color: th.text }}>▼</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={[s.hr2, { backgroundColor: th.border }]} />
          <Row label="市值" value={<Text style={[s.val, { color: th.text }]}>{fmt(p.marketValue)}</Text>} th={th} />
          <Row label="均成本" value={<Text style={[s.val, { color: th.text }]}>{fmt(p.averageCost)}</Text>} th={th} />
          <Row label="未實現損益" value={<PnL value={p.unrealizedPnL} pct={p.unrealizedPnLPercent} />} th={th} />
          {p.realizedPnL !== 0 && <Row label="已實現損益" value={<PnL value={p.realizedPnL} />} th={th} />}
        </View>
      )}
    />
  );
}

// ── 交易記錄 ──────────────────────────────────────────
function TradesTab({ th, trades, onSave }: { th: Theme; trades: Trade[]; onSave: (t: Trade[]) => void }) {
  const [modal, setModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [fSymbol, setFSymbol] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = sorted.filter(t => {
    if (fSymbol && !t.symbol.includes(fSymbol.toUpperCase()) && !t.name.includes(fSymbol)) return false;
    if (fFrom && t.date < fFrom) return false;
    if (fTo && t.date > fTo) return false;
    return true;
  });

  const isFiltering = !!(fSymbol || fFrom || fTo);
  const buyTotal = filtered.filter(t => t.side === 'buy').reduce((acc, t) => acc + t.quantity * t.price, 0);
  const sellTotal = filtered.filter(t => t.side === 'sell').reduce((acc, t) => acc + t.quantity * t.price, 0);
  const clearFilter = () => { setFSymbol(''); setFFrom(''); setFTo(''); };

  const del = (t: Trade) => Alert.alert('刪除交易', `確定刪除 ${t.symbol}？`, [
    { text: '取消', style: 'cancel' },
    { text: '刪除', style: 'destructive', onPress: () => onSave(trades.filter(x => x.id !== t.id)) },
  ]);

  const listHeader = (
    <View>
      {/* 工具列 */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity style={[s.importBtn, { backgroundColor: th.card, borderColor: th.border }, showFilter && { backgroundColor: '#dbeafe', borderColor: '#3b82f6' }]} onPress={() => setShowFilter(v => !v)}>
          <Text style={[s.importBtnT, { color: th.tabActive }]}>🔎 查詢{isFiltering ? ' ●' : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.importBtn, { backgroundColor: th.card, borderColor: th.border }]} onPress={() => setImportModal(true)}>
          <Text style={[s.importBtnT, { color: th.tabActive }]}>📥 批次匯入</Text>
        </TouchableOpacity>
      </View>

      {/* 篩選列 */}
      {showFilter && (
        <View style={{ backgroundColor: th.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 2, borderWidth: 1, borderColor: th.border }}>
          <View style={s.fRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldL, { color: th.sub }]}>股號 / 名稱</Text>
              <TextInput style={[s.input, { backgroundColor: th.inputBg, borderColor: th.border, color: th.text }]} value={fSymbol} onChangeText={setFSymbol} placeholder="2330 或 台積電" placeholderTextColor={th.sub} autoCapitalize="characters" />
            </View>
          </View>
          <View style={s.fRow}>
            <DatePickerField th={th} label="起始日" value={fFrom} onChange={setFFrom} placeholder="選擇起始日" />
            <View style={{ width: 10 }} />
            <DatePickerField th={th} label="結束日" value={fTo} onChange={setFTo} placeholder="選擇結束日" />
          </View>
          {isFiltering && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Text style={[s.sub, { color: th.sub }]}>共 {filtered.length} 筆</Text>
              <TouchableOpacity onPress={clearFilter}>
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>清除篩選</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 篩選小計 */}
      {isFiltering && filtered.length > 0 && (
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8 }}>
          <View style={[s.card, { flex: 1, paddingVertical: 10, backgroundColor: th.card }]}>
            <Text style={[s.sub, { textAlign: 'center', color: th.sub }]}>買入金額</Text>
            <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14, textAlign: 'center', marginTop: 2 }}>
              {buyTotal > 0 ? fmt(buyTotal) : '---'}
            </Text>
          </View>
          <View style={[s.card, { flex: 1, paddingVertical: 10, backgroundColor: th.card }]}>
            <Text style={[s.sub, { textAlign: 'center', color: th.sub }]}>賣出金額</Text>
            <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 14, textAlign: 'center', marginTop: 2 }}>
              {sellTotal > 0 ? fmt(sellTotal) : '---'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList data={filtered} keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Empty text={isFiltering ? '查無符合的交易記錄' : '尚無交易記錄，點右下角 + 新增'} th={th} />}
        renderItem={({ item: t }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: th.card }]} onPress={() => { setEditing(t); setModal(true); }} onLongPress={() => del(t)}>
            <View style={s.row}>
              <View style={s.row}>
                <View style={[s.badge, t.side === 'buy' ? s.buyBadge : s.sellBadge]}>
                  <Text style={s.badgeT}>{t.side === 'buy' ? '買' : '賣'}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[s.symbol, { color: th.text }]}>{t.symbol}</Text>
                  <Text style={[s.sub, { color: th.sub }]}>{t.name} · {t.date}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.val, { color: th.text }]}>{t.quantity} 股</Text>
                <Text style={[s.sub, { color: th.sub }]}>@{t.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )} />
      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setModal(true); }}>
        <Text style={s.fabT}>+</Text>
      </TouchableOpacity>
      <TradeForm th={th} visible={modal} trade={editing} onClose={() => setModal(false)}
        onSave={(t: Trade) => { onSave(editing ? trades.map(x => x.id === t.id ? t : x) : [...trades, t]); setModal(false); }} />
      <ImportModal th={th} visible={importModal} onClose={() => setImportModal(false)}
        onImport={(newTrades: Trade[]) => { onSave([...trades, ...newTrades]); setImportModal(false); }} />
    </View>
  );
}

// ── CSV 匯入 ──────────────────────────────────────────
async function fetchStockName(symbol: string): Promise<string> {
  try {
    const r = await fetch(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${symbol}.tw&json=1&delay=0`,
      { headers: { Accept: 'application/json', Referer: 'https://mis.twse.com.tw' } }
    );
    const d = await r.json();
    return d?.msgArray?.[0]?.n || symbol;
  } catch { return symbol; }
}

function parseCSV(text: string): { trades: Trade[]; errors: string[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const trades: Trade[] = [];
  const errors: string[] = [];
  const isHeader = (l: string) => /股號|代號|symbol/i.test(l);
  const dataLines = isHeader(lines[0]) ? lines.slice(1) : lines;

  dataLines.forEach((line, i) => {
    const cols = line.split(/[,\t，]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 4) { errors.push(`第 ${i + 1} 行欄位不足（至少需要：股號,日期,單價,數量）`); return; }
    const [symbol, dateStr, priceStr, qtyStr, feeStr] = cols;
    const quantity = parseFloat(qtyStr);
    const price = parseFloat(priceStr);
    if (!symbol || isNaN(quantity) || isNaN(price)) { errors.push(`第 ${i + 1} 行資料有誤`); return; }
    trades.push({
      id: uid(), symbol: symbol.toUpperCase(), name: symbol.toUpperCase(),
      side: 'buy', quantity, price, fee: parseFloat(feeStr) || 30,
      date: dateStr || new Date().toISOString().split('T')[0],
    });
  });
  return { trades, errors };
}

function ImportModal({ th, visible, onClose, onImport }: { th: Theme; visible: boolean; onClose: () => void; onImport: (t: Trade[]) => void }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Trade[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [fetching, setFetching] = useState(false);

  const reset = () => { setText(''); setPreview([]); setErrors([]); setStep('input'); setFetching(false); };

  const parse = async () => {
    if (!text.trim()) return Alert.alert('請先貼上資料');
    const { trades, errors: errs } = parseCSV(text);
    setErrors(errs);
    if (trades.length === 0) { setStep('preview'); setPreview([]); return; }

    // 自動抓取股票名稱
    setFetching(true);
    const syms = [...new Set(trades.map(t => t.symbol))];
    const nameMap: Record<string, string> = {};
    await Promise.all(syms.map(async sym => { nameMap[sym] = await fetchStockName(sym); }));
    const namedTrades = trades.map(t => ({ ...t, name: nameMap[t.symbol] || t.symbol }));
    setPreview(namedTrades);
    setFetching(false);
    setStep('preview');
  };

  const confirm = () => {
    if (preview.length === 0) return Alert.alert('沒有可匯入的資料');
    onImport(preview); reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { onClose(); reset(); }}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: th.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.mHeader, { backgroundColor: th.headerBg, borderBottomColor: th.headerBorder }]}>
          <TouchableOpacity onPress={() => { onClose(); reset(); }}><Text style={[s.cancel, { color: th.sub }]}>取消</Text></TouchableOpacity>
          <Text style={[s.mTitle, { color: th.text }]}>批次匯入交易</Text>
          {step === 'input'
            ? <TouchableOpacity onPress={parse} disabled={fetching}>
                {fetching ? <ActivityIndicator size="small" color={th.tabActive} /> : <Text style={[s.saveBtn, { color: th.tabActive }]}>解析</Text>}
              </TouchableOpacity>
            : <TouchableOpacity onPress={confirm}><Text style={[s.saveBtn, { color: th.tabActive }]}>確認匯入</Text></TouchableOpacity>}
        </View>

        {step === 'input' ? (
          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={[s.card, { backgroundColor: '#eff6ff', marginBottom: 12 }]}>
              <Text style={{ color: '#1e40af', fontWeight: '600', marginBottom: 6 }}>格式（每行一筆，股票名稱自動帶入）：</Text>
              <Text style={{ color: '#1e40af', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {'股號,日期,單價,數量,手續費\n2330,2026-06-15,2400,10,30\n0050,2026-06-10,200,100,30'}
              </Text>
              <Text style={{ color: '#3b82f6', fontSize: 11, marginTop: 8 }}>
                • 手續費可省略（預設 30 元）{'\n'}
                • 全部預設為「買入」{'\n'}
                • 可直接從 Google 試算表複製貼上
              </Text>
            </View>
            <Text style={[s.fieldL, { color: th.sub }]}>貼上資料：</Text>
            <TextInput
              style={[s.input, { height: 200, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, backgroundColor: th.inputBg, borderColor: th.border, color: th.text }]}
              multiline value={text} onChangeText={setText}
              placeholder={'2330,台積電,buy,10,2400,30,2026-06-15\n0050,台灣50,buy,100,200,30,2026-06-10'}
              placeholderTextColor={th.sub}
            />
          </ScrollView>
        ) : (
          <ScrollView style={{ padding: 16 }}>
            {errors.length > 0 && (
              <View style={[s.card, { backgroundColor: '#fef2f2', marginBottom: 12 }]}>
                <Text style={{ color: '#dc2626', fontWeight: '600', marginBottom: 4 }}>⚠️ {errors.length} 筆解析失敗</Text>
                {errors.map((e, i) => <Text key={i} style={{ color: '#dc2626', fontSize: 12 }}>{e}</Text>)}
              </View>
            )}
            {preview.length > 0 && (
              <View style={[s.card, { backgroundColor: '#f0fdf4', marginBottom: 12 }]}>
                <Text style={{ color: '#16a34a', fontWeight: '600' }}>✅ 成功解析 {preview.length} 筆，確認後匯入</Text>
              </View>
            )}
            {preview.map((t, i) => (
              <View key={i} style={[s.card, { backgroundColor: th.card }]}>
                <View style={s.row}>
                  <View style={s.row}>
                    <View style={[s.badge, t.side === 'buy' ? s.buyBadge : s.sellBadge]}>
                      <Text style={s.badgeT}>{t.side === 'buy' ? '買' : '賣'}</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[s.symbol, { color: th.text }]}>{t.symbol}</Text>
                      <Text style={[s.sub, { color: th.sub }]}>{t.name} · {t.date}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.val, { color: th.text }]}>{t.quantity} 股</Text>
                    <Text style={[s.sub, { color: th.sub }]}>@{t.price}</Text>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[s.importBtn, { backgroundColor: th.card, borderColor: th.border, marginTop: 8 }]} onPress={() => setStep('input')}>
              <Text style={[s.importBtnT, { color: th.tabActive }]}>← 重新編輯</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TradeForm({ th, visible, trade, onClose, onSave }: any) {
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
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: th.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.mHeader, { backgroundColor: th.headerBg, borderBottomColor: th.headerBorder }]}>
          <TouchableOpacity onPress={onClose}><Text style={[s.cancel, { color: th.sub }]}>取消</Text></TouchableOpacity>
          <Text style={[s.mTitle, { color: th.text }]}>{trade ? '編輯交易' : '新增交易'}</Text>
          <TouchableOpacity onPress={submit}><Text style={[s.saveBtn, { color: th.tabActive }]}>儲存</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={[s.toggle, { backgroundColor: th.border }]}>
            <TouchableOpacity style={[s.tBtn, side === 'buy' && { backgroundColor: '#16a34a' }]} onPress={() => setSide('buy')}>
              <Text style={[s.tBtnT, { color: side === 'buy' ? '#fff' : th.sub }]}>買入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tBtn, side === 'sell' && { backgroundColor: '#dc2626' }]} onPress={() => setSide('sell')}>
              <Text style={[s.tBtnT, { color: side === 'sell' ? '#fff' : th.sub }]}>賣出</Text>
            </TouchableOpacity>
          </View>
          <View style={s.fRow}>
            <Field th={th} label="股票代號 *" value={symbol} onChange={setSymbol} placeholder="2330" flex={1} caps />
            <View style={{ width: 10 }} />
            <Field th={th} label="股票名稱" value={name} onChange={setName} placeholder="台積電" flex={1.5} />
          </View>
          <View style={s.fRow}>
            <Field th={th} label="數量（股）*" value={qty} onChange={setQty} placeholder="1000" kb="numeric" flex={1} />
            <View style={{ width: 10 }} />
            <Field th={th} label="價格（元）*" value={price} onChange={setPrice} placeholder="100" kb="decimal-pad" flex={1} />
          </View>
          <View style={s.fRow}>
            <Field th={th} label="手續費" value={fee} onChange={setFee} placeholder="30" kb="numeric" flex={1} />
            <View style={{ width: 10 }} />
            <DatePickerField th={th} label="日期 *" value={date} onChange={setDate} />
          </View>
          {qty && price && <View style={s.preview}><Text style={s.previewL}>交易金額</Text><Text style={s.previewV}>{(+qty * +price).toLocaleString()} 元</Text></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 配息記錄 ──────────────────────────────────────────
function DividendsTab({ th, dividends, onSave }: { th: Theme; dividends: Dividend[]; onSave: (d: Dividend[]) => void }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Dividend | null>(null);
  const total = dividends.reduce((acc, d) => acc + d.totalAmount, 0);

  const del = (d: Dividend) => Alert.alert('刪除配息', `確定刪除 ${d.symbol}？`, [
    { text: '取消', style: 'cancel' },
    { text: '刪除', style: 'destructive', onPress: () => onSave(dividends.filter(x => x.id !== d.id)) },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.summaryCard, { margin: 16, alignItems: 'center', backgroundColor: th.summaryBg }]}>
        <Text style={{ color: '#6ee7b7', fontSize: 13 }}>股利收入總計</Text>
        <Text style={s.bigWhite}>{fmt(total)}</Text>
        <Text style={{ color: '#a7f3d0', fontSize: 12 }}>{dividends.length} 筆記錄</Text>
      </View>
      <FlatList data={[...dividends].sort((a, b) => new Date(b.exDividendDate).getTime() - new Date(a.exDividendDate).getTime())}
        keyExtractor={i => i.id} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        ListEmptyComponent={<Empty text="尚無配息記錄，點右下角 + 新增" th={th} />}
        renderItem={({ item: d }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: th.card }]} onPress={() => { setEditing(d); setModal(true); }} onLongPress={() => del(d)}>
            <View style={s.row}>
              <View style={s.row}>
                <Text style={[s.symbol, { color: th.text }]}>{d.symbol}</Text>
                <View style={s.freqBadge}><Text style={s.freqT}>{freqLabel[d.frequency]}</Text></View>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#059669' }}>{fmt(d.totalAmount)}</Text>
            </View>
            <Text style={[s.sub, { color: th.sub }]}>{d.name}</Text>
            <View style={[s.hr2, { backgroundColor: th.border }]} />
            <Row label="每股股利" value={<Text style={[s.val, { color: th.text }]}>{fmt(d.amountPerShare)}</Text>} th={th} />
            <Row label="持有股數" value={<Text style={[s.val, { color: th.text }]}>{d.quantity} 股</Text>} th={th} />
            <Row label="除息日" value={<Text style={[s.val, { color: th.text }]}>{d.exDividendDate}</Text>} th={th} />
          </TouchableOpacity>
        )} />
      <TouchableOpacity style={[s.fab, { backgroundColor: '#059669' }]} onPress={() => { setEditing(null); setModal(true); }}>
        <Text style={s.fabT}>+</Text>
      </TouchableOpacity>
      <DividendForm th={th} visible={modal} dividend={editing} onClose={() => setModal(false)}
        onSave={(d: Dividend) => { onSave(editing ? dividends.map(x => x.id === d.id ? d : x) : [...dividends, d]); setModal(false); }} />
    </View>
  );
}

function DividendForm({ th, visible, dividend, onClose, onSave }: any) {
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
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: th.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.mHeader, { backgroundColor: th.headerBg, borderBottomColor: th.headerBorder }]}>
          <TouchableOpacity onPress={onClose}><Text style={[s.cancel, { color: th.sub }]}>取消</Text></TouchableOpacity>
          <Text style={[s.mTitle, { color: th.text }]}>{dividend ? '編輯配息' : '新增配息'}</Text>
          <TouchableOpacity onPress={submit}><Text style={[s.saveBtn, { color: '#059669' }]}>儲存</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={s.fRow}>
            <Field th={th} label="股票代號 *" value={symbol} onChange={setSymbol} placeholder="0050" flex={1} caps />
            <View style={{ width: 10 }} />
            <Field th={th} label="股票名稱" value={name} onChange={setName} placeholder="台灣50" flex={1.5} />
          </View>
          <Text style={[s.fieldL, { color: th.sub }]}>配息頻率</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {FREQS.map(f => (
              <TouchableOpacity key={f} style={[s.freqBtn2, { backgroundColor: th.border }, freq === f && { backgroundColor: '#059669' }]} onPress={() => setFreq(f)}>
                <Text style={[s.freqBtnT, { color: freq === f ? '#fff' : th.sub }]}>{freqLabel[f]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.fRow}>
            <Field th={th} label="每股股利 *" value={aps} onChange={setAps} placeholder="1.5" kb="decimal-pad" flex={1} />
            <View style={{ width: 10 }} />
            <Field th={th} label="持有股數 *" value={qty} onChange={setQty} placeholder="1000" kb="numeric" flex={1} />
          </View>
          <View style={s.fRow}>
            <DatePickerField th={th} label="除息日 *" value={exDate} onChange={setExDate} />
            <View style={{ width: 10 }} />
            <DatePickerField th={th} label="發放日" value={payDate} onChange={setPayDate} placeholder="選擇發放日" />
          </View>
          {total > 0 && <View style={[s.preview, { backgroundColor: '#f0fdf4' }]}><Text style={{ color: '#059669', fontSize: 13 }}>股利總金額</Text><Text style={[s.previewV, { color: '#065f46' }]}>{total.toLocaleString()} 元</Text></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 分析 ──────────────────────────────────────────────
function AnalyticsTab({ th, positions, holding, dividends, totalCost, totalMV, totalUpnl, totalRpnl, totalDiv, trades }: any) {
  const closed = positions.filter((p: Position) => p.quantity === 0 && p.realizedPnL !== 0);
  const wins = closed.filter((p: Position) => p.realizedPnL > 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const byPnL = [...holding].sort((a: Position, b: Position) => b.unrealizedPnL - a.unrealizedPnL);
  const divMap: Record<string, number> = {};
  dividends.forEach((d: Dividend) => { divMap[d.symbol] = (divMap[d.symbol] ?? 0) + d.totalAmount; });
  const divRank = Object.entries(divMap).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);

  return (
    <ScrollView style={[s.scroll, { backgroundColor: th.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={[s.sec, { color: th.text }]}>關鍵指標</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: '總投入成本', v: <Text style={[s.val, { color: th.text }]}>{fmt(totalCost)}</Text> },
          { label: '目前市值', v: <Text style={[s.val, { color: th.text }]}>{fmt(totalMV)}</Text> },
          { label: '未實現損益', v: <PnL value={totalUpnl} pct={totalCost > 0 ? totalUpnl / totalCost * 100 : 0} /> },
          { label: '已實現損益', v: <PnL value={totalRpnl} /> },
          { label: '股利收入', v: <PnL value={totalDiv} /> },
          { label: '交易筆數', v: <Text style={[s.val, { color: th.text }]}>{trades.length} 筆</Text> },
        ].map(({ label, v }) => (
          <View key={label} style={[s.card, { width: '47%', backgroundColor: th.card }]}>
            <Text style={[s.sub, { color: th.sub }]}>{label}</Text>
            {v}
          </View>
        ))}
      </View>
      {closed.length > 0 && <>
        <Text style={[s.sec, { color: th.text }]}>交易勝率</Text>
        <View style={[s.card, { backgroundColor: th.card }]}>
          <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ flex: winRate, backgroundColor: '#16a34a' }} />
            <View style={{ flex: 100 - winRate, backgroundColor: '#dc2626' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[s.sub, { color: th.sub }]}>獲利 {wins} 筆</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: th.text }}>{winRate.toFixed(1)}%</Text>
            <Text style={[s.sub, { color: th.sub }]}>虧損 {closed.length - wins} 筆</Text>
          </View>
        </View>
      </>}
      {byPnL.length > 0 && <>
        <Text style={[s.sec, { color: th.text }]}>持倉損益排名</Text>
        {byPnL.map((p: Position, i: number) => (
          <View key={p.symbol} style={[s.card, s.row, { backgroundColor: th.card }]}>
            <View style={s.row}>
              <Text style={[s.sub, { width: 28, fontSize: 15, fontWeight: '700', color: th.sub }]}>#{i + 1}</Text>
              <View><Text style={[s.symbol, { color: th.text }]}>{p.symbol}</Text><Text style={[s.sub, { color: th.sub }]}>{p.name}</Text></View>
            </View>
            <PnL value={p.unrealizedPnL} pct={p.unrealizedPnLPercent} />
          </View>
        ))}
      </>}
      {divRank.length > 0 && <>
        <Text style={[s.sec, { color: th.text }]}>股利收入排名</Text>
        {divRank.map(([sym, amt], i) => (
          <View key={sym} style={[s.card, s.row, { backgroundColor: th.card }]}>
            <View style={s.row}>
              <Text style={[s.sub, { width: 28, fontSize: 15, fontWeight: '700', color: th.sub }]}>#{i + 1}</Text>
              <Text style={[s.symbol, { color: th.text }]}>{sym}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#059669' }}>{fmt(amt as number)}</Text>
          </View>
        ))}
      </>}
      {positions.length === 0 && <Empty text="新增交易記錄後，分析資料將顯示於此" th={th} />}
    </ScrollView>
  );
}

// ── 報價 ──────────────────────────────────────────────
function QuoteTab({ th, prices, trades, onRefresh, loading }: any) {
  const [sym, setSym] = useState('');
  const [result, setResult] = useState<number | 'not_found' | null>(null);
  const [searching, setSearching] = useState(false);
  const symbols = [...new Set((trades as Trade[]).map((t: Trade) => t.symbol))];

  const search = async () => {
    if (!sym.trim()) return;
    setSearching(true); setResult(null);
    const p = await fetchPrice(sym.trim());
    setResult(p > 0 ? p : 'not_found');
    setSearching(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: th.card, padding: 16, borderBottomWidth: 1, borderBottomColor: th.border }}>
        <Text style={[s.sub, { color: th.sub }]}>查詢股票即時報價</Text>
        <View style={[s.row, { marginTop: 8, gap: 10 }]}>
          <TextInput style={[s.input, { flex: 1, backgroundColor: th.inputBg, borderColor: th.border, color: th.text }]} value={sym} onChangeText={setSym} placeholder="輸入代號（例：2330 或 AAPL）" placeholderTextColor={th.sub} autoCapitalize="characters" returnKeyType="search" onSubmitEditing={search} />
          <TouchableOpacity style={[s.searchBtn, { backgroundColor: th.tabActive }]} onPress={search} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>查詢</Text>}
          </TouchableOpacity>
        </View>
        {result !== null && result !== 'not_found' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: th.bg, borderRadius: 10, padding: 14, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: th.text }}>{sym.toUpperCase()}</Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: th.tabActive }}>${result}</Text>
          </View>
        )}
        {result === 'not_found' && <Text style={{ color: '#ef4444', marginTop: 8 }}>找不到此股票</Text>}
      </View>
      <FlatList data={symbols} keyExtractor={i => i} contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={[s.sec2, { color: th.text }]}>持倉即時報價</Text>
            <TouchableOpacity onPress={onRefresh} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color={th.tabActive} /> : <Text style={{ color: th.tabActive }}>重新整理</Text>}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<Empty text="尚無持倉股票" th={th} />}
        renderItem={({ item }) => (
          <View style={[s.card, s.row, { backgroundColor: th.card }]}>
            <Text style={[s.symbol, { color: th.text }]}>{item}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: th.text }}>
              {prices[item] > 0 ? `$${prices[item]}` : '---'}
            </Text>
          </View>
        )} />
    </View>
  );
}

// ── 共用元件 ──────────────────────────────────────────
function Row({ label, value, th }: { label: string; value: React.ReactNode; th: Theme }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
      <Text style={[s.sub, { color: th.sub }]}>{label}</Text>
      {value}
    </View>
  );
}
function Field({ th, label, value, onChange, placeholder, kb, flex, caps }: any) {
  return (
    <View style={{ flex, marginBottom: 14 }}>
      <Text style={[s.fieldL, { color: th.sub }]}>{label}</Text>
      <TextInput style={[s.input, { backgroundColor: th.inputBg, borderColor: th.border, color: th.text }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={th.sub} keyboardType={kb} autoCapitalize={caps ? 'characters' : 'none'} />
    </View>
  );
}
function DatePickerField({ th, label, value, onChange, flex, placeholder }: { th: Theme; label: string; value: string; onChange: (v: string) => void; flex?: number; placeholder?: string }) {
  const [show, setShow] = useState(false);
  const parsed = value ? new Date(value + 'T00:00:00') : new Date();
  return (
    <View style={{ flex: flex ?? 1, marginBottom: 14 }}>
      <Text style={[s.fieldL, { color: th.sub }]}>{label}</Text>
      <TouchableOpacity
        style={[s.input, { backgroundColor: th.inputBg, borderColor: th.border, justifyContent: 'center' }]}
        onPress={() => setShow(true)}
      >
        <Text style={{ fontSize: 15, color: value ? th.text : th.sub }}>{value || placeholder || '選擇日期'}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={parsed}
          mode="date"
          display="default"
          onChange={(_: any, d?: Date) => {
            setShow(false);
            if (d) onChange(d.toISOString().split('T')[0]);
          }}
        />
      )}
    </View>
  );
}
function Empty({ text, th }: { text: string; th: Theme }) {
  return <View style={{ alignItems: 'center', paddingVertical: 50 }}><Text style={[s.sub, { color: th.sub }]}>{text}</Text></View>;
}

// ── 樣式 ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  scroll: { flex: 1 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  appHeaderTitle: { fontSize: 20, fontWeight: '700' },
  themeBtn: { padding: 6 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingTop: 8 },
  tabLabel: { fontSize: 11, marginTop: 2 },
  tabActiveStyle: { fontWeight: '600' },
  summaryCard: { margin: 16, padding: 16, borderRadius: 16 },
  summaryTitle: { color: '#93c5fd', fontSize: 14, marginBottom: 12 },
  bigWhite: { color: '#fff', fontSize: 22, fontWeight: '700', paddingVertical: 4 },
  hr: { height: 1, backgroundColor: '#2d5282', marginVertical: 10 },
  hr2: { height: 1, marginVertical: 8 },
  sec: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  sec2: { fontSize: 16, fontWeight: '700' },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { fontSize: 17, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '600' },
  val: { fontSize: 14, fontWeight: '500' },
  badge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  buyBadge: { backgroundColor: '#dcfce7' },
  sellBadge: { backgroundColor: '#fee2e2' },
  badgeT: { fontWeight: '700', fontSize: 14 },
  freqBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  freqT: { fontSize: 11, color: '#065f46', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabT: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  mTitle: { fontSize: 17, fontWeight: '600' },
  cancel: { fontSize: 16 },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  toggle: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 16 },
  tBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tBtnT: { fontSize: 15, fontWeight: '600' },
  fRow: { flexDirection: 'row' },
  fieldL: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  preview: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  previewL: { fontSize: 13, color: '#3b82f6' },
  previewV: { fontSize: 22, fontWeight: '700', color: '#1d4ed8', marginTop: 4 },
  freqBtn2: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  freqBtnT: { fontSize: 13, fontWeight: '500' },
  searchBtn: { borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center', minWidth: 70, alignItems: 'center', paddingVertical: 10 },
  importBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-end' },
  importBtnT: { fontWeight: '600', fontSize: 14 },
  orderBtn: { width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
});
