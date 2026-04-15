import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
} from 'react-native';
import { X, Tag } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (categoryName: string) => void;
}

export const AddCategoryModal: React.FC<Props> = ({ visible, onClose, onAdd }) => {
  const [categoryName, setCategoryName] = useState('');
  const [isFocused,    setIsFocused]    = useState(false);

  const handleAdd = () => {
    if (categoryName.trim()) {
      onAdd(categoryName.trim());
      setCategoryName('');
      onClose();
    }
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={s.card}>

                {/* Header */}
                <View style={s.header}>
                  <View style={s.headerLeft}>
                    <View style={s.iconWrap}>
                      <Tag size={15} color={COLORS.primary} />
                    </View>
                    <Text style={s.title}>Tambah Kategori</Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} style={s.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Input */}
                <View style={[s.inputWrap, isFocused && s.inputWrapFocus]}>
                  <TextInput
                    style={s.input}
                    placeholder="Nama kategori baru..."
                    placeholderTextColor="#94A3B8"
                    value={categoryName}
                    onChangeText={setCategoryName}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus
                    onSubmitEditing={handleAdd}
                  />
                </View>

                {/* Buttons */}
                <View style={s.btnRow}>
                  <TouchableOpacity style={s.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
                    <Text style={s.cancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.addBtn, !categoryName.trim() && s.addBtnDisabled]}
                    onPress={handleAdd} activeOpacity={0.7}
                    disabled={!categoryName.trim()}
                  >
                    <Text style={s.addText}>Tambah</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:  { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  title:     { fontFamily: 'PoppinsBold', fontSize: 15, color: '#1E293B' },
  closeBtn:  { padding: 4 },

  // Input — border hanya berubah warna, TIDAK pakai outline/border bawaan browser
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, marginBottom: 16 },
  inputWrapFocus: { borderColor: COLORS.primary, backgroundColor: '#fff' },
  input: {
    flex: 1, height: 44,
    fontFamily: 'PoppinsMedium', fontSize: 14, color: '#1E293B',
    // Hilangkan outline/border hitam bawaan browser/RN web
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  btnRow:    { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 42, backgroundColor: '#F1F5F9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cancelText:{ fontFamily: 'PoppinsSemiBold', fontSize: 13, color: '#64748B' },
  addBtn:    { flex: 1, height: 42, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#CBD5E1' },
  addText:   { fontFamily: 'PoppinsBold', fontSize: 13, color: '#fff' },
});