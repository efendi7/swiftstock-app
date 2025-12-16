// src/screens/Main/DashboardScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Definisikan tipe navigasi yang digunakan
type RootStackParamList = {
  Cashier: undefined;
  Product: undefined;
};

const DashboardScreen = () => {
    // Perlu tahu role user yang login (misalnya dari context/state global)
    // Untuk tujuan contoh, kita anggap semua fungsi ditampilkan
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard POS</Text>

            {/* Menu Kasir */}
            <View style={styles.buttonContainer}>
                <Button 
                    title="Mulai Transaksi (Kasir)" 
                    onPress={() => navigation.navigate('Cashier')} 
                    color="#28a745"
                />
            </View>

            {/* Menu Admin */}
            <View style={styles.buttonContainer}>
                <Button 
                    title="Kelola Produk (Admin)" 
                    onPress={() => navigation.navigate('Product')} 
                    color="#007bff"
                />
                <Button 
                    title="Lihat Laporan Penjualan (Admin)" 
                    onPress={() => alert('Fitur Laporan segera hadir!')} 
                    color="#ffc107"
                />
            </View>
            
        </View>
    );
};

// 🚨 ERROR 1192 SOLUSI: Pastikan menggunakan default export
export default DashboardScreen; 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    buttonContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    }
});