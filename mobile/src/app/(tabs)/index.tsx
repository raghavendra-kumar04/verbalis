import React from 'react';
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
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WaveformVisualizer } from '../../components/ui/WaveformVisualizer';
import { useAuth } from '../../context/AuthContext';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const { userEmail } = useAuth();

  const displayName = userEmail ? userEmail.split('@')[0] : 'Raghavendra';

  const handleStartPractice = (topicId = 'dsa') => {
    router.push({
      pathname: '/session/setup',
      params: { topicId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
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
              <Text style={styles.dateText}>Ready for speech practice</Text>
            </View>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/topics')}
              style={styles.iconCircleBtn}>
              <MaterialIcons name="tune" size={18} color={Colors.light.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.iconCircleBtn}>
              <MaterialIcons name="settings" size={18} color={Colors.light.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prominent Hero Action Card */}
        <View style={styles.heroWrapper}>
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Badge
                label="Daily Prompt"
                variant="primary"
                icon={<View style={styles.pulseDot} />}
              />
              <Text style={styles.heroDuration}>Est. 3-5 mins</Text>
            </View>

            <Text style={styles.heroTitle}>Ready for your daily voice session?</Text>
            <View style={styles.topicQueueRow}>
              <MaterialIcons name="queue-music" size={16} color={Colors.light.primary} />
              <Text style={styles.topicQueueText} numberOfLines={1}>
                Topic: <Text style={styles.boldTopic}>Hash Tables & Collision Resolution</Text>
              </Text>
            </View>

            {/* Waveform preview */}
            <View style={styles.waveformContainer}>
              <WaveformVisualizer isActive={false} barCount={20} />
            </View>

            {/* Master Action CTA */}
            <Button
              title="Start Voice Practice"
              onPress={() => handleStartPractice('dsa')}
              size="lg"
              icon={<MaterialIcons name="mic" size={22} color="#fff" />}
            />
          </Card>
        </View>

        {/* Performance Metric Strip */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Clarity</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>78%</Text>
              <Badge label="+4%" variant="success" style={styles.trendBadge} />
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pace</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>128</Text>
              <Text style={styles.metricSub}>wpm</Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sessions</Text>
            <View style={styles.metricValRow}>
              <Text style={styles.metricNumber}>16</Text>
              <Text style={styles.metricSub}>done</Text>
            </View>
          </View>
        </View>

        {/* Recently Practised Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Practised</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.sectionLink}>History</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.recentCard}>
            <View style={styles.recentTopRow}>
              <View style={styles.recentTextGroup}>
                <Text style={styles.recentTitle}>Database Indexing (B-Trees)</Text>
                <Text style={styles.recentMeta}>Completed yesterday • Systems & Data</Text>
              </View>
              <Badge label="Clarity: 82%" variant="success" />
            </View>

            <View style={styles.recentBottomRow}>
              <View style={styles.revisionNotice}>
                <MaterialIcons name="info-outline" size={14} color={Colors.light.cautionText} />
                <Text style={styles.revisionText}>1 revision focus: Filler words</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleStartPractice('databases')}
                style={styles.reviseBtn}>
                <Text style={styles.reviseBtnText}>Revise Topic</Text>
                <MaterialIcons name="refresh" size={14} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Suggested Topics for You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Suggested Topics for You</Text>
              <Text style={styles.sectionSubtitle}>DSA & System Interview Focus</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/topics')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Suggested Topic 1 */}
          <Card style={styles.suggestedCard}>
            <View style={styles.suggestedTop}>
              <Badge label="Intermediate" variant="neutral" />
              <Text style={styles.categoryTag}>Protocols & Systems</Text>
            </View>
            <Text style={styles.suggestedTitle}>
              Explain TCP 3-Way Handshake vs UDP to a Junior Engineer
            </Text>
            <View style={styles.suggestedBottom}>
              <View style={styles.focusRow}>
                <MaterialIcons name="track-changes" size={14} color={Colors.light.primary} />
                <Text style={styles.focusText}>Focus: Technical Accuracy</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleStartPractice('networks')}
                style={styles.circleArrowBtn}>
                <MaterialIcons name="arrow-forward" size={16} color={Colors.light.onSurface} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Suggested Topic 2 */}
          <Card style={styles.suggestedCard}>
            <View style={styles.suggestedTop}>
              <Badge label="Behavioral HR" variant="caution" />
              <Text style={styles.categoryTag}>Leadership</Text>
            </View>
            <Text style={styles.suggestedTitle}>
              Tell me about a challenging technical conflict you resolved
            </Text>
            <View style={styles.suggestedBottom}>
              <View style={styles.focusRow}>
                <MaterialIcons name="record-voice-over" size={14} color={Colors.light.primary} />
                <Text style={styles.focusText}>Focus: Structure & Delivery</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleStartPractice('hr')}
                style={styles.circleArrowBtn}>
                <MaterialIcons name="arrow-forward" size={16} color={Colors.light.onSurface} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Shortcut Banner to Topics */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/topics')}
          activeOpacity={0.88}
          style={styles.bannerContainer}>
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
    width: 42,
    height: 42,
    borderRadius: 21,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 5,
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
  },
  revisionText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.cautionText,
  },
  reviseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  focusText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
  },
  circleArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 36,
    height: 36,
    borderRadius: 10,
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
