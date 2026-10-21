import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('raghavendra@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setErrorMessage(null);

    const res = await login(email.trim(), password);
    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <MaterialIcons name="graphic-eq" size={24} color={Colors.light.primaryContainer} />
              <Text style={styles.brandName}>Verbalis</Text>
            </View>
          </View>

          {/* Hero text */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome to your coach</Text>
            <Text style={styles.heroSubtitle}>
              Sign in to track your speech clarity, technical practice sessions, and interview growth.
            </Text>
          </View>

          {/* Segmented control */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('signin')}
              style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('signup')}
              style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}>
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
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={20} color={Colors.light.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@gmail.com"
                  placeholderTextColor={Colors.light.outline}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {email.includes('@') && (
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
                <TouchableOpacity onPress={() => Alert.alert('Recovery', 'In personal MVP mode, your password is set in backend .env.')}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={20} color={Colors.light.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.light.outline}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
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
              title={mode === 'signin' ? 'Sign In with Email' : 'Create Coach Account'}
              onPress={handleAuth}
              loading={isLoading}
              size="lg"
              icon={<MaterialIcons name="arrow-forward" size={18} color="#fff" />}
              iconPosition="right"
              style={styles.submitBtn}
            />

            {/* Quick Guest / Developer Bypass Button */}
            <Button
              title="Quick Start (Developer Guest Mode)"
              onPress={() => router.replace('/(tabs)')}
              variant="secondary"
              size="md"
              icon={<MaterialIcons name="bolt" size={18} color={Colors.light.primary} />}
              style={styles.guestBtn}
            />
          </View>

          {/* Privacy & Security Note */}
          <View style={styles.footer}>
            <View style={styles.securityPill}>
              <MaterialIcons name="shield" size={14} color={Colors.light.primary} />
              <Text style={styles.securityText}>
                Secured JWT • Spoken audio evaluated transiently
              </Text>
            </View>
            <Text style={styles.disclaimerText}>
              By signing in, you agree to our Terms of Service and transient audio processing policy.
            </Text>
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
    paddingVertical: Spacing.md,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    ...Typography.sizes.headlineMd,
    color: Colors.light.onSurface,
  },
  heroSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  heroTitle: {
    ...Typography.sizes.headlineLg,
    color: Colors.light.onSurface,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    ...Typography.sizes.bodyMd,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: 4,
    borderRadius: BorderRadius.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: {
    ...Typography.sizes.labelMd,
    color: Colors.light.textTertiary,
  },
  segmentTextActive: {
    color: Colors.light.onSurface,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.criticalTint,
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.criticalBorder,
  },
  errorText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.criticalText,
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
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    ...Typography.sizes.labelSm,
    color: Colors.light.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.5)',
    height: 52,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    ...Typography.sizes.bodyMd,
    color: Colors.light.onSurface,
  },
  validCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    marginTop: 8,
  },
  guestBtn: {
    marginTop: 4,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  securityText: {
    ...Typography.sizes.labelSm,
    color: Colors.light.textSecondary,
  },
  disclaimerText: {
    ...Typography.sizes.bodySm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
