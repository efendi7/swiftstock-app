/**
 * WebLayout.tsx
 *
 * ┌──────────────────┬─────────────────────────────┐
 * │  SIDEBAR         │  WebHeader (fixed)           │
 * │  (collapsible)   ├─────────────────────────────┤
 * │  240 ↔ 64px      │  {children} — page content  │
 * └──────────────────┴─────────────────────────────┘
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS }      from '@constants/colors';
import { UserRole }    from '@navigation/types';
import SidebarMenu     from '@components/web/SidebarMenu';
import WebHeader       from '@components/web/WebHeader';

interface WebLayoutProps {
  children:  React.ReactNode;
  role?:     UserRole | null;
  tenantId?: string | null;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children, role, tenantId }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setCollapsed(p => !p), []);

  return (
<View style={styles.root}>

        {/* SIDEBAR */}
        <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
          <SidebarMenu
            role={role}
            tenantId={tenantId}
            collapsed={collapsed}
            onToggle={toggleSidebar}
          />
        </View>

        {/* KONTEN KANAN */}
        <View style={styles.contentCol}>
          <WebHeader
            role={role}
            tenantId={tenantId}
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={collapsed}
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
    // @ts-ignore
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    // @ts-ignore
    transition: 'width 0.25s ease',
    ...Platform.select({
      web: { boxShadow: '4px 0px 10px rgba(0,0,0,0.05)' } as any,
    }),
  },
  sidebarCollapsed: { width: 64 },
  contentCol: {
    flex: 1,
    flexDirection: 'column',
    // @ts-ignore
    overflow: 'hidden',
  },
  pageContainer: {
    flex: 1,
    // @ts-ignore
    overflow: 'hidden',
  },
});

export default WebLayout;