import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatPercent } from '../utils/calculations';

interface Props {
  value: number;
  percent?: number;
  style?: object;
}

export function PnLBadge({ value, percent, style }: Props) {
  const isPositive = value >= 0;
  const color = isPositive ? '#16a34a' : '#dc2626';
  const sign = isPositive ? '+' : '';

  return (
    <Text style={[styles.text, { color }, style]}>
      {sign}{value.toLocaleString('zh-TW', { minimumFractionDigits: 0 })}
      {percent !== undefined && ` (${formatPercent(percent)})`}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
});
