import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, Tabs } from "expo-router";

export default function Busca() {
    const { query } = useLocalSearchParams();

    console.log("query recebido:", query);

    return (
        <View style={styles.container}>
            <Tabs.Screen
                options={{
                    title: `Busca: ${query}`,
                }}
            />
            <Text style={styles.texto}>Termo buscado: {query}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    texto: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
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