import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '@constants/colors';
import { UserRole } from '@navigation/types';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, LogOut, Store, BarChart3, CreditCard, Crown,
  CalendarCheck,
} from 'lucide-react-native';
import { auth } from '@services/firebaseConfig';
import { SettingsService } from '@services/settingsService';
import { useAuth } from '@hooks/auth/useAuth';
import { LogoShape, LogoPosition, LogoAlign } from '@/types/settings.types';

interface Props {
  role?:      UserRole | null;
  tenantId?:  string | null;
  collapsed?: boolean;
  onToggle?:  () => void;
}

const LOGO_SIZE: Record<LogoShape, { w: number; h: number; r: number }> = {
  square:    { w: 44, h: 44, r: 12 },
  portrait:  { w: 36, h: 52, r: 10 },
  landscape: { w: 62, h: 36, r: 10 },
};

const SidebarMenu: React.FC<Props> = ({ role, tenantId, collapsed = false }) => {
  const navigation = useNavigation<any>();
  const route      = useRoute();
  const { tenantId: authTenantId } = useAuth();

  const [storeName,    setStoreName]    = useState('SwiftStock');
  const [logoUrl,      setLogoUrl]      = useState('');
  const [logoShape,    setLogoShape]    = useState<LogoShape>('square');
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('left');
  const [logoAlign,    setLogoAlign]    = useState<LogoAlign>('flex-start');
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  const tid = tenantId || authTenantId;

  useEffect(() => {
    if (!tid) return;
    SettingsService.getStoreProfile(tid).then(p => {
      if (p.storeName)    setStoreName(p.storeName);
      if (p.logoUrl)      setLogoUrl(p.logoUrl);
      if (p.logoShape)    setLogoShape(p.logoShape);
      if (p.logoPosition) setLogoPosition(p.logoPosition);
      if (p.logoAlign)    setLogoAlign(p.logoAlign);
    }).catch(() => {});
  }, [tid]);

  const handleLogout = async () => {
    try { await auth.signOut(); } catch (e) { console.error(e); }
  };

  const superAdminItems = [
    { icon: LayoutDashboard, label: 'Dashboard',       route: 'Dashboard' },
    { icon: Store,           label: 'All Tenants',     route: 'Tenants' },
    { icon: Users,           label: 'All Users',       route: 'Users' },
    { icon: BarChart3,       label: 'Analytics',       route: 'Analytics' },
    { icon: Settings,        label: 'System Settings', route: 'Settings' },
  ];
  const adminItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    route: 'Dashboard' },
    { icon: Package,         label: 'Products',     route: 'WebProducts' },
    { icon: ShoppingCart,    label: 'Transactions', route: 'WebTransactions' },
    { icon: Users,           label: 'Staff',        route: 'WebCashierManagement' },
    { icon: CalendarCheck,   label: 'Kehadiran',    route: 'WebAttendanceManagement' },
    { icon: Crown,           label: 'Member',       route: 'WebMemberManagement' },
    { icon: CreditCard,      label: 'Subscription', route: 'WebSubscription' },
    { icon: Settings,        label: 'Settings',     route: 'WebSettings' },
  ];
  const cashierItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    route: 'Dashboard' },
    { icon: Package,         label: 'Products',     route: 'WebProducts' },
    { icon: ShoppingCart,    label: 'Transactions', route: 'WebTransactions' },
  ];

  const menuItems =
    role === 'superadmin' ? superAdminItems :
    role === 'admin'      ? adminItems : cashierItems;

  const initials = storeName.split(' ').slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '').join('');

  const logoSize = LOGO_SIZE[logoShape];

  const LogoEl = () => (
    <View style={{
      width: logoSize.w, height: logoSize.h,
      borderRadius: logoSize.r,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.2)',
      flexShrink: 0,
    }}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={{ width: logoSize.w, height: logoSize.h }} resizeMode="cover" />
      ) : (
        <View style={{ width: logoSize.w, height: logoSize.h, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.logoInitials}>{initials}</Text>
        </View>
      )}
    </View>
  );

  const BrandInfo = ({ center }: { center: boolean }) => (
    <View style={[styles.brandInfo, center && { alignItems: 'center' }]}>
      <Text style={[styles.brandName, center && { textAlign: 'center' }]} numberOfLines={2}>{storeName}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>
          {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Kasir'}
        </Text>
      </View>
    </View>
  );

  const renderHeaderContent = () => {
    if (collapsed) {
      return <View style={{ alignItems: 'center', paddingVertical: 4 }}><LogoEl /></View>;
    }

    const isCenter   = logoAlign === 'center';
    const isVertical = logoPosition === 'top' || logoPosition === 'bottom';

    if (isVertical) {
      return (
        <View style={{ alignItems: logoAlign as any, gap: 8 }}>
          {logoPosition === 'top'    && <LogoEl />}
          <BrandInfo center={isCenter} />
          {logoPosition === 'bottom' && <LogoEl />}
        </View>
      );
    }

    return (
      <View style={{
        flexDirection: logoPosition === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: logoAlign as any,
        gap: 10,
      }}>
        <LogoEl />
        <BrandInfo center={false} />
      </View>
    );
  };

  const MenuItem = useCallback(({ icon: Icon, label, route: menuRoute }: any) => {
    const isActive  = route.name === menuRoute;
    const isHovered = hoveredRoute === menuRoute;
    return (
      <Pressable
        style={[
          styles.menuItem,
          isActive  && styles.menuItemActive,
          isHovered && !isActive && styles.menuItemHover,
          collapsed && styles.menuItemCollapsed,
        ]}
        onPress={() => navigation.navigate(menuRoute)}
        // @ts-ignore
        onMouseEnter={() => setHoveredRoute(menuRoute)}
        onMouseLeave={() => setHoveredRoute(null)}
      >
        <Icon size={20} color={isActive ? COLORS.secondary : isHovered ? '#FFF' : 'rgba(255,255,255,0.65)'} />
        {!collapsed && (
          <Text style={[styles.menuText, isActive && styles.menuTextActive, isHovered && !isActive && styles.menuTextHover]}>
            {label}
          </Text>
        )}
        {collapsed && isHovered && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  }, [route.name, hoveredRoute, collapsed, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>{renderHeaderContent()}</View>

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={[styles.menuContent, collapsed && styles.menuContentCollapsed]}
        showsVerticalScrollIndicator={false}
      >
        {!collapsed && <Text style={styles.menuSectionLabel}>Menu</Text>}
        {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
      </ScrollView>

      <TouchableOpacity
        style={[styles.logoutButton, collapsed && styles.logoutCollapsed]}
        onPress={handleLogout}
      >
        <LogOut size={18} color="rgba(255,255,255,0.65)" />
        {!collapsed && <Text style={styles.logoutText}>Keluar</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'column', overflow: 'hidden' as any },
  header:               { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  logoInitials:         { fontSize: 15, fontFamily: 'PoppinsBold', color: '#FFF', letterSpacing: 0.5 },
  brandInfo:            { flex: 1 },
  brandName:            { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF', lineHeight: 19 },
  roleBadge:            { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  roleBadgeText:        { fontSize: 9, fontFamily: 'PoppinsSemiBold', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },
  menuScroll:           { flex: 1 },
  menuContent:          { paddingVertical: 10, paddingHorizontal: 4 },
  menuContentCollapsed: { paddingHorizontal: 0, alignItems: 'center' },
  menuSectionLabel:     { fontSize: 9, fontFamily: 'PoppinsBold', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as any, letterSpacing: 1, paddingHorizontal: 18, marginBottom: 4, marginTop: 4 },
  menuItem:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 18, marginHorizontal: 6, borderRadius: 10, marginBottom: 2, cursor: 'pointer' as any, position: 'relative' as any } as any,
  menuItemActive:       { backgroundColor: 'rgba(0,167,157,0.18)' },
  menuItemHover:        { backgroundColor: 'rgba(255,255,255,0.08)' },
  menuItemCollapsed:    { paddingHorizontal: 0, marginHorizontal: 0, width: 44, justifyContent: 'center', borderRadius: 10 },
  menuText:             { marginLeft: 11, fontSize: 13, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.65)' },
  menuTextActive:       { color: COLORS.secondary, fontFamily: 'PoppinsBold' },
  menuTextHover:        { color: '#FFF' },
  tooltip: {
    position: 'absolute' as any,
    left: 52,
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    zIndex: 999,
    ...({
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    } as any),
  },
  tooltipText:          { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#FFF' },
  logoutButton:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' as any },
  logoutCollapsed:      { justifyContent: 'center', paddingHorizontal: 0 },
  logoutText:           { fontSize: 13, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.65)' },
});

export default SidebarMenu;