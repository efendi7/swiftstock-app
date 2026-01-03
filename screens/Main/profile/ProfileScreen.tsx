import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Mail,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Check,
  Database,
  UserPlus,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../../navigation/types';
import { COLORS } from '../../../constants/colors';
import { useProfileLogic } from '../../../hooks/useProfileLogic';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfileMenuItem } from '../../../components/profile/ProfileMenuItem';
import { styles } from '../styles/ProfileStyles';
import { migrateSoldCount } from '../../../services/transactionService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const {
    user,
    role,
    isEditing,
    setIsEditing,
    displayName,
    setDisplayName,
    loading,
    selectedImage,
    pickImage,
    saveProfile,
    logout,
    cancelEdit,
  } = useProfileLogic();

  const [isMigrating, setIsMigrating] = useState(false);

  /* =====================
     HANDLERS
  ====================== */

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Yakin ingin keluar dari akun ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleMigration = async () => {
    Alert.alert(
      'Sinkronisasi Data',
      'Hitung ulang total penjualan produk?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Sinkronkan',
          onPress: async () => {
            setIsMigrating(true);
            try {
              await migrateSoldCount();
              Alert.alert('Sukses', 'Data penjualan berhasil disinkronkan.');
            } catch {
              Alert.alert('Gagal', 'Terjadi kesalahan saat sinkronisasi.');
            } finally {
              setIsMigrating(false);
            }
          },
        },
      ]
    );
  };

  const goToCreateCashier = () => {
    if (role !== 'admin') {
      Alert.alert('Akses Ditolak');
      return;
    }
    navigation.navigate('CreateCashier');
  };

  const goToCashierManagement = () => {
  navigation.navigate('CashierManagement' as any);
};

  /* =====================
     RENDER
  ====================== */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader
          insetsTop={insets.top}
          isEditing={isEditing}
          displayName={displayName}
          photoURL={user?.photoURL || null}
          selectedImage={selectedImage}
          onToggleEdit={() =>
            isEditing ? cancelEdit() : setIsEditing(true)
          }
          onPickImage={pickImage}
          onChangeName={setDisplayName}
        />

        <View style={styles.content}>
          {/* =====================
              EDIT MODE
          ====================== */}
          {isEditing ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Check size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>
                    Simpan Perubahan
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* =====================
                  INFO AKUN
              ====================== */}
              <Text style={styles.sectionTitle}>Informasi Akun</Text>
              <View style={styles.menuContainer}>
                <ProfileMenuItem
                  icon={<Mail size={20} color={COLORS.primary} />}
                  label="Email"
                  value={user?.email || '-'}
                />

                <ProfileMenuItem
                  icon={
                    <ShieldCheck size={20} color={COLORS.primary} />
                  }
                  label="Role"
                  value={
                    role === 'admin' ? 'Administrator' : 'Kasir'
                  }
                />

                {role === 'admin' && (
                  <ProfileMenuItem
                    icon={
                      <UserIcon size={20} color={COLORS.primary} />
                    }
                    label="User ID"
                    value={
                      user?.uid
                        ? `${user.uid.slice(0, 8)}…`
                        : '-'
                    }
                    isLast
                  />
                )}
              </View>

              {/* =====================
                  MENU ADMIN
              ====================== */}
              {role === 'admin' && (
                <>
                  <Text style={styles.sectionTitle}>
                    Manajemen Admin
                  </Text>
                  <View style={styles.menuContainer}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={goToCreateCashier}
                    >
                      <View style={styles.menuItemLeft}>
                        <View
                          style={[
                            styles.iconContainer,
                            {
                              backgroundColor:
                                COLORS.primary + '15',
                            },
                          ]}
                        >
                          <UserPlus
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                        <Text style={styles.menuItemLabel}>
                          Buat Akun Kasir
                        </Text>
                      </View>
                      <ChevronRight
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
        style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#F5F5F5' }]}
        onPress={goToCashierManagement}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '15' }]}>
             {/* Gunakan ShieldCheck atau Users icon */}
            <ShieldCheck size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuItemLabel}>Kelola & Performa Kasir</Text>
        </View>
        <ChevronRight size={18} color={COLORS.textLight} />
      </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTitle}>
                    Sistem & Database
                  </Text>
                  <View style={styles.menuContainer}>
                    <TouchableOpacity
                      style={styles.migrationItem}
                      onPress={handleMigration}
                      disabled={isMigrating}
                    >
                      <View style={styles.migrationLeft}>
                        <Database
                          size={20}
                          color={COLORS.accent}
                        />
                        <View
                          style={styles.migrationTextContent}
                        >
                          <Text style={styles.migrationLabel}>
                            Sinkronisasi Penjualan
                          </Text>
                          <Text style={styles.migrationSub}>
                            Hitung ulang total sold produk
                          </Text>
                        </View>
                      </View>
                      {isMigrating && (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.accent}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* =====================
                  LOGOUT
              ====================== */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#FF4D4D" />
                <Text style={styles.logoutText}>
                  Keluar dari Akun
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.version}>
            Swiftstock v1.0.0 by Efendi • 2025
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
