import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Mail, ShieldCheck, LogOut, User as UserIcon, Check, Database } from 'lucide-react-native'; // Tambah Database icon
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';

// Import Custom Hooks & Components
import { useProfileLogic } from '../../../hooks/useProfileLogic';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfileMenuItem } from '../../../components/profile/ProfileMenuItem';
import { styles } from '../styles/ProfileStyles';
import { migrateSoldCount } from '../../../services/transactionService'; // Pastikan import ini ada

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    user, isEditing, setIsEditing, displayName, setDisplayName,
    loading, selectedImage, pickImage, saveProfile, logout, cancelEdit
  } = useProfileLogic();

  // State baru untuk loading migrasi
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async () => {
    Alert.alert(
      "Sinkronisasi Data",
      "Sistem akan menghitung ulang total penjualan produk dari riwayat transaksi lama. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Sinkronkan", 
          onPress: async () => {
            setIsMigrating(true);
            try {
              await migrateSoldCount();
              Alert.alert("Sukses", "Data penjualan telah disinkronkan!");
            } catch (e) {
              Alert.alert("Gagal", "Terjadi kesalahan saat sinkronisasi.");
            } finally {
              setIsMigrating(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <ProfileHeader
          insetsTop={insets.top}
          isEditing={isEditing}
          displayName={displayName}
          photoURL={user?.photoURL || null}
          selectedImage={selectedImage}
          onToggleEdit={() => isEditing ? cancelEdit() : setIsEditing(true)}
          onPickImage={pickImage}
          onChangeName={setDisplayName}
        />

        <View style={styles.content}>
          {isEditing ? (
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Check size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Informasi Akun</Text>
              <View style={styles.menuContainer}>
                <ProfileMenuItem 
                  icon={<Mail size={20} color={COLORS.primary} />} 
                  label="Email" value={user?.email || '-'} 
                />
                <ProfileMenuItem 
                  icon={<ShieldCheck size={20} color={COLORS.primary} />} 
                  label="Role" value="Administrator" 
                />
                <ProfileMenuItem 
                  icon={<UserIcon size={20} color={COLORS.primary} />} 
                  label="User ID" value={user?.uid || '-'} 
                  isLast // Hapus isLast jika ingin tambah menu di bawahnya
                />

                {/* --- TOMBOL MIGRASI RAHASIA --- */}
                <TouchableOpacity 
                  style={styles.migrationItem} 
                  onPress={handleMigration}
                  disabled={isMigrating}
                >
                  <View style={styles.migrationLeft}>
                    <Database size={20} color={COLORS.accent} />
                    <View style={styles.migrationTextContent}>
                      <Text style={styles.migrationLabel}>Sinkronisasi Penjualan</Text>
                      <Text style={styles.migrationSub}>Perbarui data sold produk</Text>
                    </View>
                  </View>
                  {isMigrating && <ActivityIndicator size="small" color={COLORS.accent} />}
                </TouchableOpacity>
                {/* ----------------------------- */}
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <LogOut size={20} color="#FF4D4D" />
                <Text style={styles.logoutText}>Keluar dari Akun</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.version}>Swiftstock v1.0.0 by Efendi • 2025</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;