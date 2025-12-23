// components/dashboard/Stats.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const PADDING_SCREEN = 40;
const GAP = 12;
const CARD_WIDTH = (width - PADDING_SCREEN - GAP) / 2;

export interface StatItem {
  value: number | string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

interface StatsProps {
  title?: string;
  titleIcon?: LucideIcon;
  stats: StatItem[];
  columns?: 2 | 3 | 4; // Flexible column layout
}

export const Stats: React.FC<StatsProps> = React.memo(
  ({ title, titleIcon: TitleIcon, stats, columns = 2 }) => {
    const cardWidth = (width - PADDING_SCREEN - GAP * (columns - 1)) / columns;

    return (
      <View style={styles.container}>
        {/* Optional Title Section */}
        {title && (
          <View style={styles.headerTitle}>
            {TitleIcon && (
              <TitleIcon size={18} color={COLORS.textDark} style={styles.titleIcon} />
            )}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.gridContainer}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View
                key={index}
                style={[styles.statCard, { width: cardWidth }]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: stat.iconBgColor },
                  ]}
                >
                  <Icon size={16} color={stat.iconColor} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {stat.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: 'PoppinsBold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#FFF',
    height: 65,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',

    // Border & Shadow untuk menghindari flicker
    borderWidth: 1,
    borderColor: '#F0F0F0',

    // Shadow iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,

    // Elevation Android (rendah untuk menghindari flicker)
    elevation: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    fontFamily: 'PoppinsBold',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
    lineHeight: 12,
    fontFamily: 'PoppinsRegular',
  },
});