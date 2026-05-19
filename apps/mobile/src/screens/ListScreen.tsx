import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DUTCH_PRODUCTS } from '../data/dutchProducts';

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
        <Text style={styles.deleteBtnText}>{confirming ? 'Zeker?' : '✕'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ListScreen() {
  const [products, setProducts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) setProducts(JSON.parse(stored));
  }

  async function saveList(list: string[]) {
    setProducts(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function handleInputChange(text: string) {
    setInput(text);
    if (text.length < 2) { setSuggestions([]); return; }
    const lower = text.toLowerCase();
    const matches = DUTCH_PRODUCTS.filter(
      (p) => p.toLowerCase().includes(lower) && !products.includes(p)
    ).slice(0, 5);
    setSuggestions(matches);
  }

  function handleAdd(value?: string) {
    const trimmed = (value ?? input).trim();
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
          <Text style={styles.subtitle}>{products.length} product{products.length !== 1 ? 'en' : ''}</Text>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Product toevoegen..."
            onSubmitEditing={() => handleAdd()}
            returnKeyType="done"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd()}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => handleAdd(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={products}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DeleteRow item={item} onDelete={() => handleDelete(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Nog geen producten.</Text>
              <Text style={styles.emptyHint}>Typ hierboven om te beginnen.</Text>
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
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 4, marginTop: 16 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#E8572A', borderRadius: 12,
    width: 48, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#E0E0E0', marginBottom: 12, overflow: 'hidden',
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  suggestionText: { fontSize: 15, color: '#1A1A1A' },
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
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#BDBDBD', fontWeight: '500' },
  emptyHint: { fontSize: 13, color: '#BDBDBD', marginTop: 4 },
});
