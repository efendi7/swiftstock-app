// src/screens/Main/CashierDashboard.tsx

import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';

// Definisikan tipe navigasi yang digunakan
type CashierStackParamList = {
    Cashier: undefined;
    Login: undefined;
};

const CashierDashboard = () => {
    const navigation = useNavigation<NavigationProp<CashierStackParamList>>();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // AppNavigator akan otomatis pindah ke LoginScreen
        } catch (error) {
            console.error("Logout Gagal:", error);
            Alert.alert("Error", "Gagal melakukan logout.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard Kasir</Text>

            <View style={styles.buttonContainer}>
                <Button 
                    title="Mulai Transaksi Penjualan" 
                    onPress={() => navigation.navigate('Cashier')} 
                    color="#28a745"
                />
            </View>

            {/* Kasir biasanya hanya bisa melihat riwayat transaksinya sendiri */}
            <View style={styles.buttonContainer}>
                 <Button 
                    title="Lihat Riwayat Transaksi Saya" 
                    onPress={() => alert('Menuju riwayat transaksi pribadi...')} 
                    color="#007bff"
                />
            </View>

            <View style={styles.buttonContainer}>
                <Button 
                    title="Logout" 
                    onPress={handleLogout} 
                    color="#dc3545"
                />
            </View>
        </View>
    );
};

export default CashierDashboard; 

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    buttonContainer: { 
        marginBottom: 20, 
        padding: 10, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        elevation: 2,
    },
});