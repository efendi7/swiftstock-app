import React, { useState, useEffect } from 'react';
import { View } from 'react-native'; // Ganti SafeAreaView & ScrollView dengan View biasa
import { BaseRecentActivity } from '../../../../../components/dashboard/activity/BaseRecentActivity';
import { Activity } from '../../../../../types/activity';
import { useNavigation } from '@react-navigation/native';

interface CashierActivityProps {
  activities?: Activity[]; 
  currentUserName?: string;
  onSeeMore?: () => void;
}

export const CashierActivity: React.FC<CashierActivityProps> = ({ 
  activities: propsActivities, 
  currentUserName: propsUserName,
  onSeeMore 
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
      ];
      const filtered = rawData.filter(item => 
        item.userName === userData.name || item.userName === 'Admin'
      );
      setActivities(filtered);
    }
  }, [propsActivities, userData.name]);

  return (
    /* Gunakan View dengan width 100% tanpa padding/margin tambahan 
       agar sinkron dengan AdminActivity 
    */
    <View style={{ width: '100%' }}>
      <BaseRecentActivity
        activities={activities} 
        currentUserName={userData.name} 
        title="Aktivitas Saya & Toko"
        onSeeMore={onSeeMore || (() => navigation.navigate('History' as never))}
      />
    </View>
  );
};