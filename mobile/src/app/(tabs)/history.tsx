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
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

interface SessionSummaryItem {
  sessionId: string;
  topicId: string;
  topicName?: string;
  durationSeconds: number;
  overallScore: {
    clarity: number;
    technicalAccuracy: number;
    grammar: number;
    interviewReadiness: number;
    average?: number;
  };
  keyStrengths: string[];
  recurringWeaknesses: string[];
  headline?: string;
  createdAt: string;
}

interface DailyActivity {
  day: string;
  date: string;
  spokenMinutes: number;
  spokenSeconds: number;
  sessionCount: number;
  averageScore: number;
}

interface WeeklyReport {
  thisWeekSessions: number;
  thisWeekSpokenSeconds: number;
  thisWeekAverageScore: number;
  weeklyGoalMinutes: number;
  weeklyGoalPercent: number;
  streakDays: number;
  dailyActivity: DailyActivity[];
}

interface ProgressData {
  totalSessions: number;
  averageClarity: number;
  averageTechnical: number;
  averageGrammar: number;
  averageReadiness: number;
  totalSpokenSeconds: number;
  topRecurringWeaknesses: Array<{ weakness: string; frequency: number }>;
  completedTopicIds: string[];
  weeklyReport?: WeeklyReport;
}

export default function HistoryProgressScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'history' | 'progress'>('history');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<SessionSummaryItem[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const fetchHistoryAndProgress = async () => {
    try {
      const [histRes, progRes] = await Promise.all([
        api.get('/history'),
        api.get('/progress'),
      ]);

      if (Array.isArray(histRes.data)) {
        setSessions(histRes.data);
      } else {
        setSessions([]);
      }

      if (progRes.data) {
        setProgress(progRes.data);
      }
    } catch (err) {
      console.warn('Error fetching history/progress from database:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch whenever screen comes into focus so recent sessions immediately appear
  useFocusEffect(
    useCallback(() => {
      fetchHistoryAndProgress();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryAndProgress();
  };

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const weekly = progress?.weeklyReport;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History & Progress</Text>
          <Text style={styles.subtitle}>
            Speech clarity, verbal confidence, and interview readiness over time
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
            accessibilityRole="button"
            accessibilityLabel="Session History Tab">
            <MaterialIcons
              name="history"
              size={18}
              color={activeTab === 'history' ? Colors.light.primary : Colors.light.textTertiary}
            />
            <Text
              style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Session History ({sessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'progress' && styles.tabBtnActive]}
            onPress={() => setActiveTab('progress')}
            accessibilityRole="button"
            accessibilityLabel="Progress Metrics Tab">
            <MaterialIcons
              name="insights"
              size={18}
              color={activeTab === 'progress' ? Colors.light.primary : Colors.light.textTertiary}
            />
            <Text
              style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Weekly & Trends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aggregate Stats Bar */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Database Rehearsal Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>
                {progress && progress.totalSessions > 0 ? `${progress.averageClarity} / 5` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Avg Clarity</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>{progress ? progress.totalSessions : 0}</Text>
              <Text style={styles.summaryLabel}>Total Sessions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>
                {progress && progress.totalSpokenSeconds > 0
                  ? formatDuration(progress.totalSpokenSeconds)
                  : '0s'}
              </Text>
              <Text style={styles.summaryLabel}>Spoken Audio</Text>
            </View>
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Retrieving records from database...</Text>
          </View>
        ) : activeTab === 'history' ? (
          /* Past Sessions List */
          <View style={styles.section}>
            {sessions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialIcons name="mic-none" size={32} color={Colors.light.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Rehearsals Recorded Yet</Text>
                <Text style={styles.emptyDesc}>
                  Your evaluation history is stored in your personal MongoDB database with zero audio
                  persistence. Start a rehearsal session to establish your speech baseline!
                </Text>
                <Button
                  title="Start First Practice Session"
                  onPress={() => router.push('/(tabs)/topics')}
                  size="md"
                  style={{ marginTop: 8 }}
                />
              </Card>
            ) : (
              <View style={styles.sessionsList}>
                {sessions.map((session) => (
                  <Card key={session.sessionId} style={styles.sessionCard}>
                    <View style={styles.sessionHeaderRow}>
                      <Badge label={session.topicId.toUpperCase()} variant="neutral" />
                      <Text style={styles.sessionDate}>
                        {new Date(session.createdAt).toLocaleDateString()} • {formatDuration(session.durationSeconds)}
                      </Text>
                    </View>

                    <Text style={styles.sessionTopic}>
                      {session.topicName || session.topicId.toUpperCase()}
                    </Text>

                    {session.headline && (
                      <Text style={styles.sessionHeadline}>{session.headline}</Text>
                    )}

                    {/* Horizontally scrollable Score Pills Row */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.scoresScrollContent}>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Clarity</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.clarity != null ? Number(session.overallScore.clarity).toFixed(1) : '—'} / 5
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Technical</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.technicalAccuracy != null ? Number(session.overallScore.technicalAccuracy).toFixed(1) : '—'} / 5
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Readiness</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.interviewReadiness != null ? Number(session.overallScore.interviewReadiness).toFixed(1) : '—'} / 5
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Grammar</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.grammar != null ? Number(session.overallScore.grammar).toFixed(1) : '—'} / 5
                        </Text>
                      </View>
                    </ScrollView>

                    {/* Key takeaway */}
                    {session.recurringWeaknesses && session.recurringWeaknesses.length > 0 && (
                      <View style={styles.takeawayBox}>
                        <Text style={styles.takeawayText}>
                          ⚠️ Focus: {session.recurringWeaknesses[0]}
                        </Text>
                      </View>
                    )}

                    {/* Practice Again CTA */}
                    <View style={styles.sessionFooter}>
                      <Text style={styles.turnInfo}>Real AI Evaluation</Text>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/session/setup',
                            params: { topicId: session.topicId },
                          })
                        }
                        style={styles.retryBtn}
                        accessibilityRole="button">
                        <Text style={styles.retryBtnText}>Practice Again</Text>
                        <MaterialIcons name="arrow-forward" size={14} color={Colors.light.primary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Progress, Weekly Report & Weakness Trends */
          <View style={styles.section}>
            {/* Dynamic Weekly Performance Report Card */}
            <Card style={styles.weeklyCard}>
              <View style={styles.weeklyHeader}>
                <View>
                  <Text style={styles.weeklyTitle}>Weekly Performance Report</Text>
                  <Text style={styles.weeklySub}>Past 7 days activity & consistency</Text>
                </View>
                <Badge
                  label={weekly?.streakDays && weekly.streakDays > 0 ? `🔥 ${weekly.streakDays}d Streak` : 'Start Streak'}
                  variant={weekly?.streakDays && weekly.streakDays > 0 ? 'success' : 'neutral'}
                />
              </View>

              {/* Weekly Highlights Row */}
              <View style={styles.weeklyMetricsRow}>
                <View style={styles.weeklyMetricCol}>
                  <Text style={styles.weeklyMetricVal}>
                    {weekly ? formatDuration(weekly.thisWeekSpokenSeconds) : '0s'}
                  </Text>
                  <Text style={styles.weeklyMetricLabel}>Spoken This Week</Text>
                </View>
                <View style={styles.weeklyMetricDivider} />
                <View style={styles.weeklyMetricCol}>
                  <Text style={styles.weeklyMetricVal}>
                    {weekly?.thisWeekSessions || 0}
                  </Text>
                  <Text style={styles.weeklyMetricLabel}>Sessions</Text>
                </View>
                <View style={styles.weeklyMetricDivider} />
                <View style={styles.weeklyMetricCol}>
                  <Text style={styles.weeklyMetricVal}>
                    {weekly && weekly.thisWeekAverageScore > 0 ? `${weekly.thisWeekAverageScore} / 5` : '—'}
                  </Text>
                  <Text style={styles.weeklyMetricLabel}>Avg Rating</Text>
                </View>
              </View>

              {/* Weekly Goal Progress Bar */}
              <View style={styles.goalContainer}>
                <View style={styles.goalTextRow}>
                  <Text style={styles.goalLabel}>
                    Weekly Goal: {weekly?.weeklyGoalMinutes || 30} mins
                  </Text>
                  <Text style={styles.goalPercent}>
                    {weekly?.weeklyGoalPercent || 0}% Complete
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.max(0, weekly?.weeklyGoalPercent || 0))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* 7-Day Activity Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>7-Day Rehearsal Activity</Text>
                <View style={styles.chartDaysRow}>
                  {weekly?.dailyActivity?.map((d) => {
                    const isToday = d.date === todayStr;
                    const hasActivity = d.spokenSeconds > 0;
                    return (
                      <View key={d.date} style={styles.dayCol}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: hasActivity
                                  ? `${Math.min(100, Math.max(25, d.spokenMinutes * 20))}%`
                                  : '0%',
                                backgroundColor: isToday ? Colors.light.primary : '#8F90A6',
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                          {d.day}
                        </Text>
                        <Text style={styles.dayMinutes}>
                          {hasActivity ? `${d.spokenMinutes}m` : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recurring Weaknesses</Text>
              <Text style={styles.sectionSub}>Aggregated across all past sessions in MongoDB</Text>
            </View>

            {progress && progress.topRecurringWeaknesses && progress.topRecurringWeaknesses.length > 0 ? (
              <Card style={styles.weaknessCard}>
                {progress.topRecurringWeaknesses.map((item, index) => (
                  <React.Fragment key={item.weakness}>
                    {index > 0 && <View style={styles.weaknessDivider} />}
                    <View style={styles.weaknessItem}>
                      <View style={styles.weaknessIconBox}>
                        <MaterialIcons
                          name="warning-amber"
                          size={18}
                          color={Colors.light.cautionText}
                        />
                      </View>
                      <View style={styles.weaknessContent}>
                        <Text style={styles.weaknessTitle}>{item.weakness}</Text>
                        <Text style={styles.weaknessDesc}>
                          Observed across {item.frequency} evaluation{item.frequency > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Badge label={`${item.frequency}x`} variant="caution" />
                    </View>
                  </React.Fragment>
                ))}
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <MaterialIcons name="check-circle" size={36} color={Colors.light.success} />
                <Text style={styles.emptyTitle}>No Weakness Patterns Yet</Text>
                <Text style={styles.emptyDesc}>
                  As you complete voice turns, the AI coach will automatically identify recurring
                  patterns such as filler words, lack of concrete examples, or fast cadence.
                </Text>
              </Card>
            )}

            {/* Topic Coverage */}
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
              <Text style={styles.sectionTitle}>Topic Coverage Overview</Text>
              <Text style={styles.sectionSub}>
                {progress?.completedTopicIds?.length || 0} technical topics practiced
              </Text>
            </View>

            <Card style={styles.coverageCard}>
              <View style={styles.coverageRow}>
                <MaterialIcons name="assignment-turned-in" size={20} color={Colors.light.primary} />
                <Text style={styles.coverageText}>
                  {progress && progress.completedTopicIds && progress.completedTopicIds.length > 0
                    ? `Practiced Topics: ${progress.completedTopicIds.join(', ').toUpperCase()}`
                    : 'No technical domains practiced yet.'}
                </Text>
              </View>
              <Button
                title="Browse All 8 Topics"
                onPress={() => router.push('/(tabs)/topics')}
                variant="outline"
                size="sm"
                style={{ marginTop: 8 }}
              />
            </Card>
          </View>
        )}
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
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    ...Typography.sizes.headlineLg,
    color: Colors.light.onSurface,
  },
  subtitle: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: BorderRadius.sm,
    minHeight: 44,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.sizes.labelMd,
    color: Colors.light.textTertiary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    gap: 12,
    backgroundColor: '#EEF0FD',
    borderColor: 'rgba(91, 80, 229, 0.25)',
  },
  summaryTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    ...Typography.sizes.headlineLg,
    color: Colors.light.onSurface,
  },
  summaryLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(91, 80, 229, 0.2)',
  },
  weeklyCard: {
    padding: 16,
    gap: 16,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderColor: 'rgba(91, 80, 229, 0.2)',
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weeklyTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  weeklySub: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  weeklyMetricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyMetricVal: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.primary,
  },
  weeklyMetricLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  weeklyMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(200, 196, 215, 0.3)',
  },
  goalContainer: {
    gap: 6,
  },
  goalTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  goalPercent: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  chartContainer: {
    gap: 10,
  },
  chartTitle: {
    ...Typography.sizes.labelMd,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  chartDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 8,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: 12,
    flex: 1,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 10,
  },
  dayLabelToday: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  dayMinutes: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 9,
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  sectionSub: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    backgroundColor: Colors.light.surfaceContainerLowest,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  weaknessCard: {
    padding: 14,
    gap: 12,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  weaknessIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.cautionTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  weaknessContent: {
    flex: 1,
  },
  weaknessTitle: {
    ...Typography.sizes.labelMd,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  weaknessDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  weaknessDivider: {
    height: 1,
    backgroundColor: 'rgba(200, 196, 215, 0.25)',
  },
  coverageCard: {
    padding: 16,
    gap: 10,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverageText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.onSurface,
    flex: 1,
    lineHeight: 20,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    padding: 16,
    gap: 10,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  sessionTopic: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  sessionHeadline: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoresScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  scorePill: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs + 2,
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  scorePillLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 11,
  },
  scorePillVal: {
    ...Typography.sizes.labelSm,
    color: Colors.light.onSurface,
    fontWeight: '700',
    fontSize: 12,
  },
  takeawayBox: {
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.2)',
  },
  takeawayText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.2)',
  },
  turnInfo: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  retryBtnText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
