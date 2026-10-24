import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { userEmail, firstName, preferences, updateProfile, logout } = useAuth();

  const [nameInput, setNameInput] = useState(firstName || '');
  const [feedbackMode, setFeedbackMode] = useState<'per_answer' | 'end_of_session'>(
    preferences.preferredFeedbackMode || 'per_answer'
  );
  const [speechSpeed, setSpeechSpeed] = useState<'0.9x' | '1.0x' | '1.1x'>(
    preferences.speechSpeed || '1.0x'
  );
  const [reducedMotion, setReducedMotion] = useState(preferences.reducedMotion || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (firstName) {
      setNameInput(firstName);
    }
    if (preferences) {
      setFeedbackMode(preferences.preferredFeedbackMode || 'per_answer');
      setSpeechSpeed(preferences.speechSpeed || '1.0x');
      setReducedMotion(Boolean(preferences.reducedMotion));
    }
  }, [firstName, preferences]);

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation Error', 'First name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccessMsg(null);
      const res = await updateProfile({
        firstName: nameInput.trim(),
        preferredFeedbackMode: feedbackMode,
        speechSpeed,
        reducedMotion,
      });

      if (res.success) {
        setSaveSuccessMsg('Profile changes saved successfully to database!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        Alert.alert('Update Failed', res.message || 'Could not save profile changes.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error while saving profile');
    } finally {
      setIsSaving(false);
    }
  };

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Manage your coaching parameters and preferences</Text>
        </View>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <View style={styles.successBanner}>
            <MaterialIcons name="check-circle" size={18} color={Colors.light.success} />
            <Text style={styles.successText}>{saveSuccessMsg}</Text>
          </View>
        )}

        {/* Editable User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={28} color={Colors.light.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{firstName || (userEmail ? userEmail.split('@')[0] : 'User')}</Text>
              <Text style={styles.userRole}>{userEmail || ''}</Text>
            </View>
            <Badge label="Personal" variant="primary" />
          </View>

          <View style={styles.divider} />

          {/* Editable First Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Display First Name</Text>
            <Text style={styles.inputHelp}>
              Displayed on your top navbar and used by the AI coach.
            </Text>
            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter first name"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
              accessibilityLabel="First Name"
            />
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
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Per-Answer Feedback">
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
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="End-of-Session Feedback">
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
                <Text style={styles.settingDesc}>Cadence rate for Expo Speech TTS</Text>
              </View>
              <View style={styles.toggleRow}>
                {(['0.9x', '1.0x', '1.1x'] as const).map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => setSpeechSpeed(spd)}
                    style={[styles.speedBtn, speechSpeed === spd && styles.speedBtnActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Speech speed ${spd}`}>
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
                <Text style={styles.settingDesc}>Disable pulsing waveforms and animations</Text>
              </View>
              <Switch
                value={reducedMotion}
                onValueChange={setReducedMotion}
                trackColor={{ false: Colors.light.surfaceContainerHigh, true: Colors.light.primaryContainer }}
                thumbColor="#ffffff"
                accessibilityLabel="Toggle reduced motion"
              />
            </View>
          </Card>
        </View>

        {/* Save Settings Button */}
        <Button
          title={isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          onPress={handleSaveProfile}
          disabled={isSaving}
          size="lg"
          icon={
            isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="save" size={20} color="#fff" />
            )
          }
        />

        {/* Privacy & Legal Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <Card style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <MaterialIcons name="security" size={18} color={Colors.light.primary} />
              <Text style={styles.privacyTitle}>Zero Audio Persistence Guarantee</Text>
            </View>
            <Text style={styles.privacyBody}>
              Verbalis never saves raw audio files, speech recordings, or conversational answer transcripts.
              Spoken audio is transcribed on-the-fly via Groq Whisper and evaluated in ephemeral memory.
            </Text>

            <View style={styles.legalNavLinksContainer}>
              <TouchableOpacity
                onPress={() => router.push('/legal/privacy' as any)}
                style={styles.legalNavRow}
                accessibilityRole="button"
                accessibilityLabel="View Privacy Policy">
                <View style={styles.legalNavLeft}>
                  <MaterialIcons name="privacy-tip" size={18} color={Colors.light.primary} />
                  <Text style={styles.legalNavText}>Privacy Policy</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.light.textTertiary} />
              </TouchableOpacity>

              <View style={styles.legalNavDivider} />

              <TouchableOpacity
                onPress={() => router.push('/legal/terms' as any)}
                style={styles.legalNavRow}
                accessibilityRole="button"
                accessibilityLabel="View Terms & Conditions">
                <View style={styles.legalNavLeft}>
                  <MaterialIcons name="description" size={18} color={Colors.light.primary} />
                  <Text style={styles.legalNavText}>Terms & Conditions</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.light.textTertiary} />
              </TouchableOpacity>
            </View>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.successTint,
    padding: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  successText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.success,
    fontWeight: '600',
    flex: 1,
  },
  profileCard: {
    padding: 16,
    gap: 16,
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
  inputSection: {
    gap: 6,
  },
  inputLabel: {
    ...Typography.sizes.labelLg,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  inputHelp: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.surfaceContainerLowest,
    color: Colors.light.onSurface,
    ...Typography.sizes.bodyMd,
    marginTop: 4,
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
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  legalNavLinksContainer: {
    marginTop: 10,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
    overflow: 'hidden',
  },
  legalNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  legalNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalNavText: {
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
    fontWeight: '500',
  },
  legalNavDivider: {
    height: 1,
    backgroundColor: 'rgba(200, 196, 215, 0.25)',
  },
});
