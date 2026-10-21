import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { userEmail, logout } = useAuth();

  const [feedbackMode, setFeedbackMode] = useState<'per_answer' | 'end_of_session'>('per_answer');
  const [speechSpeed, setSpeechSpeed] = useState<'0.9x' | '1.0x' | '1.1x'>('1.0x');
  const [reducedMotion, setReducedMotion] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Verbalis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Manage your coaching parameters and preferences</Text>
        </View>

        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={28} color={Colors.light.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userEmail || 'Engineer'}</Text>
              <Text style={styles.userRole}>Technical Interview Rehearsal</Text>
            </View>
            <Badge label="Personal" variant="primary" />
          </View>
        </Card>

        {/* Rehearsal Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rehearsal Defaults</Text>

          <Card style={styles.settingsCard}>
            {/* Feedback Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>Default Feedback Timing</Text>
                <Text style={styles.settingDesc}>
                  {feedbackMode === 'per_answer'
                    ? 'Coaching after every answer'
                    : 'Consolidated report at end of session'}
                </Text>
              </View>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setFeedbackMode('per_answer')}
                  style={[
                    styles.toggleBtn,
                    feedbackMode === 'per_answer' && styles.toggleBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.toggleText,
                      feedbackMode === 'per_answer' && styles.toggleTextActive,
                    ]}>
                    Per-Answer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFeedbackMode('end_of_session')}
                  style={[
                    styles.toggleBtn,
                    feedbackMode === 'end_of_session' && styles.toggleBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.toggleText,
                      feedbackMode === 'end_of_session' && styles.toggleTextActive,
                    ]}>
                    End-of-Session
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* AI Speech Speed */}
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>AI Question Speech Speed</Text>
                <Text style={styles.settingDesc}>Text-to-speech cadence rate</Text>
              </View>
              <View style={styles.toggleRow}>
                {(['0.9x', '1.0x', '1.1x'] as const).map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => setSpeechSpeed(spd)}
                    style={[styles.speedBtn, speechSpeed === spd && styles.speedBtnActive]}>
                    <Text style={[styles.speedText, speechSpeed === spd && styles.speedTextActive]}>
                      {spd}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Reduced Motion */}
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>Reduced Motion</Text>
                <Text style={styles.settingDesc}>Simplify animated waveforms and halos</Text>
              </View>
              <Switch
                value={reducedMotion}
                onValueChange={setReducedMotion}
                trackColor={{ false: Colors.light.surfaceContainerHigh, true: Colors.light.primaryContainer }}
                thumbColor="#ffffff"
              />
            </View>
          </Card>
        </View>

        {/* Privacy & Transient Architecture Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data Policy</Text>
          <Card style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <MaterialIcons name="security" size={18} color={Colors.light.primary} />
              <Text style={styles.privacyTitle}>Zero Audio Persistence Guarantee</Text>
            </View>
            <Text style={styles.privacyBody}>
              Verbalis never saves raw audio files, speech recordings, or verbatim conversational answer
              transcripts in MongoDB. Spoken audio is transcribed on-the-fly via Groq Whisper and
              evaluated in ephemeral memory. Only consolidated coaching metric summaries are retained.
            </Text>
          </Card>
        </View>

        {/* Sign Out CTA */}
        <Button
          title="Sign Out of Verbalis"
          onPress={handleLogout}
          variant="secondary"
          size="lg"
          icon={<MaterialIcons name="logout" size={18} color={Colors.light.critical} />}
          textStyle={{ color: Colors.light.critical }}
        />
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
  profileCard: {
    padding: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  userRole: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
  },
  settingsCard: {
    padding: 16,
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  settingDesc: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 3,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  speedBtnActive: {
    backgroundColor: Colors.light.primaryContainer,
  },
  speedText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  speedTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(200, 196, 215, 0.25)',
  },
  privacyCard: {
    padding: 16,
    gap: 8,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyTitle: {
    ...Typography.sizes.labelLg,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  privacyBody: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});
