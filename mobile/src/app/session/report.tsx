import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

interface SessionSummaryData {
  overallScore?: {
    grammar: number;
    clarity: number;
    technicalAccuracy: number;
    interviewReadiness: number;
    average?: number;
  };
  headline?: string;
  executiveSummary?: string;
  readinessBadge?: string;
  strengths?: string[];
  recurringWeaknesses?: string[];
  recommendedExercises?: string[];
  turnCount?: number;
  durationSeconds?: number;
}

function buildReportHTML(data: {
  topicName: string;
  questionCount: string;
  durationText: string;
  dateText: string;
  overallAverage: string;
  headline: string;
  executiveSummary: string;
  readinessBadge: string;
  grammarScore: string;
  clarityScore: string;
  technicalScore: string;
  readinessScore: string;
  strengths: string[];
  weaknesses: string[];
  exercises: string[];
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verbalis - Session Evaluation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #1A1A24;
      background-color: #FFFFFF;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #5B50E5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #5B50E5;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .report-subtitle {
      font-size: 14px;
      color: #6C6B80;
      margin: 0;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #8F90A6;
    }
    .meta-box strong {
      color: #1A1A24;
      font-size: 13px;
    }
    .hero-card {
      background: #EEF0FD;
      border: 1px solid rgba(91, 80, 229, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .score-badge-circle {
      text-align: center;
      min-width: 100px;
    }
    .score-number {
      font-size: 44px;
      font-weight: 800;
      color: #5B50E5;
      line-height: 1;
    }
    .score-scale {
      font-size: 12px;
      color: #6C6B80;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .hero-details {
      flex: 1;
    }
    .readiness-pill {
      display: inline-block;
      background: #D1FADF;
      color: #027A48;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 16px;
      margin-bottom: 8px;
    }
    .hero-heading {
      font-size: 18px;
      font-weight: 700;
      color: #1A1A24;
      margin: 0 0 6px 0;
    }
    .hero-desc {
      font-size: 13px;
      color: #4A4A5A;
      margin: 0;
    }
    .rubrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .rubric-card {
      background: #F8F9FE;
      border: 1px solid #E4E5EE;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .rubric-label {
      font-size: 11px;
      font-weight: 600;
      color: #6C6B80;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rubric-val {
      font-size: 20px;
      font-weight: 800;
      color: #1A1A24;
    }
    .rubric-val span {
      font-size: 12px;
      font-weight: 500;
      color: #8F90A6;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1A1A24;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .strengths-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 10px;
      padding: 16px;
    }
    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #1A1A24;
    }
    .bullet-item:last-child {
      margin-bottom: 0;
    }
    .bullet-icon {
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }
    .icon-green {
      color: #16A34A;
    }
    .icon-amber {
      color: #D97706;
    }
    .icon-purple {
      color: #5B50E5;
    }
    .improvements-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      padding: 16px;
    }
    .exercises-box {
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      border-radius: 10px;
      padding: 16px;
    }
    .footer {
      border-top: 1px solid #E4E5EE;
      padding-top: 16px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #8F90A6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">Verbalis</div>
      <div class="report-subtitle">Session Evaluation Report • ${data.topicName}</div>
    </div>
    <div class="meta-box">
      <div><strong>Date:</strong> ${data.dateText}</div>
      <div><strong>Duration:</strong> ${data.durationText} • <strong>Questions:</strong> ${data.questionCount}</div>
    </div>
  </div>

  <div class="hero-card">
    <div class="score-badge-circle">
      <div class="score-number">${data.overallAverage}</div>
      <div class="score-scale">out of 5.0</div>
    </div>
    <div class="hero-details">
      <div class="readiness-pill">${data.readinessBadge}</div>
      <div class="hero-heading">${data.headline}</div>
      <div class="hero-desc">${data.executiveSummary}</div>
    </div>
  </div>

  <div class="rubrics-grid">
    <div class="rubric-card">
      <div class="rubric-label">Grammar</div>
      <div class="rubric-val">${data.grammarScore} <span>/ 5</span></div>
    </div>
    <div class="rubric-card">
      <div class="rubric-label">Clarity</div>
      <div class="rubric-val">${data.clarityScore} <span>/ 5</span></div>
    </div>
    <div class="rubric-card">
      <div class="rubric-label">Technical</div>
      <div class="rubric-val">${data.technicalScore} <span>/ 5</span></div>
    </div>
    <div class="rubric-card">
      <div class="rubric-label">Readiness</div>
      <div class="rubric-val">${data.readinessScore} <span>/ 5</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">✅ Demonstrated Strengths (Pros)</div>
    <div class="strengths-box">
      ${data.strengths.map((s) => `<div class="bullet-item"><span class="bullet-icon icon-green">✔</span><span>${s}</span></div>`).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚠️ Key Focus for Next Practice (Cons & Weaknesses)</div>
    <div class="improvements-box">
      ${data.weaknesses.map((w) => `<div class="bullet-item"><span class="bullet-icon icon-amber">💡</span><span>${w}</span></div>`).join('')}
    </div>
  </div>

  ${data.exercises.length > 0 ? `
  <div class="section">
    <div class="section-title">🎯 Recommended Practice Exercises (Suggestions)</div>
    <div class="exercises-box">
      ${data.exercises.map((e) => `<div class="bullet-item"><span class="bullet-icon icon-purple">🏋️</span><span>${e}</span></div>`).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <div>Verbalis AI Communication Coach • Confidential Rehearsal Evaluation</div>
    <div>Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
  </div>
</body>
</html>`;
}

export default function FinalSessionReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicName?: string;
    questionCount?: string;
    durationText?: string;
    sessionId?: string;
    summaryData?: string;
  }>();

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState<SessionSummaryData | null>(() => {
    if (params.summaryData) {
      try {
        return JSON.parse(params.summaryData);
      } catch (e) {
        console.warn('Failed to parse summaryData param:', e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (!summary && params.sessionId) {
      setLoading(true);
      api.get(`/sessions/${params.sessionId}/summary`)
        .then((res) => {
          if (res.data) {
            setSummary(res.data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch session summary by id:', err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.sessionId, summary]);

  // Derived values from real dynamic evaluation
  const overallAverage = summary?.overallScore?.average != null
    ? Number(summary.overallScore.average).toFixed(1)
    : (summary?.overallScore
        ? ((Number(summary.overallScore.grammar || 0) +
            Number(summary.overallScore.clarity || 0) +
            Number(summary.overallScore.technicalAccuracy || 0) +
            Number(summary.overallScore.interviewReadiness || 0)) / 4).toFixed(1)
        : '—');

  const headline = summary?.headline || 'Session Evaluation Complete';
  const executiveSummary = summary?.executiveSummary || 'Your answers were evaluated across technical precision, linguistic clarity, and structured delivery.';
  const readinessBadge = summary?.readinessBadge || 'Interview Readiness';

  const badgeVariant = readinessBadge.toLowerCase().includes('strong')
    ? 'success'
    : readinessBadge.toLowerCase().includes('need')
    ? 'caution'
    : 'neutral';

  const grammarScore = summary?.overallScore?.grammar != null
    ? Number(summary.overallScore.grammar).toFixed(1)
    : '—';
  const clarityScore = summary?.overallScore?.clarity != null
    ? Number(summary.overallScore.clarity).toFixed(1)
    : '—';
  const technicalScore = summary?.overallScore?.technicalAccuracy != null
    ? Number(summary.overallScore.technicalAccuracy).toFixed(1)
    : '—';
  const readinessScore = summary?.overallScore?.interviewReadiness != null
    ? Number(summary.overallScore.interviewReadiness).toFixed(1)
    : '—';

  const strengths = summary?.strengths && summary.strengths.length > 0
    ? summary.strengths
    : [
        'Attempted technical questions and engaged in spoken response.',
        'Showed willingness to articulate technical thought process.',
      ];

  const weaknesses = summary?.recurringWeaknesses && summary.recurringWeaknesses.length > 0
    ? summary.recurringWeaknesses
    : [
        'Provide concrete examples and trade-offs to anchor your explanations.',
        'Take a 1-second pause to organize your answer before speaking.',
      ];

  const exercises = summary?.recommendedExercises || [];

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const html = buildReportHTML({
        topicName: params.topicName || 'Technical Concepts',
        questionCount: String(summary?.turnCount || params.questionCount || '1'),
        durationText: params.durationText || 'Practice Rehearsal',
        dateText: new Date().toLocaleDateString(),
        overallAverage,
        headline,
        executiveSummary,
        readinessBadge,
        grammarScore,
        clarityScore,
        technicalScore,
        readinessScore,
        strengths,
        weaknesses,
        exercises,
      });

      try {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          try {
            await Sharing.shareAsync(uri, {
              UTI: 'com.adobe.pdf',
              mimeType: 'application/pdf',
              dialogTitle: `Export Verbalis Report - ${params.topicName || 'Interview'}`,
            });
            return;
          } catch (sharingError: any) {
            console.warn('Native sharing rejected, falling back to system print/preview:', sharingError);
          }
        }
        // Fallback: System Print Dialog allows saving directly as PDF on all Android/iOS devices
        await Print.printAsync({ html });
      } catch (printErr: any) {
        console.warn('System print fallback attempt:', printErr);
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      console.warn('Error exporting report as PDF:', err);
      Alert.alert('Export Notice', 'Unable to open PDF preview. Please check device print services.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Session Evaluation Report</Text>
            <Text style={styles.headerSubtitle}>
              {params.topicName || 'Technical Concepts'} • {summary?.turnCount || params.questionCount || '1'} Question{(Number(summary?.turnCount || params.questionCount || 1) !== 1) ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleExportPDF}
              disabled={isExporting}
              style={styles.headerIconBtn}
              accessibilityLabel="Export PDF Report">
              {isExporting ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <MaterialIcons name="picture-as-pdf" size={20} color={Colors.light.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.doneBtn}
              accessibilityLabel="Finish and Return">
              <MaterialIcons name="check" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {loading && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Synthesizing your evaluation report...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 110 + Math.max(insets.bottom, 16) },
            ]}
            showsVerticalScrollIndicator={false}>
            {/* Executive Performance Hero Card */}
            <Card style={styles.heroCard}>
              <View style={styles.heroHeaderRow}>
                <Badge label={readinessBadge} variant={badgeVariant} />
                <Text style={styles.durationTag}>{params.durationText || 'Practice Finished'}</Text>
              </View>

              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreNumber}>{overallAverage}</Text>
                  <Text style={styles.scoreScale}>out of 5.0</Text>
                </View>
                <View style={styles.scoreMetaCol}>
                  <Text style={styles.scoreMetaHeading}>{headline}</Text>
                  <Text style={styles.scoreMetaDesc}>{executiveSummary}</Text>
                </View>
              </View>
            </Card>

            {/* 4 Evaluation Rubrics */}
            <View style={styles.rubricsGrid}>
              <View style={styles.rubricItem}>
                <Text style={styles.rubricLabel}>Grammar & Formation</Text>
                <Text style={styles.rubricScore}>{grammarScore} <Text style={styles.rubricMax}>/ 5</Text></Text>
              </View>
              <View style={styles.rubricItem}>
                <Text style={styles.rubricLabel}>Clarity & Structure</Text>
                <Text style={styles.rubricScore}>{clarityScore} <Text style={styles.rubricMax}>/ 5</Text></Text>
              </View>
              <View style={styles.rubricItem}>
                <Text style={styles.rubricLabel}>Technical Accuracy</Text>
                <Text style={styles.rubricScore}>{technicalScore} <Text style={styles.rubricMax}>/ 5</Text></Text>
              </View>
              <View style={styles.rubricItem}>
                <Text style={styles.rubricLabel}>Interview Readiness</Text>
                <Text style={styles.rubricScore}>{readinessScore} <Text style={styles.rubricMax}>/ 5</Text></Text>
              </View>
            </View>

            {/* Key Strengths (Pros) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Demonstrated Strengths (Pros)</Text>
              <Card style={styles.strengthsCard}>
                {strengths.map((str, idx) => (
                  <View key={`strength-${idx}`} style={styles.bulletRow}>
                    <MaterialIcons name="check-circle" size={16} color={Colors.light.successText} />
                    <Text style={styles.bulletText}>{str}</Text>
                  </View>
                ))}
              </Card>
            </View>

            {/* Targeted Improvement Plan (Cons / Weaknesses) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Key Focus for Next Practice (Cons)</Text>
              <Card style={styles.improvementsCard}>
                {weaknesses.map((weak, idx) => (
                  <View key={`weak-${idx}`} style={styles.bulletRow}>
                    <MaterialIcons name="lightbulb" size={16} color={Colors.light.cautionText} />
                    <Text style={styles.bulletText}>{weak}</Text>
                  </View>
                ))}
              </Card>
            </View>

            {/* Recommended Exercises (Suggestions) */}
            {exercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Recommended Practice Exercises</Text>
                <Card style={styles.exercisesCard}>
                  {exercises.map((ex, idx) => (
                    <View key={`exercise-${idx}`} style={styles.bulletRow}>
                      <MaterialIcons name="fitness-center" size={16} color={Colors.light.primary} />
                      <Text style={styles.bulletText}>{ex}</Text>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* Dedicated PDF Export Card */}
            <Card style={styles.exportCard}>
              <View style={styles.exportCardHeader}>
                <View style={styles.exportIconCircle}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.exportTextCol}>
                  <Text style={styles.exportCardTitle}>Export Session Report as PDF</Text>
                  <Text style={styles.exportCardSubtitle}>
                    Save or share a formal document containing your score breakdown, pros, cons, and practice exercises.
                  </Text>
                </View>
              </View>
              <Button
                title={isExporting ? 'Generating PDF...' : 'Download / Share PDF'}
                onPress={handleExportPDF}
                variant="outline"
                size="md"
                loading={isExporting}
                icon={<MaterialIcons name="file-download" size={18} color={Colors.light.primary} />}
              />
            </Card>
          </ScrollView>
        )}

        {/* Bottom Actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Button
            title="Export PDF"
            onPress={handleExportPDF}
            variant="outline"
            size="lg"
            loading={isExporting}
            icon={<MaterialIcons name="picture-as-pdf" size={18} color={Colors.light.primary} />}
            style={styles.bottomBtnHalf}
          />
          <Button
            title="Dashboard"
            onPress={() => router.replace('/(tabs)')}
            size="lg"
            icon={<MaterialIcons name="home" size={18} color="#fff" />}
            style={styles.bottomBtnHalf}
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
    gap: 8,
  },
  headerTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  headerSubtitle: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    ...Typography.sizes.bodyMd,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: 16,
    paddingBottom: 110,
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
  exercisesCard: {
    padding: 14,
    gap: 10,
    backgroundColor: '#F3F4FD',
    borderColor: 'rgba(91, 80, 229, 0.2)',
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
  exportCard: {
    padding: 16,
    gap: 14,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderColor: 'rgba(91, 80, 229, 0.2)',
  },
  exportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  exportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextCol: {
    flex: 1,
    gap: 2,
  },
  exportCardTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '700',
  },
  exportCardSubtitle: {
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
    flexDirection: 'row',
    gap: 10,
  },
  bottomBtnHalf: {
    flex: 1,
  },
});
