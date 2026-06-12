import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useStore } from './src/store/useStore';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { TradesScreen } from './src/screens/TradesScreen';
import { DividendsScreen } from './src/screens/DividendsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { QuoteScreen } from './src/screens/QuoteScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '投資組合': '📊',
    '交易記錄': '📋',
    '配息記錄': '💰',
    '分析': '📈',
    '報價': '🔍',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '●'}
    </Text>
  );
}

export default function App() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => (
              <TabIcon label={route.name} focused={focused} />
            ),
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#e2e8f0',
              paddingBottom: 4,
              height: 60,
            },
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: '700', color: '#1e293b' },
            headerShadowVisible: false,
          })}
        >
          <Tab.Screen name="投資組合" component={PortfolioScreen} />
          <Tab.Screen name="交易記錄" component={TradesScreen} />
          <Tab.Screen name="配息記錄" component={DividendsScreen} />
          <Tab.Screen name="分析" component={AnalyticsScreen} />
          <Tab.Screen name="報價" component={QuoteScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
