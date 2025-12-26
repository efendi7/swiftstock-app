import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import {  BaseRecentActivity } from '../../../../../components/dashboard/activity/BaseRecentActivity';
import { Activity } from '../../../../../types/activity';
import { useNavigation } from '@react-navigation/native';

// 1. TAMBAHKAN onSeeMore ke dalam interface
interface CashierActivityProps {
  activities?: Activity[]; 
  currentUserName?: string;
  onSeeMore?: () => void; // Tambahkan baris ini
}

export const CashierActivity: React.FC<CashierActivityProps> = ({ 
  activities: propsActivities, 
  currentUserName: propsUserName,
  onSeeMore // Ambil onSeeMore dari props
}) => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const userData = { name: propsUserName || "Kasir 1" }; 

  useEffect(() => {
    if (propsActivities && propsActivities.length > 0) {
      const filtered = propsActivities.filter(item => 
        item.userName === userData.name || item.userName === 'Admin'
      );
      setActivities(filtered);
    } else {
      const rawData: Activity[] = [
        { id: '1', type: 'OUT', message: 'Kasir Checkout total 2 produk "Kopi"', userName: 'Kasir 1', time: '10:00' },
        { id: '2', type: 'IN', message: 'Stok Masuk: 50 unit "Susu UHT"', userName: 'Admin', time: '09:00' },
        { id: '3', type: 'OUT', message: 'Kasir Checkout total 1 produk "Roti"', userName: 'Kasir 2', time: '10:15' },
      ];

      const filtered = rawData.filter(item => 
        item.userName === userData.name || item.userName === 'Admin'
      );
      setActivities(filtered);
    }
  }, [propsActivities, userData.name]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BaseRecentActivity
          activities={activities} 
          currentUserName={userData.name} 
          title="Aktivitas Saya & Toko"
          // GUNAKAN onSeeMore dari props jika ada, jika tidak pakai navigasi default
          onSeeMore={onSeeMore || (() => navigation.navigate('History' as never))}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 16 }
});