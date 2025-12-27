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
  const title = getActivityTitle(activity.type, activity.message);

  const getTitleStyle = () => {
    // BIRU untuk Produk Baru
    if (title === 'PRODUK BARU') {
      return { color: '#3B82F6' }; // Blue
    }
    
    // HIJAU untuk Stok Masuk
    if (title === 'STOK MASUK') {
      return { color: '#10B981' }; // Green
    }
    
    // ORANYE untuk Update Data (Harga, Kategori, Nama, Supplier)
    if (title.includes('UPDATE')) {
      return { color: '#F59E0B' }; // Amber/Orange
    }
    
    // MERAH untuk Pengurangan/Penjualan
    if (title === 'PENJUALAN' || title === 'STOK KELUAR') {
      return { color: '#EF4444' }; // Red
    }
    
    // Default
    return { color: COLORS.primary };
  };

  return (
    <View style={[styles.activityItem, isLast && styles.lastItem]}>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, getTitleStyle()]}>
          {title}
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
  activityItem: { 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5' 
  },
  lastItem: { 
    borderBottomWidth: 0, 
    paddingBottom: 5 
  },
  activityContent: { 
    flex: 1 
  },
  activityTitle: { 
    fontSize: 10, 
    fontFamily: 'PoppinsBold', 
    marginBottom: 2, 
    letterSpacing: 0.8 
  },
  activityMessage: { 
    fontSize: 12, 
    color: '#444', 
    lineHeight: 18, 
    fontFamily: 'PoppinsRegular' 
  },
  timestamp: { 
    fontSize: 10, 
    color: '#999', 
    marginTop: 4, 
    fontFamily: 'PoppinsRegular' 
  },
  productText: { 
    fontFamily: 'PoppinsBold', 
    color: '#1E293B' 
  },
  secondaryBold: { 
    fontFamily: 'PoppinsBold', 
    color: COLORS.secondary 
  }
});