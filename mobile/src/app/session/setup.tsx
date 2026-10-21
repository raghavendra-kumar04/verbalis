import React, { useState } from 'react';
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
import { INITIAL_TOPICS } from '../../constants/topics';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function SessionSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topicId?: string; customPrompt?: string }>();

  const selectedTopic =
    INITIAL_TOPICS.find((t) => t.id === params.topicId) || INITIAL_TOPICS[0];

  const [feedbackMode, setFeedbackMode] = useState<'per_answer' | 'end_of_session'>('per_answer');
  const [speechSpeed, setSpeechSpeed] = useState<'0.9x' | '1.0x' | '1.1x'>('1.0x');

  // 7 Coaching Focus options confirmed by user
  const focusOptions = [
    'Grammar & Sentence Formation',
    'Technical Accuracy',
    'Reducing Filler Words',
    'Delivery & Pacing',
    'Answer Structure & Conciseness',
    'Interview Readiness',
    'Technical Vocabulary',
  ];

  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([
    'Grammar & Sentence Formation',
    'Technical Accuracy',
    'Reducing Filler Words',
  ]);

  const toggleFocus = (item: string) => {
    if (selectedFocuses.includes(item)) {
      if (selectedFocuses.length > 1) {
        setSelectedFocuses(selectedFocuses.filter((f) => f !== item));
      }
    } else {
      setSelectedFocuses([...selectedFocuses, item]);
    }
  };

  const handleStartSession = () => {
    router.push({
      pathname: '/session/room',
      params: {
        topicId: selectedTopic.id,
        customPrompt: params.customPrompt || '',
        feedbackMode,
        speechSpeed,
        coachingFocus: selectedFocuses.join(','),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={20} color={Colors.light.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Session Setup</Text>
            <Text style={styles.headerSubtitle}>Ready to configure</Text>
          </View>
          <View style={styles.stepBadge}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Step 2 of 2</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Active Topic Summary Card */}
          <Card style={styles.topicSummaryCard}>
            <View style={styles.topicHeaderRow}>
              <Badge
                label={selectedTopic.category}
                variant="primary"
                icon={<MaterialIcons name="terminal" size={12} color={Colors.light.primary} />}
              />
              <Text style={styles.verifiedTag}>
                <MaterialIcons name="verified" size={13} color={Colors.light.primary} /> Verified
              </Text>
            </View>

            <Text style={styles.topicTitle}>
              {params.customPrompt ? `Custom: ${params.customPrompt}` : selectedTopic.name}
            </Text>

            <View style={styles.topicMetaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="tune" size={14} color={Colors.light.textTertiary} />
                <Text style={styles.metaText}>{selectedTopic.difficulty}</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <MaterialIcons name="timer" size={14} color={Colors.light.textTertiary} />
                <Text style={styles.metaText}>2 min max / turn</Text>
              </View>
            </View>
          </Card>

          {/* Configuration 1: Feedback Timing */}
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>Feedback Timing</Text>
              <Badge label="Required" variant="neutral" />
            </View>

            {/* Option A: After Every Answer */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setFeedbackMode('per_answer')}
              style={[
                styles.modeOption,
                feedbackMode === 'per_answer' && styles.modeOptionSelected,
              ]}>
              <View style={styles.modeOptionContent}>
                <View style={styles.modeOptionTitleRow}>
                  <Text style={styles.modeTitle}>After Every Answer</Text>
                  <Badge label="Recommended" variant="primary" />
                </View>
                <Text style={styles.modeDesc}>
                  Immediate coaching, phrasing improvements, and grammar suggestions before the next question.
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  feedbackMode === 'per_answer' && styles.radioOuterSelected,
                ]}>
                {feedbackMode === 'per_answer' && (
                  <MaterialIcons name="check" size={14} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>

            {/* Option B: At End of Session */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setFeedbackMode('end_of_session')}
              style={[
                styles.modeOption,
                feedbackMode === 'end_of_session' && styles.modeOptionSelected,
              ]}>
              <View style={styles.modeOptionContent}>
                <Text style={styles.modeTitle}>At End of Session</Text>
                <Text style={styles.modeDesc}>
                  Simulates a continuous realistic interview. Consolidated evaluation report when you choose to finish.
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  feedbackMode === 'end_of_session' && styles.radioOuterSelected,
                ]}>
                {feedbackMode === 'end_of_session' && (
                  <MaterialIcons name="check" size={14} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Configuration 2: Coaching Focus */}
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionHeading}>Coaching Focus</Text>
                <Text style={styles.sectionSub}>Select AI evaluation parameters</Text>
              </View>
              <Text style={styles.selectedCountText}>{selectedFocuses.length} selected</Text>
            </View>

            <View style={styles.chipGrid}>
              {focusOptions.map((focus) => {
                const isSelected = selectedFocuses.includes(focus);
                return (
                  <TouchableOpacity
                    key={focus}
                    activeOpacity={0.8}
                    onPress={() => toggleFocus(focus)}
                    style={[styles.focusChip, isSelected && styles.focusChipSelected]}>
                    <MaterialIcons
                      name={isSelected ? 'check' : 'add'}
                      size={14}
                      color={isSelected ? '#ffffff' : Colors.light.textTertiary}
                    />
                    <Text style={[styles.focusChipText, isSelected && styles.focusChipTextSelected]}>
                      {focus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Configuration 3: AI Speech Speed */}
          <View style={styles.configSection}>
            <Text style={styles.sectionHeading}>Pacing & Speed (Question Audio)</Text>
            <View style={styles.speedGrid}>
              {(['0.9x', '1.0x', '1.1x'] as const).map((spd) => (
                <TouchableOpacity
                  key={spd}
                  activeOpacity={0.8}
                  onPress={() => setSpeechSpeed(spd)}
                  style={[styles.speedCol, speechSpeed === spd && styles.speedColActive]}>
                  <Text style={[styles.speedVal, speechSpeed === spd && styles.speedValActive]}>
                    {spd} {spd === '1.0x' ? '(Normal)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Explanatory Tip Box */}
          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              {feedbackMode === 'per_answer'
                ? 'In this mode, the AI evaluates your speech clarity immediately after each spoken answer.'
                : 'In this mode, you answer follow-up questions continuously without interruption, receiving feedback at the end.'}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Pinned CTA */}
        <View style={styles.bottomBar}>
          <Button
            title="Start Practice Session"
            onPress={handleStartSession}
            size="lg"
            icon={<MaterialIcons name="arrow-forward" size={18} color="#fff" />}
            iconPosition="right"
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  headerTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  headerSubtitle: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primaryContainer,
  },
  stepText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.onSurfaceVariant,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 20,
  },
  topicSummaryCard: {
    padding: 16,
    gap: 10,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedTag: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  topicTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  metaDot: {
    color: Colors.light.outline,
  },
  configSection: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  sectionSub: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  selectedCountText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    gap: 12,
  },
  modeOptionSelected: {
    borderColor: Colors.light.primaryContainer,
    borderWidth: 2,
    backgroundColor: 'rgba(91, 80, 229, 0.04)',
  },
  modeOptionContent: {
    flex: 1,
    gap: 4,
  },
  modeOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  modeDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(200, 196, 215, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    backgroundColor: Colors.light.primaryContainer,
    borderColor: Colors.light.primaryContainer,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
    gap: 6,
  },
  focusChipSelected: {
    backgroundColor: Colors.light.primaryContainer,
    borderColor: Colors.light.primaryContainer,
  },
  focusChipText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
  },
  focusChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  speedGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  speedCol: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  speedColActive: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  speedVal: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  speedValActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 16,
  },
  tipText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
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
