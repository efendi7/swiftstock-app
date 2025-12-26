import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { Activity } from '../../../types/activity';
import { getActivityTitle, formatActivityMessage } from '../../../utils/activityHelpers';

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
  currentUserName: string;
}

export const ActivityItem = memo(({ activity, isLast, currentUserName }: ActivityItemProps) => {
  const isMe = activity.userName === currentUserName;
  const displayName = isMe ? 'Anda' : activity.userName;

  return (
    <View style={[styles.activityItem, isLast && styles.lastItem]}>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>
          {getActivityTitle(activity.type, activity.message)}
        </Text>
        
        <Text style={styles.activityMessage}>
          {formatActivityMessage(activity.message).map((part, idx) => (
            <Text 
              key={idx} 
              style={[
                part.styleType === 'product' && styles.productText,
                (part.styleType === 'qty' || part.styleType === 'price') && styles.secondaryBold
              ]}
            >
              {part.text}
            </Text>
          ))}
        </Text>

        <Text style={styles.timestamp}>
          {activity.time || 'Baru saja'} {activity.userName && ` • ${displayName}`}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  activityItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  lastItem: { borderBottomWidth: 0, paddingBottom: 5 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark, marginBottom: 2 },
  activityMessage: { fontSize: 11, color: '#444', lineHeight: 16, fontFamily: 'PoppinsRegular' },
  timestamp: { fontSize: 10, color: '#999', marginTop: 4, fontFamily: 'PoppinsRegular' },
  productText: { fontFamily: 'PoppinsBold', color: COLORS.primary },
  secondaryBold: { fontFamily: 'PoppinsBold', color: COLORS.secondary }
});