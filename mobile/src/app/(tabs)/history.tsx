import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  };
  keyStrengths: string[];
  recurringWeaknesses: string[];
  createdAt: string;
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

  useEffect(() => {
    fetchHistoryAndProgress();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryAndProgress();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              Weakness Trends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aggregate Stats Bar */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Database Rehearsal Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>
                {progress && progress.totalSessions > 0 ? `${progress.averageClarity}%` : '—'}
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
                  ? `${Math.round(progress.totalSpokenSeconds / 60)}m`
                  : '0m'}
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
                        {new Date(session.createdAt).toLocaleDateString()} • {session.durationSeconds}s
                      </Text>
                    </View>

                    <Text style={styles.sessionTopic}>
                      {session.topicName || session.topicId.toUpperCase()}
                    </Text>

                    {/* Score Pills Row */}
                    <View style={styles.scoresRow}>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Clarity</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.clarity || 0}%
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Technical</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.technicalAccuracy || 0}%
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillLabel}>Readiness</Text>
                        <Text style={styles.scorePillVal}>
                          {session.overallScore?.interviewReadiness || 0}%
                        </Text>
                      </View>
                    </View>

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
          /* Progress & Weakness Trends */
          <View style={styles.section}>
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
  scoresRow: {
    flexDirection: 'row',
    gap: 8,
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
