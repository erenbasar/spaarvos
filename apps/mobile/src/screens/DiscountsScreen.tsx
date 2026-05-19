import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Image, TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { searchAHBonus, AHProduct } from '../services/ahService';
import { fetchDirkDiscounts, DirkProduct } from '../services/dirkService';

interface DiscountMatch {
  market: 'ah' | 'dirk';
  productQuery: string;
  title: string;
  currentPrice: number;
  priceBeforeBonus?: number;
  imageUrl?: string;
}

async function findDiscounts(products: string[]): Promise<DiscountMatch[]> {
  const results: DiscountMatch[] = [];
  const [dirkItems, ...ahResults] = await Promise.all([
    fetchDirkDiscounts(),
    ...products.map((p) => searchAHBonus(p).catch(() => [] as AHProduct[])),
  ]);

  products.forEach((product, i) => {
    const ahBonus = ahResults[i] ?? [];
    for (const p of ahBonus.slice(0, 2)) {
      results.push({
        market: 'ah',
        productQuery: product,
        title: p.title,
        currentPrice: p.currentPrice!,
        priceBeforeBonus: p.priceBeforeBonus ?? undefined,
        imageUrl: p.images?.[0]?.url,
      });
    }
    const lower = product.toLowerCase();
    const dirkMatches = (dirkItems as DirkProduct[]).filter((d) =>
      d.name.toLowerCase().includes(lower)
    );
    for (const d of dirkMatches.slice(0, 2)) {
      results.push({
        market: 'dirk',
        productQuery: product,
        title: d.name,
        currentPrice: d.price,
        imageUrl: d.imageUrl,
      });
    }
  });

  return results;
}

const STORAGE_KEY = 'spaarvos_list';

const MARKET_COLORS: Record<string, string> = {
  ah: '#007AC3',
  dirk: '#E30613',
};

const MARKET_LABELS: Record<string, string> = {
  ah: 'Albert Heijn',
  dirk: 'Dirk',
};

export default function DiscountsScreen() {
  const [items, setItems] = useState<DiscountMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myList, setMyList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const products: string[] = stored ? JSON.parse(stored) : [];
      setMyList(products);
      if (products.length === 0) {
        setItems([]);
        return;
      }
      const discounts = await findDiscounts(products);
      setItems(discounts);
    } catch {
      setError('Kon aanbiedingen niet laden. Controleer of de server actief is.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onRefresh() {
    setRefreshing(true);
    load(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8572A" />
        <Text style={styles.loadingText}>Aanbiedingen zoeken...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aanbiedingen</Text>

      {myList.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Lijst is leeg</Text>
          <Text style={styles.emptyDesc}>
            Voeg producten toe aan je lijst om aanbiedingen te zien.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {items.length > 0
              ? `${items.length} aanbieding${items.length !== 1 ? 'en' : ''} gevonden voor ${myList.length} product${myList.length !== 1 ? 'en' : ''}`
              : `Geen aanbiedingen gevonden voor jouw ${myList.length} product${myList.length !== 1 ? 'en' : ''}`}
          </Text>
          <FlatList
            data={items}
            keyExtractor={(item, i) => `${item.market}-${item.productQuery}-${i}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8572A" />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <DiscountCard item={item} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyIcon}>🏷️</Text>
                <Text style={styles.emptyDesc}>
                  Deze week geen aanbiedingen voor jouw producten.
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

function DiscountCard({ item }: { item: DiscountMatch }) {
  const hasDiscount = item.priceBeforeBonus != null && item.priceBeforeBonus > item.currentPrice;
  const savings = hasDiscount ? (item.priceBeforeBonus! - item.currentPrice).toFixed(2) : null;
  const marketColor = MARKET_COLORS[item.market] ?? '#888';

  return (
    <View style={styles.card}>
      {/* Colored top bar indicating market */}
      <View style={[styles.marketBar, { backgroundColor: marketColor }]}>
        <Text style={styles.marketBarText}>{MARKET_LABELS[item.market] ?? item.market}</Text>
      </View>
      <View style={styles.cardRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardQuery}>voor: {item.productQuery}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>€{item.currentPrice.toFixed(2)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.oldPrice}>€{item.priceBeforeBonus!.toFixed(2)}</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>-€{savings}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 14, color: '#E8572A', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#E8572A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  marketBar: {
    paddingHorizontal: 12, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center',
  },
  marketBarText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  cardRow: { flexDirection: 'row', padding: 12, gap: 12 },
  image: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#F8F8F8' },
  imagePlaceholder: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#F0F0F0' },
  cardInfo: { flex: 1, gap: 4 },
  cardQuery: { fontSize: 11, color: '#BDBDBD' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  currentPrice: { fontSize: 17, fontWeight: '700', color: '#E8572A' },
  oldPrice: { fontSize: 13, color: '#BDBDBD', textDecorationLine: 'line-through' },
  savingsBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  savingsText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
});
