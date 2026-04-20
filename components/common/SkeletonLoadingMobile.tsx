import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

interface BoneProps {
  width:   number | string;
  height:  number;
  radius?: number;
  style?:  any;
}

const Bone: React.FC<BoneProps> = ({ width, height, radius = 6, style }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E2E8F0', opacity },
        style,
      ]}
    />
  );
};

type SkeletonType = 'product-list' | 'transaction-list' | 'dashboard-card' | 'profile-form' | 'text';

interface Props {
  type?: SkeletonType;
  rows?: number;
  style?: any;
}

const SkeletonLoadingMobile: React.FC<Props> = ({ type = 'product-list', rows = 6, style }) => {
  switch (type) {
    case 'product-list':
    case 'transaction-list':
      return (
        <View style={[sk.wrap, style]}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={sk.productCard}>
              <Bone width={75} height={75} radius={16} />
              <View style={sk.productContent}>
                <View style={sk.productContentLeft}>
                  <Bone width="80%" height={14} radius={4} />
                  <Bone width="50%" height={10} radius={4} style={{ marginTop: 6 }} />
                  <Bone width="65%" height={15} radius={4} style={{ marginTop: 'auto' }} />
                </View>
                <View style={sk.productContentRight}>
                  <Bone width={60} height={16} radius={6} />
                  <Bone width={60} height={16} radius={6} style={{ marginTop: 4 }} />
                  <Bone width={28} height={28} radius={8} style={{ marginTop: 'auto' }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    case 'dashboard-card':
      return (
        <View style={[sk.wrap, { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, style]}>
          {Array.from({ length: rows }).map((_, i) => (
             <View key={i} style={[sk.dashboardCard, { width: '47%' }]}>
               <Bone width={40} height={40} radius={12} style={{ marginBottom: 16 }} />
               <Bone width="70%" height={12} radius={4} style={{ marginBottom: 8 }} />
               <Bone width="40%" height={10} radius={4} />
             </View>
          ))}
        </View>
      );
    case 'profile-form':
      return (
        <View style={[sk.wrap, { paddingHorizontal: 20, paddingTop: 20, gap: 20 }, style]}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Bone width={100} height={100} radius={50} />
          </View>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={{ gap: 8 }}>
              <Bone width="30%" height={12} radius={4} />
              <Bone width="100%" height={50} radius={12} />
            </View>
          ))}
        </View>
      );
    case 'text':
      return (
        <View style={[sk.wrap, style]}>
          {Array.from({ length: rows }).map((_, i) => (
            <Bone key={i} width={i === rows - 1 ? '60%' : '100%'} height={12} radius={4} style={{ marginBottom: 6 }} />
          ))}
        </View>
      );
    default:
      return null;
  }
};

const sk = StyleSheet.create({
  wrap: { gap: 0 },
  productCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 75,
    marginLeft: 12,
  },
  productContentLeft: {
    flex: 1,
    justifyContent: 'flex-start',
    height: '100%',
    marginRight: 8,
  },
  productContentRight: {
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'flex-start',
  },
  dashboardCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});

export { Bone };
export default SkeletonLoadingMobile;
