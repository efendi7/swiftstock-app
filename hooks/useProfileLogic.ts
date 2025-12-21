import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../services/firebaseConfig';
import { ProfileService } from '../services/profileService';

export const useProfileLogic = () => {
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  const pickImage = async () => {
    if (!isEditing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Butuh izin galeri.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (displayName.trim().length < 3) {
      Alert.alert('Peringatan', 'Nama minimal 3 karakter');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = user.photoURL || '';
      if (selectedImage) {
        finalImageUrl = await ProfileService.uploadAvatar(selectedImage);
      }
      await ProfileService.updateFullProfile(user, {
        displayName: displayName.trim(),
        photoURL: finalImageUrl,
      });
      setIsEditing(false);
      setSelectedImage(null);
      Alert.alert('Sukses', 'Profil berhasil diperbarui');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal update profil');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDisplayName(user?.displayName || '');
    setSelectedImage(null);
  };

  return {
    user,
    isEditing,
    setIsEditing,
    displayName,
    setDisplayName,
    loading,
    selectedImage,
    pickImage,
    saveProfile,
    logout,
    cancelEdit
  };
};