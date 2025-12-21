import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Mail, ShieldCheck, LogOut, User as UserIcon, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

// Import Custom Hooks & Components
import { useProfileLogic } from '../../hooks/useProfileLogic';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileMenuItem } from '../../components/profile/ProfileMenuItem';
import { styles } from './styles/ProfileStyles';

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    user, isEditing, setIsEditing, displayName, setDisplayName,
    loading, selectedImage, pickImage, saveProfile, logout, cancelEdit
  } = useProfileLogic();

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
                  label="User ID" value={user?.uid || '-'} isLast 
                />
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <LogOut size={20} color="#FF4D4D" />
                <Text style={styles.logoutText}>Keluar dari Akun</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.version}>Swiftstock v1.0.0 by Efendi</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;