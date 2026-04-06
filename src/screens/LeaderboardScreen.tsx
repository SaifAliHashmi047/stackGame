import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/AppNavigator';
import { getLeaderboard, LeaderboardEntry } from '../utils/scoreStorage';
import { THEMES } from '../utils/colorThemes';
import { COLORS } from '../constants/colors';

type Props = StackScreenProps<RootStackParamList, 'Leaderboard'>;

const RANK_LABELS = ['1ST', '2ND', '3RD'];

export default function LeaderboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = THEMES[0];
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  // Reload scores every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getLeaderboard().then(setEntries);
    }, []),
  );

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isTop3 = index < 3;
    return (
      <View style={[styles.row, isTop3 && styles.rowHighlight, index === 0 && styles.rowFirst]}>
        <View style={[styles.rankBadge, index === 0 && styles.rankBadgeFirst]}>
          <Text style={[styles.rankText, index === 0 && styles.rankTextFirst]}>
            {index < 3 ? RANK_LABELS[index] : `#${index + 1}`}
          </Text>
        </View>
        <Text style={[styles.scoreText, index === 0 && styles.scoreTextFirst]}>
          {item.score}
        </Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.gradientColors} style={styles.gradient}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.title}>LEADERBOARD</Text>
        <Text style={styles.subtitle}>TOP 10 SCORES</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No scores yet</Text>
            <Text style={styles.emptyHint}>Play a game to get on the board!</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 28,
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rowHighlight: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  rowFirst: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.45)',
  },
  rankBadge: {
    width: 44,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankBadgeFirst: {
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  rankText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rankTextFirst: {
    color: COLORS.newBestGold,
  },
  scoreText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  scoreTextFirst: {
    color: COLORS.newBestGold,
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
