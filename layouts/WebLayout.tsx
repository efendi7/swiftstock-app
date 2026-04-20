/**
 * WebLayout.tsx — Responsive: desktop / tablet / mobile
 *
 * Desktop  ≥1024px : sidebar 240px fixed, bisa di-collapse ke 64px
 * Tablet   768–1023: sidebar auto-collapse ke 64px
 * Mobile   <768px  : sidebar jadi drawer overlay + backdrop
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Animated } from 'react-native';
import { COLORS }   from '@constants/colors';
import { UserRole } from '@navigation/types';
import SidebarMenu  from '@components/web/SidebarMenu';
import WebHeader    from '@components/web/WebHeader';
import { useWindowWidth } from '@hooks/useWindowWidth';

// ── Breakpoints ────────────────────────────────────────────
const BP_MOBILE = 768;
const BP_TABLET = 1024;

type LayoutMode = 'desktop' | 'tablet' | 'mobile';

function getMode(w: number): LayoutMode {
  if (w < BP_MOBILE) return 'mobile';
  if (w < BP_TABLET) return 'tablet';
  return 'desktop';
}

/**
 * Inject CSS web-only properties tanpa error TypeScript.
 * Hanya berlaku di web — di native property ini tidak ada efeknya.
 */
function webStyle(css: Record<string, string | number>): object {
  if (Platform.OS !== 'web') return {};
  return css as any;
}


// ── Props ──────────────────────────────────────────────────
interface WebLayoutProps {
  children:  React.ReactNode;
  role?:     UserRole | null;
  tenantId?: string | null;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children, role, tenantId }) => {
  const windowWidth = useWindowWidth();
  const mode        = getMode(windowWidth);

  const [collapsed,  setCollapsed]  = useState(mode === 'tablet');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Backdrop opacity (mobile)
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Sync saat mode berubah
  useEffect(() => {
    if (mode === 'desktop') { setCollapsed(false); setDrawerOpen(false); }
    if (mode === 'tablet')  { setCollapsed(true);  setDrawerOpen(false); }
    if (mode === 'mobile')  { setCollapsed(false); setDrawerOpen(false); }
  }, [mode]);

  // Fade backdrop saat drawer buka/tutup
  useEffect(() => {
    if (mode !== 'mobile') return;
    Animated.timing(backdropOpacity, {
      toValue: drawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, mode]);

  const toggleSidebar = useCallback(() => {
    if (mode === 'mobile') setDrawerOpen(p => !p);
    else setCollapsed(p => !p);
  }, [mode]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <View style={styles.root}>

      {/* ── DESKTOP / TABLET: sidebar statis ── */}
      {mode !== 'mobile' && (
        <View
          style={[
            styles.sidebar,
            { width: sidebarWidth },
            // ✅ CSS transition diinject lewat webStyle() — tidak error TS
            webStyle({ transition: 'width 0.25s ease' }),
          ]}
        >
          <SidebarMenu
            role={role}
            tenantId={tenantId}
            collapsed={collapsed}
            onToggle={toggleSidebar}
          />
        </View>
      )}

      {/* ── MOBILE: drawer overlay ── */}
      {mode === 'mobile' && (
        <>
          {/* Backdrop — hanya render saat drawer pernah dibuka */}
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
            pointerEvents={drawerOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Drawer panel — slide via CSS transform */}
          <View
            style={[
              styles.drawer,
              // ✅ CSS transform string + transition — tidak error TS
              webStyle({
                transform: `translateX(${drawerOpen ? 0 : -240}px)`,
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }),
            ]}
          >
            <SidebarMenu
              role={role}
              tenantId={tenantId}
              collapsed={false}
              onToggle={closeDrawer}
            />
          </View>
        </>
      )}

      {/* ── KONTEN KANAN ── */}
      <View style={styles.contentCol}>
        <WebHeader
          role={role}
          tenantId={tenantId}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={mode === 'mobile' ? !drawerOpen : collapsed}
        />
        <View style={styles.pageContainer}>
          {children}
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' as any } : {}),
  },

  // Desktop / tablet — lebar di-set via style prop inline
  sidebar: {
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    flexShrink: 0,
    ...Platform.select({
      web: { boxShadow: '4px 0 10px rgba(0,0,0,0.07)' } as any,
    }),
  },

  // Mobile drawer — posisi absolute, geser via CSS transform
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 240,
    zIndex: 100,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: { boxShadow: '4px 0 20px rgba(0,0,0,0.2)' } as any,
    }),
  },

  // Backdrop semi-transparan
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 99,
  },

  contentCol: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden' as any,
    minWidth: 0,
  },

  pageContainer: {
    flex: 1,
    overflow: 'hidden' as any,
  },
});

export default WebLayout;