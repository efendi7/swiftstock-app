// src/screens/Main/AdminDashboard.tsx

import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';

// Definisikan tipe navigasi yang digunakan
type AdminStackParamList = {
    Product: undefined;
    Transaction: undefined;
    Login: undefined;
};

const AdminDashboard = () => {
    const navigation = useNavigation<NavigationProp<AdminStackParamList>>();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Navigasi ke halaman Login (AppNavigator akan otomatis menangani)
        } catch (error) {
            console.error("Logout Gagal:", error);
            Alert.alert("Error", "Gagal melakukan logout.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Panel</Text>

            <View style={styles.buttonContainer}>
                <Button 
                    title="Kelola Produk (CRUD)" 
                    onPress={() => navigation.navigate('Product')} 
                    color="#007bff"
                />
            </View>

            <View style={styles.buttonContainer}>
                <Button 
                    title="Riwayat Transaksi & Laporan" 
                    onPress={() => navigation.navigate('Transaction')} 
                    color="#ffc107"
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

export default AdminDashboard; 

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