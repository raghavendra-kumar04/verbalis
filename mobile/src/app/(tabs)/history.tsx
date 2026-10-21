import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function HistoryProgressScreen() {
  const router = useRouter();

  const [pastSessions] = useState([
    {
      id: 'sess-1',
      topic: 'Hash Tables Collision Resolution',
      category: 'Data Structures',
      date: 'Today, 2:40 PM',
      duration: '4m 12s',
      turnCount: 3,
      clarityScore: 4.2,
      technicalScore: 4.5,
      grammarScore: 4.0,
      readinessScore: 4.3,
      strengths: ['Clear explanation of chaining', 'Confident pacing'],
      weaknesses: ['Hesitation on quadratic probing'],
    },
    {
      id: 'sess-2',
      topic: 'Database Indexing (B-Trees)',
      category: 'Databases & Storage',
      date: 'Yesterday, 6:15 PM',
      duration: '6m 05s',
      turnCount: 4,
      clarityScore: 3.8,
      technicalScore: 4.6,
      grammarScore: 3.9,
      readinessScore: 4.0,
      strengths: ['Accurate logarithmic tree complexity'],
      weaknesses: ['Filler words (um, basically)'],
    },
    {
      id: 'sess-3',
      topic: 'TCP 3-Way Handshake vs UDP',
      category: 'Computer Networks',
      date: 'Oct 19, 11:20 AM',
      duration: '5m 30s',
      turnCount: 3,
      clarityScore: 4.5,
      technicalScore: 4.8,
      grammarScore: 4.4,
      readinessScore: 4.7,
      strengths: ['Precise SYN/ACK sequence articulation'],
      weaknesses: ['Slightly fast cadence in opening'],
    },
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress & History</Text>
          <Text style={styles.subtitle}>
            Speech clarity, verbal confidence, and interview readiness over time
          </Text>
        </View>

        {/* Aggregate Stats Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Rehearsal Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>4.2</Text>
              <Text style={styles.summaryLabel}>Avg Clarity (out of 5)</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>11</Text>
              <Text style={styles.summaryLabel}>Total Sessions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryNum}>38m</Text>
              <Text style={styles.summaryLabel}>Spoken Audio</Text>
            </View>
          </View>
        </Card>

        {/* Recurring Weaknesses Focus Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Areas to Refine</Text>
            <Text style={styles.sectionSub}>Aggregated from your sessions</Text>
          </View>

          <Card style={styles.weaknessCard}>
            <View style={styles.weaknessItem}>
              <View style={styles.weaknessIconBox}>
                <MaterialIcons name="record-voice-over" size={16} color={Colors.light.cautionText} />
              </View>
              <View style={styles.weaknessContent}>
                <Text style={styles.weaknessTitle}>Filler words during transitions</Text>
                <Text style={styles.weaknessDesc}>
                  Detected "like", "basically", and "um" when moving between technical trade-offs.
                </Text>
              </View>
              <Badge label="3x" variant="caution" />
            </View>

            <View style={styles.weaknessDivider} />

            <View style={styles.weaknessItem}>
              <View style={styles.weaknessIconBox}>
                <MaterialIcons name="speed" size={16} color={Colors.light.primary} />
              </View>
              <View style={styles.weaknessContent}>
                <Text style={styles.weaknessTitle}>Opening pacing rate</Text>
                <Text style={styles.weaknessDesc}>
                  First 15 seconds often exceed 155 WPM before settling into optimal cadence.
                </Text>
              </View>
              <Badge label="2x" variant="neutral" />
            </View>
          </Card>
        </View>

        {/* Past Sessions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          <View style={styles.sessionsList}>
            {pastSessions.map((session) => (
              <Card key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeaderRow}>
                  <Badge label={session.category} variant="neutral" />
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>

                <Text style={styles.sessionTopic}>{session.topic}</Text>

                {/* Score Pills Row */}
                <View style={styles.scoresRow}>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>Clarity</Text>
                    <Text style={styles.scorePillVal}>{session.clarityScore}</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>Technical</Text>
                    <Text style={styles.scorePillVal}>{session.technicalScore}</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>Readiness</Text>
                    <Text style={styles.scorePillVal}>{session.readinessScore}</Text>
                  </View>
                </View>

                {/* Key takeaway */}
                <View style={styles.takeawayBox}>
                  <Text style={styles.takeawayText}>
                    💡 {session.weaknesses[0] || 'Clean verbal delivery'}
                  </Text>
                </View>

                {/* Practice Again CTA */}
                <View style={styles.sessionFooter}>
                  <Text style={styles.turnInfo}>{session.turnCount} questions answered</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/topics')}
                    style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Practice Again</Text>
                    <MaterialIcons name="arrow-forward" size={14} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        </View>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
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
    lineHeight: 18,
  },
  weaknessDivider: {
    height: 1,
    backgroundColor: 'rgba(200, 196, 215, 0.25)',
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
  },
  retryBtnText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
