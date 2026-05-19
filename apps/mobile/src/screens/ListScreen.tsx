import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DUTCH_PRODUCTS } from '../data/dutchProducts';

const STORAGE_KEY = 'spaarvos_list';

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
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
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

  function handleRemove(product: string) {
    Alert.alert('Verwijderen', `"${product}" verwijderen uit je lijst?`, [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Verwijderen', style: 'destructive',
        onPress: () => saveList(products.filter((p) => p !== product)),
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Mijn lijst</Text>

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
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onLongPress={() => handleRemove(item)}>
              <Text style={styles.itemText}>{item}</Text>
              <Text style={styles.hint}>Ingedrukt houden om te verwijderen</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nog geen producten. Voeg iets toe hierboven.</Text>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
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
  suggestionItem: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  suggestionText: { fontSize: 15, color: '#1A1A1A' },
  item: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
  },
  itemText: { fontSize: 16, color: '#1A1A1A' },
  hint: { fontSize: 11, color: '#BDBDBD', marginTop: 2 },
  empty: { textAlign: 'center', color: '#BDBDBD', marginTop: 60, fontSize: 15 },
});
