import React from 'react';
import { View } from 'react-native';
import { BaseRecentActivity } from '../../../../../components/dashboard/activity';
import { Activity } from '../../../../../types/activity';

interface AdminActivityProps {
  activities: Activity[];
  onSeeMore?: () => void;
  currentUserName?: string;
}

export const AdminActivity: React.FC<AdminActivityProps> = ({ 
  activities, 
  onSeeMore,
  currentUserName = "Admin" 
}) => {
  return (
    /* PENTING: Menghapus SafeAreaView dan ScrollView agar Card tidak terhimpit padding tambahan. 
       Card akan mengikuti lebar container dashboard Anda secara otomatis.
    */
    <View style={{ width: '100%' }}>
        < BaseRecentActivity
          activities={activities} 
          currentUserName={currentUserName}
          title="Log Aktivitas Toko"
          onSeeMore={onSeeMore}
        />
    </View>
  );
};