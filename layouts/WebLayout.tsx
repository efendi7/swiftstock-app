/**
 * WebLayout.tsx
 * 
 * PENTING: Tidak ada ScrollView di sini.
 * Setiap page mengatur scroll-nya sendiri.
 * Khusus ProductScreenWeb → hanya ProductListWeb yang scroll.
 * 
 * STRUKTUR:
 * ┌────────────┬─────────────────────────────┐
 * │            │  WebHeader (fixed)           │
 * │  SIDEBAR   ├─────────────────────────────┤
 * │  (fixed)   │  {children} — page content  │
 * │            │  (page yg atur scroll-nya)   │
 * └────────────┴─────────────────────────────┘
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@constants/colors';
import { UserRole } from '@navigation/types';
import SidebarMenu from '@components/web/SidebarMenu';
import WebHeader from '@components/web/WebHeader';

interface WebLayoutProps {
  children: React.ReactNode;
  role?: UserRole | null;
  tenantId?: string | null;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children, role, tenantId }) => {
  return (
    // Root: mengisi full viewport, overflow hidden → tidak ada scroll di luar page
    <View style={styles.root}>

      {/* SIDEBAR — fixed di kiri, tidak scroll */}
      <View style={styles.sidebar}>
        <SidebarMenu role={role} tenantId={tenantId} />
      </View>

      {/* KONTEN KANAN — flex column */}
      <View style={styles.contentCol}>

        {/* WEBHEADER — sticky di atas, title berubah per route */}
        <WebHeader role={role} tenantId={tenantId} />

        {/* CHILDREN — setiap page mengatur scroll-nya sendiri */}
        {/* TIDAK ADA ScrollView di sini */}
        <View style={styles.pageContainer}>
          {children}
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Full viewport, tidak ada scroll di level ini
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    // @ts-ignore
    height: '100vh',
    overflow: 'hidden',
  },

  // SIDEBAR — lebar tetap, tinggi full, tidak scroll
  sidebar: {
    width: 240,
    backgroundColor: COLORS.primary,
    // @ts-ignore
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '4px 0px 10px rgba(0,0,0,0.05)' } as any,
    }),
  },

  // KOLOM KANAN — flex column: header (fixed) + page (flex 1)
  contentCol: {
    flex: 1,
    flexDirection: 'column',
    // @ts-ignore
    overflow: 'hidden',
  },

  // PAGE CONTAINER — mengisi sisa tinggi setelah WebHeader
  // Tidak ada padding/margin di sini, biarkan tiap page yang atur
  pageContainer: {
    flex: 1,
    // @ts-ignore
    overflow: 'hidden',
  },
});

export default WebLayout;