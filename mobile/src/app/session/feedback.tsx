import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

export default function PerAnswerFeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    questionNumber?: string;
    questionText?: string;
    topicName?: string;
    feedbackData?: string;
    nextQuestion?: string;
    sessionId?: string;
    sessionTimeRemaining?: string;
    mode?: string;
  }>();

  const questionNum = Number(params.questionNumber || '1');
  const feedback = params.feedbackData
    ? JSON.parse(params.feedbackData)
    : null;

  // Guard: if no feedback data was passed, go straight to next question
  // (this can happen when feedbackMode is 'end_of_session' or on error)
  React.useEffect(() => {
    if (!feedback) {
      handleNextQuestion();
    }
  }, []);

  const handleHearFeedback = () => {
    if (!feedback) return;
    Speech.stop();
    const spokenSummary = `Here is your feedback. What went well: ${feedback.strengths?.[0] || ''}. An area to refine: ${feedback.improvements?.[0] || ''}. Quick tip: ${feedback.quickCoachTip || ''}`;
    Speech.speak(spokenSummary, { rate: 1.0, language: 'en-US' });
  };

  const handleNextQuestion = () => {
    Speech.stop();
    router.replace({
      pathname: '/session/room',
      params: {
        sessionId: params.sessionId,
        topicName: params.topicName,
        currentQuestion: params.nextQuestion,
        questionNumber: String(questionNum + 1),
        sessionTimeRemaining: params.sessionTimeRemaining,
        feedbackMode: params.mode || 'per_answer',
      },
    });
  };

  const handleFinishEarly = async () => {
    Speech.stop();
    let summaryData = '';
    if (params.sessionId) {
      try {
        const res = await api.post(`/sessions/${params.sessionId}/finish`);
        if (res.data?.summary) {
          summaryData = JSON.stringify(res.data.summary);
        }
      } catch (err) {
        console.warn('Feedback finish early notice:', err);
      }
    }

    router.replace({
      pathname: '/session/report',
      params: {
        sessionId: params.sessionId,
        topicName: params.topicName || 'Technical Concepts',
        questionCount: String(questionNum),
        durationText: 'Session Concluded',
        summaryData,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Sticky Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>Answer Feedback • Question {questionNum}</Text>
          </View>
          <TouchableOpacity onPress={handleFinishEarly} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Context Strip */}
        <View style={styles.contextStrip}>
          <View style={styles.contextCard}>
            <View style={styles.topicIconRow}>
              <View style={styles.categoryIconBox}>
                <MaterialIcons name="category" size={15} color={Colors.light.primary} />
              </View>
              <Text style={styles.contextText} numberOfLines={1}>
                Topic: <Text style={styles.contextTopicBold}>{params.topicName || 'Hash Tables'}</Text>
              </Text>
            </View>
            <Badge label="Evaluation Mode" variant="primary" />
          </View>
        </View>

        {/* Feedback Sections Grid */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 130 + Math.max(insets.bottom, 16) },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Section 1: What Went Well */}
          <View style={styles.successSection}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.checkIconBox}>
                <MaterialIcons name="check" size={16} color={Colors.light.successText} />
              </View>
              <Text style={styles.successHeading}>What Went Well</Text>
            </View>
            <Text style={styles.successBody}>
              {feedback?.strengths?.[0] || 'Keep going — explain clearly and you will improve each time.'}
            </Text>
          </View>

          {/* Section 2: Areas to Refine */}
          <View style={styles.cautionSection}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.errorIconBox}>
                <MaterialIcons name="error-outline" size={16} color={Colors.light.cautionText} />
              </View>
              <Text style={styles.cautionHeading}>Areas to Refine</Text>
            </View>
            <Text style={styles.cautionBody}>
              {feedback?.improvements?.[0] || 'Try to structure your answer: definition → example → trade-offs.'}
            </Text>
          </View>

          {/* Section 3: Phrasing & Grammar Upgrade */}
          {feedback?.improvedAnswerVersion ? (
            <Card style={styles.upgradeCard}>
              <View style={styles.upgradeHeader}>
                <View style={styles.sectionHeadingRow}>
                  <MaterialIcons name="auto-awesome" size={18} color={Colors.light.primary} />
                  <Text style={styles.upgradeHeading}>Phrasing & Grammar Upgrade</Text>
                </View>
                <Badge label="AI Upgrade" variant="neutral" />
              </View>

              <View style={styles.comparisonBox}>
                <View style={styles.strongerBox}>
                  <View style={styles.strongerHeader}>
                    <MaterialIcons name="trending-up" size={14} color={Colors.light.primary} />
                    <Text style={styles.strongerLabel}>Stronger version:</Text>
                  </View>
                  <Text style={styles.strongerText}>
                    {`"${feedback.improvedAnswerVersion}"`}
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {/* Section 4: Technical Accuracy Observation */}
          {feedback?.technicalAccuracyNote ? (
            <Card style={styles.accuracyCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.codeIconBox}>
                  <MaterialIcons name="code" size={16} color={Colors.light.secondary} />
                </View>
                <Text style={styles.accuracyHeading}>Technical Accuracy Observation</Text>
              </View>
              <Text style={styles.accuracyBody}>
                {feedback.technicalAccuracyNote}
              </Text>
            </Card>
          ) : null}

          {/* Section 5: Quick Spoken Coach Tip */}
          {feedback?.quickCoachTip ? (
            <View style={styles.tipBox}>
              <Text style={styles.tipEmoji}>💡</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeading}>Quick Spoken Coach Tip</Text>
                <Text style={styles.tipBody}>
                  {feedback.quickCoachTip}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom Docked Floating Action Area */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {feedback && (
            <TouchableOpacity
              onPress={handleHearFeedback}
              style={styles.listenBtn}>
              <MaterialIcons name="graphic-eq" size={20} color={Colors.light.primary} />
              <Text style={styles.listenBtnText}>Hear AI Coaching (Voice summary)</Text>
            </TouchableOpacity>
          )}

          <Button
            title={`Continue to Question ${questionNum + 1}`}
            onPress={handleNextQuestion}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primaryContainer,
  },
  headerTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextStrip: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: 8,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  topicIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.light.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  contextTopicBold: {
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: 10,
    paddingBottom: 140,
    gap: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successSection: {
    backgroundColor: Colors.light.successTint,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.7)',
    gap: 8,
  },
  checkIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.successText,
  },
  successBody: {
    ...Typography.sizes.bodySm,
    color: 'rgba(6, 95, 70, 0.9)',
    paddingLeft: 32,
    lineHeight: 20,
  },
  cautionSection: {
    backgroundColor: Colors.light.cautionTint,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.7)',
    gap: 8,
  },
  errorIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cautionHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.cautionText,
  },
  cautionBody: {
    ...Typography.sizes.bodySm,
    color: 'rgba(146, 64, 14, 0.95)',
    paddingLeft: 32,
    lineHeight: 20,
  },
  upgradeCard: {
    padding: 14,
    gap: 10,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  comparisonBox: {
    gap: 8,
    paddingTop: 4,
  },
  insteadBox: {
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
    gap: 4,
  },
  insteadLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  insteadText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  strongerBox: {
    backgroundColor: '#EEF0FD',
    padding: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(91, 80, 229, 0.25)',
    gap: 4,
  },
  strongerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strongerLabel: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  strongerText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.onSurface,
    fontWeight: '500',
    lineHeight: 20,
  },
  accuracyCard: {
    padding: 14,
    gap: 8,
  },
  codeIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  accuracyBody: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    paddingLeft: 32,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
    gap: 10,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 18,
  },
  tipContent: {
    flex: 1,
    gap: 2,
  },
  tipHeading: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  tipBody: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.margin,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 196, 215, 0.3)',
    gap: 8,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
    gap: 8,
  },
  listenBtnText: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
  },
});
