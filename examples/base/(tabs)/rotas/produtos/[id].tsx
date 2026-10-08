import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Tabs } from 'expo-router';

export default function ProdutoDetalhe() {
  const { id } = useLocalSearchParams();

  console.log('ID recebido:', id);

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          title: `Produto ${id}`,
        }}
      />
      <Text style={styles.texto}>Crie aqui sua página da rota!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#6868f7ff",
    justifyContent: "center",
  },
  texto: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    alignItems: "center",
    justifyContent: "center",

  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 16,
    gap: 12,
  },
  headerTitleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  inputContainer: {
    flex: 1,
  },
});

