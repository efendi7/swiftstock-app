import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { Activity } from '../../../types/activity';
import { ActivityHeader } from './ActivityHeader';
import { ActivityItem } from './ActivityItem';

interface BaseRecentActivityProps {
  activities: Activity[];
  onSeeMore?: () => void;
  title?: string;
  currentUserName: string;
}

export const BaseRecentActivity: React.FC<BaseRecentActivityProps> = ({ 
  activities, 
  onSeeMore,
  title = "Aktivitas Terbaru",
  currentUserName
}) => {
  const hasActivities = activities.length > 0;
  const limitedActivities = activities.slice(0, 5);

  return (
    <View style={styles.card}>
      {/* Dipanggil di sini, jadi tidak perlu diimpor lagi di AdminActivity */}
      <ActivityHeader 
        title={title} 
        onSeeMore={onSeeMore} 
        hasData={hasActivities} 
      />

      {!hasActivities ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada aktivitas periode ini</Text>
        </View>
      ) : (
        <View style={styles.activitiesList}>
          {limitedActivities.map((activity, index) => (
            <ActivityItem 
              key={activity.id || index}
              activity={activity}
              isLast={index === limitedActivities.length - 1}
              currentUserName={currentUserName}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5 
  },
  activitiesList: { gap: 0 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textLight, fontSize: 12, fontFamily: 'PoppinsRegular' },
});