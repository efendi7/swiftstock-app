/**
 * components/common/web/DropdownModal.tsx
 * Dropdown generik via RN Modal — tidak terblokir ScrollView/body.
 * Posisi dihitung dari anchor ref dengan measure().
 *
 * Cara pakai:
 *   <DropdownModal
 *     options={[{ label: 'Maret 2026', value: '2026-03' }]}
 *     selected="2026-03"
 *     onSelect={v => setMonth(v)}
 *     buttonLabel={selectedLabel}
 *     buttonIcon={<CalendarDays size={14} color={COLORS.primary} />}
 *   />
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

export interface DropdownOption {
  label: string;
  value: string;
}

interface Props {
  options:      DropdownOption[];
  selected:     string;
  onSelect:     (value: string) => void;
  /** Label di tombol — biasanya label opsi terpilih */
  buttonLabel?: string;
  /** Icon di kiri tombol (opsional) */
  buttonIcon?:  React.ReactNode;
  /** Lebar minimum dropdown list */
  minWidth?:    number;
}

const DropdownModal: React.FC<Props> = ({
  options, selected, onSelect,
  buttonLabel, buttonIcon, minWidth = 210,
}) => {
  const [open, setOpen] = useState(false);
  const btnRef          = useRef<View>(null);
  const [pos, setPos]   = useState({ top: 0, left: 0, width: 0 });

  const label = buttonLabel
    ?? options.find(o => o.value === selected)?.label
    ?? selected;

  const openDropdown = () => {
    btnRef.current?.measure((_fx, _fy, w, h, px, py) => {
      setPos({ top: py + h + 4, left: px, width: Math.max(w, minWidth) });
    });
    setOpen(true);
  };

  return (
    <>
      <TouchableOpacity ref={btnRef as any} style={s.btn} onPress={openDropdown}>
        {buttonIcon}
        <Text style={s.btnTxt}>{label}</Text>
        {open
          ? <ChevronUp   size={14} color={COLORS.primary} />
          : <ChevronDown size={14} color={COLORS.primary} />}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        {/* Backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject as any}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        />
        {/* List */}
        <View style={[s.list, { top: pos.top, left: pos.left, width: pos.width }]}>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            {options.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.opt, o.value === selected && s.optActive]}
                onPress={() => { onSelect(o.value); setOpen(false); }}
              >
                <Text style={[s.optTxt, o.value === selected && s.optTxtActive]}>
                  {o.label}
                </Text>
                {o.value === selected && <Text style={s.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, cursor: 'pointer' as any },
  btnTxt:    { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  list:      { position: 'absolute' as any, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 20, overflow: 'hidden', zIndex: 9999 },
  opt:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, cursor: 'pointer' as any },
  optActive: { backgroundColor: COLORS.primary + '0D' },
  optTxt:    { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#475569' },
  optTxtActive: { color: COLORS.primary, fontFamily: 'PoppinsBold' },
  check:     { fontSize: 12, color: COLORS.primary, fontFamily: 'PoppinsBold' },
});

export default DropdownModal;