import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface MicOrbProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  reducedMotion?: boolean;
}

export const MicOrb: React.FC<MicOrbProps> = ({
  isRecording,
  onPress,
  disabled = false,
  label = isRecording ? 'Tap to Finish Speaking' : 'Tap to Start Speaking',
  reducedMotion = false,
}) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (reducedMotion) {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
      return;
    }

    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.22, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.12, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording, reducedMotion]);

  const animatedHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      {/* Ambient Pulsing Glow Halo */}
      <Animated.View style={[styles.halo, animatedHaloStyle]} />

      {/* Master 84px Circular Mic Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          isRecording ? styles.buttonActive : styles.buttonIdle,
          disabled && styles.buttonDisabled,
        ]}>
        <MaterialIcons
          name={isRecording ? 'stop' : 'mic'}
          size={38}
          color="#ffffff"
        />
      </TouchableOpacity>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: -8,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primaryContainer,
  },
  button: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonIdle: {
    backgroundColor: Colors.light.primaryContainer,
  },
  buttonActive: {
    backgroundColor: Colors.light.critical,
    shadowColor: Colors.light.critical,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    letterSpacing: -0.2,
  },
});
