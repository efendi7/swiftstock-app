import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Edit3, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface ProfileHeaderProps {
  insetsTop: number;
  isEditing: boolean;
  displayName: string;
  photoURL: string | null;
  selectedImage: string | null;
  onToggleEdit: () => void;
  onPickImage: () => void;
  onChangeName: (text: string) => void;
}

export const ProfileHeader = ({
  insetsTop,
  isEditing,
  displayName,
  photoURL,
  selectedImage,
  onToggleEdit,
  onPickImage,
  onChangeName,
}: ProfileHeaderProps) => {
  const avatarUri = selectedImage || photoURL || 
    `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=ffffff&color=2c537a`;

  return (
    <LinearGradient
      colors={[COLORS.primary, '#2c537a']}
      style={[styles.header, { paddingTop: insetsTop + 40 }]}
    >
      <TouchableOpacity style={styles.editToggleBtn} onPress={onToggleEdit}>
        {isEditing ? <X size={20} color="#FFF" /> : <Edit3 size={20} color="#FFF" />}
      </TouchableOpacity>

      <TouchableOpacity onPress={onPickImage} activeOpacity={isEditing ? 0.7 : 1}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {isEditing && (
            <View style={styles.cameraIconBadge}>
              <Camera size={14} color="#FFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.nameWrapper}>
        {isEditing ? (
          <TextInput
            style={styles.inputName}
            value={displayName}
            onChangeText={onChangeName}
            placeholder="Nama Lengkap"
            placeholderTextColor="rgba(255,255,255,0.5)"
            textAlign="center"
          />
        ) : (
          <Text style={styles.userName} numberOfLines={2}>
            {displayName || 'User Swiftstock'}
          </Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
  },
  editToggleBtn: {
    position: 'absolute',
    right: 20,
    top: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
    zIndex: 10,
  },
  avatarContainer: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 60,
    marginBottom: 10,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.secondary,
    padding: 6,
    borderRadius: 15,
  },
  nameWrapper: { width: '100%', alignItems: 'center', marginTop: 0 },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    textAlign: 'center',
    lineHeight: 30,
  },
  inputName: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFF',
    width: '80%',
  },
});