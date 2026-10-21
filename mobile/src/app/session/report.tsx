import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function FinalSessionReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicName?: string;
    questionCount?: string;
    durationText?: string;
  }>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Session Evaluation Report</Text>
            <Text style={styles.headerSubtitle}>
              {params.topicName || 'Technical Concepts'} • {params.questionCount || '3'} Questions
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.doneBtn}>
            <MaterialIcons name="check" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Executive Performance Hero Card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <Badge label="Strong Interview Readiness" variant="success" />
              <Text style={styles.durationTag}>{params.durationText || '4m 30s'}</Text>
            </View>

            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreNumber}>4.4</Text>
                <Text style={styles.scoreScale}>out of 5.0</Text>
              </View>
              <View style={styles.scoreMetaCol}>
                <Text style={styles.scoreMetaHeading}>Solid Technical Articulation</Text>
                <Text style={styles.scoreMetaDesc}>
                  Your explanations demonstrated clear architectural intuition and steady pacing.
                </Text>
              </View>
            </View>
          </Card>

          {/* 4 Evaluation Rubrics */}
          <View style={styles.rubricsGrid}>
            <View style={styles.rubricItem}>
              <Text style={styles.rubricLabel}>Grammar & Formation</Text>
              <Text style={styles.rubricScore}>4.2 <Text style={styles.rubricMax}>/ 5</Text></Text>
            </View>
            <View style={styles.rubricItem}>
              <Text style={styles.rubricLabel}>Clarity & Structure</Text>
              <Text style={styles.rubricScore}>4.0 <Text style={styles.rubricMax}>/ 5</Text></Text>
            </View>
            <View style={styles.rubricItem}>
              <Text style={styles.rubricLabel}>Technical Accuracy</Text>
              <Text style={styles.rubricScore}>4.8 <Text style={styles.rubricMax}>/ 5</Text></Text>
            </View>
            <View style={styles.rubricItem}>
              <Text style={styles.rubricLabel}>Interview Readiness</Text>
              <Text style={styles.rubricScore}>4.5 <Text style={styles.rubricMax}>/ 5</Text></Text>
            </View>
          </View>

          {/* Key Strengths */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Demonstrated Strengths</Text>
            <Card style={styles.strengthsCard}>
              <View style={styles.bulletRow}>
                <MaterialIcons name="check-circle" size={16} color={Colors.light.successText} />
                <Text style={styles.bulletText}>
                  Maintained consistent use of correct technical terms (e.g., collision resolution, load factor).
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialIcons name="check-circle" size={16} color={Colors.light.successText} />
                <Text style={styles.bulletText}>
                  Answered follow-up adaptive questions directly without conversational drift.
                </Text>
              </View>
            </Card>
          </View>

          {/* Targeted Improvement Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Key Focus for Next Practice</Text>
            <Card style={styles.improvementsCard}>
              <View style={styles.bulletRow}>
                <MaterialIcons name="lightbulb" size={16} color={Colors.light.cautionText} />
                <Text style={styles.bulletText}>
                  Replace hesitation pauses ("um", "so basically") with deliberate 1-second silence.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialIcons name="lightbulb" size={16} color={Colors.light.cautionText} />
                <Text style={styles.bulletText}>
                  Mention edge-case degradation scenarios (e.g., primary clustering) earlier in your answer.
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <Button
            title="Return to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            size="lg"
            icon={<MaterialIcons name="home" size={18} color="#fff" />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 196, 215, 0.3)',
    backgroundColor: Colors.light.surface,
  },
  headerTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  headerSubtitle: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: 16,
    paddingBottom: 100,
    gap: 16,
  },
  heroCard: {
    padding: 16,
    gap: 14,
    backgroundColor: '#EEF0FD',
    borderColor: 'rgba(91, 80, 229, 0.25)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationTag: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreNumber: {
    ...Typography.sizes.metric,
    color: Colors.light.primary,
  },
  scoreScale: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    marginTop: -4,
  },
  scoreMetaCol: {
    flex: 1,
    gap: 4,
  },
  scoreMetaHeading: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  scoreMetaDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  rubricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rubricItem: {
    width: '48%',
    backgroundColor: Colors.light.surfaceContainerLowest,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    gap: 4,
  },
  rubricLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    fontSize: 11,
  },
  rubricScore: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  rubricMax: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  strengthsCard: {
    padding: 14,
    gap: 10,
    backgroundColor: Colors.light.successTint,
    borderColor: Colors.light.successBorder,
  },
  improvementsCard: {
    padding: 14,
    gap: 10,
    backgroundColor: Colors.light.cautionTint,
    borderColor: Colors.light.cautionBorder,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.margin,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.3)',
  },
});
