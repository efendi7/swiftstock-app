import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import { X } from 'lucide-react-native';
import { collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../../../../services/firebaseConfig';
import { Activity } from '../../../../../types/activity';
import { COLORS } from '../../../../../constants/colors';
import { getActivityTitle, formatActivityMessage } from '../../../../../utils/activityHelpers';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserName?: string;
}

const ITEMS_PER_PAGE = 20;

export const ActivityModal: React.FC<ActivityModalProps> = ({
  visible,
  onClose,
  currentUserName = 'Admin'
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  // Load initial data
  useEffect(() => {
    if (visible) {
      loadActivities(true);
    } else {
      // Reset saat modal ditutup
      setActivities([]);
      setLastDoc(null);
      setHasMore(true);
    }
  }, [visible]);

  const loadActivities = async (isInitial = false) => {
    if (!isInitial && !hasMore) return;
    
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let q = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      // Jika bukan initial load, mulai dari dokumen terakhir
      if (!isInitial && lastDoc) {
        q = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];

      if (isInitial) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }

      // Set dokumen terakhir untuk pagination berikutnya
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
      // Jika data yang didapat kurang dari limit, berarti sudah habis
      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    loadActivities(true);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      loadActivities(false);
    }
  };

  const getTitleStyle = (title: string) => {
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

  const renderItem = ({ item, index }: { item: Activity; index: number }) => {
    const isMe = item.userName === currentUserName;
    const displayName = isMe ? 'Anda' : item.userName;
    const title = getActivityTitle(item.type, item.message);
    const isLast = index === activities.length - 1;

    return (
      <View style={[styles.activityItem, isLast && styles.lastItem]}>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, getTitleStyle(title)]}>
            {title}
          </Text>
          
          <Text style={styles.activityMessage}>
            {formatActivityMessage(item.message).map((part, idx) => (
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
            {item.time || 'Baru saja'} {item.userName && ` • ${displayName}`}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Tidak ada aktivitas</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Semua Aktivitas</Text>
              <Text style={styles.subtitle}>
                {activities.length} aktivitas{hasMore ? '+' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat aktivitas...</Text>
            </View>
          ) : (
            <FlatList
              data={activities}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  // Desain mirip ActivityItem
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#94A3B8',
  },
});