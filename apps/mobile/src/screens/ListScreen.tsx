import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { getList, addToList, removeFromList } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';

const USER_ID = 'user-1'; // Replace with real auth later

export default function ListScreen() {
  const [products, setProducts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications().then(setPushToken);
    loadList();
  }, []);

  async function loadList() {
    const list = await getList(USER_ID);
    setProducts(list);
  }

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    await addToList(USER_ID, trimmed, pushToken ?? '');
    setInput('');
    loadList();
  }

  async function handleRemove(product: string) {
    Alert.alert('Çıkar', `"${product}" listeden çıkarılsın mı?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkar', style: 'destructive', onPress: async () => {
          await removeFromList(USER_ID, product);
          loadList();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alışveriş Listem</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ürün ekle (ör. melk, kaas...)"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onLongPress={() => handleRemove(item)}>
            <Text style={styles.itemText}>{item}</Text>
            <Text style={styles.hint}>Basılı tut → çıkar</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz ürün yok. Eklemek için yukarıya yaz.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#E8572A', borderRadius: 12,
    width: 48, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  item: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemText: { fontSize: 16, color: '#1A1A1A' },
  hint: { fontSize: 11, color: '#BDBDBD' },
  empty: { textAlign: 'center', color: '#BDBDBD', marginTop: 60, fontSize: 15 },
});
