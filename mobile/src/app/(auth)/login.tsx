import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup, isLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim()) {
        setErrorMessage('Please enter your first name');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
      }

      const res = await signup(cleanEmail, password, firstName.trim());
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.message || 'Registration failed. Please try again.');
      }
    } else {
      const res = await login(cleanEmail, password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <MaterialIcons name="graphic-eq" size={26} color={Colors.light.primaryContainer} />
              <Text style={styles.brandName}>Verbalis</Text>
            </View>
          </View>

          {/* Hero text */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {mode === 'signin'
                ? 'Sign in to access your speech evaluations, practice topics, and progress history.'
                : 'Sign up to start technical voice interview rehearsal with real-time AI feedback.'}
            </Text>
          </View>

          {/* Segmented control */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Switch to Sign In">
              <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Switch to Create Account">
              <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error notice if any */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color={Colors.light.critical} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* First Name Field (Only in Sign Up mode) */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>First name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={20} color={Colors.light.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={setFirstName}
                    accessibilityLabel="First Name"
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={20} color={Colors.light.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  accessibilityLabel="Email Address"
                />
                {email.includes('@') && email.includes('.') && (
                  <View style={styles.validCheck}>
                    <MaterialIcons name="check" size={14} color={Colors.light.successText} />
                  </View>
                )}
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                {mode === 'signup' && (
                  <Text style={styles.passwordHint}>Min. 6 characters</Text>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={20} color={Colors.light.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={Colors.light.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Action Button */}
            <Button
              title={mode === 'signin' ? 'Sign In' : 'Create Account'}
              onPress={handleAuth}
              loading={isLoading}
              size="lg"
              icon={<MaterialIcons name="arrow-forward" size={18} color="#fff" />}
              iconPosition="right"
              style={styles.submitBtn}
            />

            {/* Switch Mode Helper Text */}
            <TouchableOpacity
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMessage(null);
              }}
              style={styles.toggleFooter}>
              <Text style={styles.toggleFooterText}>
                {mode === 'signin'
                  ? "Don't have an account yet? "
                  : 'Already registered? '}
                <Text style={styles.toggleFooterLink}>
                  {mode === 'signin' ? 'Create an account' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Terms and Privacy Policy Links */}
            <View style={styles.legalLinksRow}>
              <Text style={styles.legalNoticeText}>By continuing, you accept Verbalis </Text>
              <View style={styles.legalSubRow}>
                <TouchableOpacity
                  onPress={() => router.push('/legal/terms' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Terms and Conditions">
                  <Text style={styles.legalLink}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text style={styles.legalDivider}> • </Text>
                <TouchableOpacity
                  onPress={() => router.push('/legal/privacy' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Privacy Policy">
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    ...Typography.sizes.headlineSm,
    color: Colors.light.onSurface,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroSection: {
    gap: 6,
  },
  heroTitle: {
    ...Typography.sizes.headlineLg,
    color: Colors.light.onSurface,
  },
  heroSubtitle: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...Typography.sizes.labelMd,
    color: Colors.light.textTertiary,
  },
  segmentTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.criticalTint,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.criticalBorder,
    gap: 8,
  },
  errorText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.critical,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.sizes.labelMd,
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordHint: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 8,
  },
  toggleFooter: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleFooterText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textSecondary,
  },
  toggleFooterLink: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  legalLinksRow: {
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  legalNoticeText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
  legalSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLink: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
    fontWeight: '600',
    paddingVertical: 4,
  },
  legalDivider: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textTertiary,
  },
});
