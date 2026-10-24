import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WaveformVisualizer } from '../../components/ui/WaveformVisualizer';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface ProgressData {
  totalSessions: number;
  averageClarity: number;
  averageTechnical: number;
  averageGrammar: number;
  averageReadiness: number;
  totalSpokenSeconds: number;
  topRecurringWeaknesses: Array<{ weakness: string; frequency: number }>;
  completedTopicIds: string[];
}

interface HistoryItem {
  sessionId: string;
  topicId: string;
  topicName?: string;
  durationSeconds: number;
  overallScore: {
    clarity: number;
    technicalAccuracy: number;
    grammar: number;
    interviewReadiness: number;
  };
  recurringWeaknesses: string[];
  createdAt: string;
}

interface RevisionTopic {
  topicId: string;
  name: string;
  reason: string;
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const { firstName, userEmail } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [recentSession, setRecentSession] = useState<HistoryItem | null>(null);
  const [revisionSuggestions, setRevisionSuggestions] = useState<RevisionTopic[]>([]);

  const displayName = firstName || (userEmail ? userEmail.split('@')[0] : 'Engineer');

  const fetchData = async () => {
    try {
      // 1. Fetch real aggregated progress from MongoDB
      const progressRes = await api.get('/progress');
      if (progressRes.data) {
        setProgress(progressRes.data);
      }

      // 2. Fetch real session history (latest session)
      const historyRes = await api.get('/history');
      if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
        setRecentSession(historyRes.data[0]);
      } else {
        setRecentSession(null);
      }

      // 3. Fetch real revision suggestions
      const revRes = await api.get('/topics/revision');
      if (Array.isArray(revRes.data)) {
        setRevisionSuggestions(revRes.data);
      }
    } catch (err) {
      console.warn('Error loading real dashboard data from database:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every time the user navigates back to Dashboard
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStartPractice = (topicId = 'dsa') => {
    router.push({
      pathname: '/session/setup',
      params: { topicId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Top Header with dynamically loaded firstName */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.greetingText}>Good morning, {displayName}</Text>
              <Text style={styles.dateText}>Ready for voice rehearsal</Text>
            </View>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/topics')}
              style={styles.iconCircleBtn}
              accessibilityRole="button"
              accessibilityLabel="Explore Topics">
              <MaterialIcons name="tune" size={18} color={Colors.light.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.iconCircleBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings">
              <MaterialIcons name="settings" size={18} color={Colors.light.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Voice Practice Card */}
        <View style={styles.heroWrapper}>
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Badge
                label="Daily Interview Prompt"
                variant="primary"
                icon={<View style={styles.pulseDot} />}
              />
              <Text style={styles.heroDuration}>2-minute turns</Text>
            </View>

            <Text style={styles.heroTitle}>Practice technical explanation with AI</Text>
            <View style={styles.topicQueueRow}>
              <MaterialIcons name="record-voice-over" size={16} color={Colors.light.primary} />
              <Text style={styles.topicQueueText} numberOfLines={1}>
                {revisionSuggestions.length > 0 ? (
                  <>
                    Recommended: <Text style={styles.boldTopic}>{revisionSuggestions[0].name}</Text>
                  </>
                ) : (
                  <>
                    Topic: <Text style={styles.boldTopic}>Data Structures & Algorithms</Text>
                  </>
                )}
              </Text>
            </View>

            {/* Static waveform preview */}
            <View style={styles.waveformContainer}>
              <WaveformVisualizer isActive={false} barCount={20} />
            </View>

            {/* Master Action CTA */}
            <Button
              title="Start Voice Practice"
              onPress={() =>
                handleStartPractice(
                  revisionSuggestions.length > 0 ? revisionSuggestions[0].topicId : 'dsa'
                )
              }
              size="lg"
              icon={<MaterialIcons name="mic" size={22} color="#fff" />}
            />
          </Card>
        </View>

        {/* Real Performance Metrics (Retrieved only from MongoDB) */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Clarity</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>
                {progress && progress.totalSessions > 0 ? `${progress.averageClarity} / 5` : '—'}
              </Text>
              {progress && progress.totalSessions > 0 && (
                <Badge label="Real DB" variant="neutral" style={styles.trendBadge} />
              )}
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Spoken Time</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>
                {progress && progress.totalSpokenSeconds > 0
                  ? (progress.totalSpokenSeconds >= 60
                      ? `${Math.floor(progress.totalSpokenSeconds / 60)}m`
                      : `${progress.totalSpokenSeconds}s`)
                  : '0s'}
              </Text>
              <Text style={styles.metricSub}>total</Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sessions</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>{progress ? progress.totalSessions : 0}</Text>
              <Text style={styles.metricSub}>done</Text>
            </View>
          </View>
        </View>

        {/* Real Recently Practised Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Practised</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/history')}
              accessibilityRole="button">
              <Text style={styles.sectionLink}>View All History</Text>
            </TouchableOpacity>
          </View>

          {recentSession ? (
            <Card style={styles.recentCard}>
              <View style={styles.recentTopRow}>
                <View style={styles.recentTextGroup}>
                  <Text style={styles.recentTitle}>
                    {recentSession.topicName || recentSession.topicId.toUpperCase()}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {new Date(recentSession.createdAt).toLocaleDateString()} • {recentSession.durationSeconds >= 60 ? `${Math.floor(recentSession.durationSeconds / 60)}m ${recentSession.durationSeconds % 60}s` : `${recentSession.durationSeconds}s`} duration
                  </Text>
                </View>
                <Badge
                  label={`Clarity: ${recentSession.overallScore?.clarity != null ? Number(recentSession.overallScore.clarity).toFixed(1) : '—'} / 5`}
                  variant={
                    (recentSession.overallScore?.clarity || 0) >= 3.5 ? 'success' : 'caution'
                  }
                />
              </View>

              <View style={styles.recentBottomRow}>
                <View style={styles.revisionNotice}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.light.cautionText} />
                  <Text style={styles.revisionText} numberOfLines={1}>
                    {recentSession.recurringWeaknesses && recentSession.recurringWeaknesses.length > 0
                      ? `Focus: ${recentSession.recurringWeaknesses[0]}`
                      : 'Good overall delivery'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleStartPractice(recentSession.topicId)}
                  style={styles.reviseBtn}
                  accessibilityRole="button">
                  <Text style={styles.reviseBtnText}>Practice Again</Text>
                  <MaterialIcons name="refresh" size={14} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <Card style={styles.emptyRecentCard}>
              <MaterialIcons name="history" size={28} color={Colors.light.textTertiary} />
              <View style={styles.emptyRecentTextGroup}>
                <Text style={styles.emptyRecentTitle}>No sessions completed yet</Text>
                <Text style={styles.emptyRecentSub}>
                  Record your first technical interview answer to view real metrics and weaknesses.
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Suggested Topics for You (Real Revision DB Data) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Topics for Practice</Text>
              <Text style={styles.sectionSubtitle}>Targeted interview questions</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/topics')}>
              <Text style={styles.sectionLink}>View All Topics</Text>
            </TouchableOpacity>
          </View>

          {revisionSuggestions.slice(0, 2).map((item) => (
            <Card key={item.topicId} style={styles.suggestedCard}>
              <View style={styles.suggestedTop}>
                <Badge
                  label={item.reason.includes('Not practiced') ? 'Not practiced yet' : 'Practice again'}
                  variant={item.reason.includes('Not practiced') ? 'primary' : 'caution'}
                />
                <Text style={styles.categoryTag}>{item.topicId.toUpperCase()}</Text>
              </View>
              <Text style={styles.suggestedTitle}>{item.name}</Text>
              <View style={styles.suggestedBottom}>
                <View style={styles.focusRow}>
                  <MaterialIcons name="track-changes" size={14} color={Colors.light.primary} />
                  <Text style={styles.focusText} numberOfLines={1}>
                    {item.reason}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleStartPractice(item.topicId)}
                  style={styles.circleArrowBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${item.name}`}>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.light.onSurface} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>

        {/* Shortcut Banner to Topics */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/topics')}
          activeOpacity={0.88}
          style={styles.bannerContainer}
          accessibilityRole="button">
          <View style={styles.bannerIconBox}>
            <MaterialIcons name="history-edu" size={20} color={Colors.light.primary} />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>Explore All Topics & Custom Practice</Text>
            <Text style={styles.bannerSub}>Pick from 8 technical areas or type your own question</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.light.outline} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  avatarInitial: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.success,
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  greetingText: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  dateText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  heroWrapper: {
    borderRadius: BorderRadius.xl,
  },
  heroCard: {
    padding: 18,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginRight: 6,
  },
  heroDuration: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  heroTitle: {
    ...Typography.sizes.headlineMd,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  topicQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicQueueText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  boldTopic: {
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  waveformContainer: {
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.light.surfaceContainerLowest,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    justifyContent: 'space-between',
    minHeight: 74,
  },
  metricLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricNumber: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  trendBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  metricSub: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  sectionSubtitle: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  sectionLink: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  recentCard: {
    padding: 14,
    gap: 12,
  },
  emptyRecentCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  emptyRecentTextGroup: {
    flex: 1,
  },
  emptyRecentTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  emptyRecentSub: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    marginTop: 2,
    lineHeight: 18,
  },
  recentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recentTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  recentTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  recentMeta: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  recentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.25)',
  },
  revisionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cautionTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs + 2,
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  revisionText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.cautionText,
  },
  reviseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  reviseBtnText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  suggestedCard: {
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  suggestedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  suggestedTitle: {
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
    fontWeight: '600',
    lineHeight: 20,
  },
  suggestedBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.2)',
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  focusText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
  },
  circleArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    gap: 12,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  bannerSub: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
});
