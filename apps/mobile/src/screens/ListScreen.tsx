import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchProducts, AHProduct } from '../services/api';

const STORAGE_KEY = 'spaarvos_list';

function DeleteRow({ item, onDelete }: { item: string; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  function handlePress() {
    if (confirming) {
      onDelete();
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2000);
    }
  }

  return (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item}</Text>
      <TouchableOpacity
        style={[styles.deleteBtn, confirming && styles.deleteBtnConfirm]}
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.deleteBtnText, confirming && styles.deleteBtnTextConfirm]}>
          {confirming ? 'Zeker?' : '✕'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ListScreen() {
  const [products, setProducts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<AHProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) setProducts(JSON.parse(stored));
  }

  async function saveList(list: string[]) {
    setProducts(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(text);
        // filter out already-added products
        setSuggestions(results.filter((r) => !products.includes(r.title)));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [products]);

  function handleAdd(title: string) {
    const trimmed = title.trim();
    if (!trimmed || products.includes(trimmed)) return;
    saveList([...products, trimmed]);
    setInput('');
    setSuggestions([]);
  }

  function handleDelete(product: string) {
    saveList(products.filter((p) => p !== product));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Mijn lijst</Text>
        {products.length > 0 && (
          <Text style={styles.subtitle}>
            {products.length} product{products.length !== 1 ? 'en' : ''}
          </Text>
        )}

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={handleInputChange}
              placeholder="Zoek een product... (bijv. De Cecco)"
              onSubmitEditing={() => input.trim() && handleAdd(input)}
              returnKeyType="done"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator
                style={styles.inputSpinner}
                size="small"
                color="#BDBDBD"
              />
            )}
          </View>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.webshopId}
                style={styles.suggestionItem}
                onPress={() => handleAdd(s.title)}
              >
                {s.images?.[0]?.url ? (
                  <Image
                    source={{ uri: s.images[0].url }}
                    style={styles.suggestionImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.suggestionImagePlaceholder} />
                )}
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{s.title}</Text>
                  <View style={styles.suggestionMeta}>
                    {s.salesUnitSize ? (
                      <Text style={styles.suggestionSize}>{s.salesUnitSize}</Text>
                    ) : null}
                    {s.isBonus && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusBadgeText}>bonus</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={products}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ marginTop: suggestions.length > 0 ? 8 : 0 }}
          renderItem={({ item }) => (
            <DeleteRow item={item} onDelete={() => handleDelete(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Nog geen producten.</Text>
              <Text style={styles.emptyHint}>Zoek hierboven om te beginnen.</Text>
            </View>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  inputRow: { marginTop: 16, marginBottom: 4 },
  inputWrap: { position: 'relative' },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 12, paddingRight: 40, fontSize: 16, backgroundColor: '#fff',
  },
  inputSpinner: { position: 'absolute', right: 12, top: 14 },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#E0E0E0', marginBottom: 4, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10,
  },
  suggestionImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#F8F8F8' },
  suggestionImagePlaceholder: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#F0F0F0' },
  suggestionInfo: { flex: 1 },
  suggestionTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  suggestionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  suggestionSize: { fontSize: 11, color: '#BDBDBD' },
  bonusBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  bonusBadgeText: { fontSize: 10, fontWeight: '700', color: '#E65100' },
  addIcon: { fontSize: 20, color: '#E8572A', fontWeight: '600', paddingHorizontal: 4 },
  item: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  itemText: { fontSize: 16, color: '#1A1A1A', flex: 1 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnConfirm: { backgroundColor: '#E8572A' },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: '#888' },
  deleteBtnTextConfirm: { color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#BDBDBD', fontWeight: '500' },
  emptyHint: { fontSize: 13, color: '#BDBDBD', marginTop: 4 },
});
