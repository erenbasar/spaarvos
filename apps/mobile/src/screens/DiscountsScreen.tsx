import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { getDiscounts } from '../services/api';

interface DiscountItem {
  title: string;
  description?: string;
  market: 'ah' | 'jumbo';
}

export default function DiscountsScreen() {
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getDiscounts();
      const combined: DiscountItem[] = [
        ...(data.ah?.items ?? []).map((i: any) => ({ ...i, market: 'ah' as const })),
        ...(data.jumbo?.items ?? []).map((i: any) => ({ ...i, market: 'jumbo' as const })),
      ];
      setItems(combined);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#E8572A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aanbiedingen</Text>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.market}-${i}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.badge, item.market === 'ah' ? styles.ah : styles.jumbo]}>
              <Text style={styles.badgeText}>{item.market === 'ah' ? 'AH' : 'Jumbo'}</Text>
            </View>
            <Text style={styles.name}>{item.title}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Geen aanbiedingen gevonden.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  card: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
  },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, marginBottom: 6,
  },
  ah: { backgroundColor: '#007AC3' },
  jumbo: { backgroundColor: '#F5A623' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  desc: { fontSize: 13, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#BDBDBD', marginTop: 60 },
});
