// src/screens/Main/ProductScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ProductScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Halaman Kelola Produk (Admin)</Text>
            <Text>CRUD Produk akan diimplementasikan di sini.</Text>
            <Button title="Tambah Produk Baru" onPress={() => {}} />
            {/* ... Daftar Produk ... */}
        </View>
    );
};

// 🚨 ERROR 1192 SOLUSI: Pastikan menggunakan default export
export default ProductScreen; 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
});