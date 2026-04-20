import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Store, Coffee, Scissors } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import FloatingLabelInput from '@components/FloatingLabelInput';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@services/firebaseConfig';
import { COLORS } from '@constants/colors';
import { BusinessType } from '@types/settings.types';
import { useAuth } from '@/hooks/auth/useAuth';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const storeTypes: { id: BusinessType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'retail', label: 'Retail & Grosir', icon: <Store size={24} color={COLORS.primary} />, desc: 'Toko baju, kelontong, minimarket, elektronik.' },
  { id: 'fnb', label: 'Food & Beverage', icon: <Coffee size={24} color={COLORS.primary} />, desc: 'Restoran, kafe, kedai kopi, pujasera.' },
  { id: 'services', label: 'Jasa & Layanan', icon: <Scissors size={24} color={COLORS.primary} />, desc: 'Salon, barbershop, bengkel, cuci mobil.' },
];

const StoreSetupScreen = () => {
    const [storeName, setStoreName] = useState('');
    const [selectedType, setSelectedType] = useState<BusinessType>('retail');
    const [isLoading, setIsLoading] = useState(false);
    // Kita asumsikan saat di layar ini kita sudah tau tenantId pengguna dari doc users-nya.
    const { user, tenantId } = useAuth(); 

    const handleCompleteSetup = async () => {
        console.log(">>> [StoreSetup] Button ditekan!");
        
        // Coba tangkap current user langsung dari auth instansiasi saat tombol ditekan
        const currentUser = auth.currentUser || user;
        
        console.log(">>> [StoreSetup] currentUser:", currentUser?.uid);
        console.log(">>> [StoreSetup] tenantId:", tenantId);
        
        if (!storeName.trim()) {
            alert("Nama Toko tidak boleh kosong");
            return;
        }
        
        if (!currentUser) {
            console.log(">>> [StoreSetup] currentUser NULL, membatalkan aksi.");
            alert("Terjadi kesalahan sesi. Mohon refresh halaman.");
            return;
        }
        
        if (!tenantId) {
            alert("Sistem sedang memuat ID Toko, mohon tunggu sebentar...");
            return; 
        }

        setIsLoading(true);
        try {
            console.log(">>> [StoreSetup] Menyimpan update tenant:", tenantId);
            // 1. Update data tenant utama
            const tenantRef = doc(db, 'tenants', tenantId);
            await updateDoc(tenantRef, {
                name: storeName,          // kompatibel dengan RegisterScreen
                storeName: storeName,     // kompatibel dengan useAuth
                businessType: selectedType
            });

            // 1.5 Simpan juga ke sub-collection config/store_profile agar langsung terbaca di Sidebar dan Settings!
            const profileRef = doc(db, 'tenants', tenantId, 'config', 'store_profile');
            // Gunakan setDoc dengan opsi merge agar tidak error jika dokumen belum ada
            await setDoc(profileRef, {
                storeName: storeName,
                businessType: selectedType
            }, { merge: true });

            console.log(">>> [StoreSetup] Menyimpan update user:", currentUser.uid);
            // 2. Update status user
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                isSetupComplete: true
            });

            console.log(">>> [StoreSetup] SUKSES! AppNavigator seharusnya mendeteksi isSetupComplete = true sekarang.");
            // Note: Listener `onAuthStateChanged` di AppNavigator akan otomatis memicu re-render
            // dan mendeteksi userData.isSetupComplete == true, lalu berpindah ke Dashboard.
        } catch (error) {
            console.error(">>> [StoreSetup] ERROR:", error);
            alert("Terjadi kesalahan saat menyimpan data toko: " + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Lengkapi Profil Bisnis Anda</Text>
                <Text style={styles.subtitle}>Beri nama bisnis Anda dan pilih kategori agar kami bisa menyesuaikan pengalaman Anda.</Text>
                
                <View style={styles.formSection}>
                    <FloatingLabelInput
                        label="Nama Toko / Bisnis"
                        value={storeName}
                        onChangeText={setStoreName}
                        icon={<Store size={20} color={COLORS.textLight} />}
                    />
                </View>

                <Text style={styles.labelTitle}>Jenis Bisnis</Text>
                <View style={styles.optionsContainer}>
                    {storeTypes.map((type) => {
                        const isSelected = selectedType === type.id;
                        return (
                            <TouchableOpacity 
                                key={type.id} 
                                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                                onPress={() => setSelectedType(type.id)}
                            >
                                <View style={styles.iconContainer}>
                                    {type.icon}
                                </View>
                                <View style={styles.typeTextContainer}>
                                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>{type.label}</Text>
                                    <Text style={styles.typeDesc}>{type.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
                    onPress={handleCompleteSetup} 
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Selesai & Mulai Gunakan Aplikasi</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center'
    },
    content: {
        width: isMobile ? '90%' : 500, backgroundColor: COLORS.white, padding: 30, borderRadius: 20,
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
    },
    title: {
        fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10, textAlign: 'center'
    },
    subtitle: {
        fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 30
    },
    formSection: {
        marginBottom: 20
    },
    labelTitle: {
        fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 15
    },
    optionsContainer: {
        gap: 15, marginBottom: 30
    },
    typeCard: {
        flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa'
    },
    typeCardSelected: {
        borderColor: COLORS.secondary, backgroundColor: '#e0f2f1' // Secondary light
    },
    iconContainer: {
        marginRight: 15
    },
    typeTextContainer: {
        flex: 1
    },
    typeLabel: {
        fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4
    },
    typeLabelSelected: {
        color: COLORS.primary
    },
    typeDesc: {
        fontSize: 12, color: COLORS.textLight, lineHeight: 18
    },
    submitBtn: {
        backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, alignItems: 'center'
    },
    submitText: {
        color: '#fff', fontSize: 16, fontWeight: 'bold'
    }
});

export default StoreSetupScreen;
