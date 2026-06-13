import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trade, Dividend } from '../types';

const KEYS = {
  TRADES: 'stock_tracker_trades',
  DIVIDENDS: 'stock_tracker_dividends',
};

export async function loadTrades(): Promise<Trade[]> {
  const raw = await AsyncStorage.getItem(KEYS.TRADES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TRADES, JSON.stringify(trades));
}

export async function loadDividends(): Promise<Dividend[]> {
  const raw = await AsyncStorage.getItem(KEYS.DIVIDENDS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDividends(dividends: Dividend[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.DIVIDENDS, JSON.stringify(dividends));
}
