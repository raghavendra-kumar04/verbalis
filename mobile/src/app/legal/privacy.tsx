import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={20} color={Colors.light.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Effective Date: October 2026</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Key Guarantee Highlight */}
          <Card style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <MaterialIcons name="security" size={24} color={Colors.light.primary} />
              <Text style={styles.highlightTitle}>Zero Audio Persistence Guarantee</Text>
            </View>
            <Text style={styles.highlightText}>
              Verbalis processes your voice recordings strictly in transient, ephemeral memory. Raw audio files and speech recordings are NEVER permanently stored or sold. Files are deleted from servers immediately upon AI transcription.
            </Text>
          </Card>

          {/* Section 1: Information We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect only the minimum information necessary to provide you with personalized technical interview rehearsal:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>Account Credentials:</Text> Your name, email address, and securely hashed passwords (using bcrypt with salted rounds).
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>Transient Voice Audio:</Text> Spoken responses recorded during your rehearsal sessions. Raw audio is processed through Groq Whisper for on-the-fly speech-to-text conversion and is deleted immediately from disk.
              </Text>
              <Text style={styles.bulletItem}>
                • <Text style={styles.bold}>Performance Metrics:</Text> Aggregated evaluation metrics (clarity score, grammar score, technical accuracy, interview readiness, recurring weaknesses, and practice durations).
              </Text>
            </View>
          </View>

          {/* Section 2: How We Use Your Data */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>2. How We Use Your Data</Text>
            <Text style={styles.paragraph}>
              Your information is used exclusively to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Provide real-time AI interview coaching and phrasing suggestions.</Text>
              <Text style={styles.bulletItem}>• Generate your progress dashboard and track score trends over time.</Text>
              <Text style={styles.bulletItem}>• Calibrate dynamic question difficulty according to your technical proficiency.</Text>
              <Text style={styles.bulletItem}>• Deliver end-of-session evaluation summaries and printable PDF reports.</Text>
            </View>
          </View>

          {/* Section 3: AI Processing & Third Parties */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>3. AI Processing & Third Parties</Text>
            <Text style={styles.paragraph}>
              Verbalis utilizes Groq's low-latency inference cloud for transcription (Whisper) and answer evaluation. Data sent to inference endpoints is processed statelessly and is not utilized to train public foundation models without consent.
            </Text>
          </View>

          {/* Section 4: Data Security */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>4. Data Security & Encryption</Text>
            <Text style={styles.paragraph}>
              All communications between the Verbalis mobile application and backend servers are encrypted using Industry-standard Transport Layer Security (TLS/HTTPS). User sessions are protected with signed JSON Web Tokens (JWT).
            </Text>
          </View>

          {/* Section 5: Your Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>5. Your Rights & Data Retention</Text>
            <Text style={styles.paragraph}>
              You have the right to request access to your historical performance data, update your display preferences, or request full deletion of your account and associated score records at any time.
            </Text>
          </View>

          {/* Section 6: Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>6. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions or concerns regarding this Privacy Policy or your data, please contact the development team at privacy@verbalis.app.
            </Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceContainerHigh,
    backgroundColor: Colors.light.surfaceContainerLowest,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    gap: 20,
  },
  highlightCard: {
    backgroundColor: '#EEF0FD',
    borderColor: 'rgba(91, 80, 229, 0.25)',
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  highlightText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    fontWeight: '700',
  },
  paragraph: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bulletList: {
    gap: 6,
    marginTop: 4,
  },
  bulletItem: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: Colors.light.onSurface,
  },
});
