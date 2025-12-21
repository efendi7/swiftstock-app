import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Header Section
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

  // Name Section
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

  // Content Body
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 15,
    color: '#333',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    // Shadow untuk iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Elevation untuk Android
    elevation: 2,
  },

  // Buttons
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
    marginTop: 25,
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

  // Footer
  version: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    fontFamily: 'PoppinsRegular',
  },
});