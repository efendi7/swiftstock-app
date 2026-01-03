import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // --- MENU ITEM SECTION (Untuk Tombol Tambah Kasir & Menu Umum) ---
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsMedium',
    color: '#333',
  },

  // --- MIGRATION SECTION ---
  migrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  migrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  migrationTextContent: {
    marginLeft: 15,
  },
  migrationLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.primary, // Menggunakan primary agar senada
  },
  migrationSub: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
  },
  
  // --- HEADER SECTION ---
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
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.secondary,
    padding: 6,
    borderRadius: 15,
  },

  // --- NAME SECTION ---
  nameWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    textAlign: 'center',
    width: '100%',
    lineHeight: 32,
  },
  inputName: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFF',
    width: '80%',
    paddingVertical: 5,
  },

  // --- CONTENT BODY ---
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 15,
    marginTop: 10,
    color: '#333',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // --- BUTTONS ---
  saveButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    gap: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  logoutButton: {
    marginTop: 10,
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },

  // --- FOOTER ---
  version: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    fontFamily: 'PoppinsRegular',
  },
});