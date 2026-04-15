import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../constants/colors';
import { Activity } from '../../../types/activity';
import { ActivityHeader } from './ActivityHeader';
import { ActivityItem } from './ActivityItem';
import { BaseCard } from '../../ui/BaseCard';
import { DashboardService } from '../../../services/dashboardService';

interface BaseRecentActivityProps {
  activities: Activity[];
  onSeeMore?: () => void;
  title?: string;
  currentUserName: string;
  userRole: string;
  tenantId: string;
  containerStyle?: 'card' | 'flat';
}

export const BaseRecentActivity: React.FC<BaseRecentActivityProps> = ({
  activities,
  onSeeMore,
  title = 'Aktivitas Terbaru',
  currentUserName,
  userRole,
  tenantId,
  containerStyle = 'card',
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    Alert.alert(
      'Hapus Riwayat',
      'Apakah Anda yakin ingin menghapus semua log aktivitas?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              
              await DashboardService.clearAllActivities(tenantId);
              Alert.alert('Berhasil', 'Log aktivitas telah dibersihkan.');
            } catch (error) {
              Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus log.');
            }
          },
        },
      ]
    );
  };

  const hasActivities = activities.length > 0;
  const limitedActivities = activities.slice(0, 5);

  return (
    <BaseCard variant={containerStyle === 'flat' ? 'flat' : 'ultraSoft'} style={containerStyle === 'flat' ? styles.cardFlat : styles.card}>
      <ActivityHeader
        title={title}
        showClear={userRole === 'admin' && hasActivities}
        onClear={handleClear}
      />

      {!hasActivities ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada aktivitas periode ini</Text>
        </View>
      ) : (
        <>
          <View style={styles.activitiesList}>
            {limitedActivities.map((activity, index) => {
              const liveTime = activity.createdAt
                ? DashboardService.formatRelativeTime(activity.createdAt.toDate())
                : 'Baru saja';
              return (
                <ActivityItem
                  key={activity.id || index}
                  activity={{ ...activity, time: liveTime }}
                  isLast={index === limitedActivities.length - 1}
                  currentUserName={currentUserName}
                />
              );
            })}
          </View>

          {onSeeMore && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={onSeeMore}>
              <Text style={styles.seeMoreText}>Lihat Selengkapnya</Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 20 },
  cardFlat: { padding: 0, marginBottom: 0 },
  activitiesList: { gap: 0 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textLight, fontSize: 12, fontFamily: 'PoppinsRegular' },
  seeMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F2F2F2',
  },
  seeMoreText: { fontSize: 12, color: COLORS.primary, fontFamily: 'PoppinsMedium', marginRight: 4 },
});