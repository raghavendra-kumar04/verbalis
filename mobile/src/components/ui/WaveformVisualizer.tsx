import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

interface WaveformBarProps {
  index: number;
  isActive: boolean;
  baseHeight: number;
  maxHeight: number;
}

const WaveformBar: React.FC<WaveformBarProps> = ({ index, isActive, baseHeight, maxHeight }) => {
  const heightAnim = useSharedValue(baseHeight);

  useEffect(() => {
    if (isActive) {
      // Staggered oscillation for realistic acoustic voice energy
      const delay = (index % 6) * 120;
      const targetHeight = Math.max(8, (index * 7) % maxHeight + 10);
      heightAnim.value = withDelay(
        delay,
        withRepeat(
          withTiming(targetHeight, {
            duration: 400 + (index % 4) * 80,
            easing: Easing.inOut(Easing.quad),
          }),
          -1,
          true
        )
      );
    } else {
      heightAnim.value = withTiming(baseHeight, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        {
          backgroundColor: isActive
            ? index % 3 === 0
              ? Colors.light.primaryContainer
              : index % 2 === 0
              ? Colors.light.primary
              : Colors.light.secondaryContainer
            : 'rgba(200, 196, 215, 0.5)',
        },
      ]}
    />
  );
};

interface WaveformVisualizerProps {
  isActive?: boolean;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive = false,
  barCount = 24,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {bars.map((i) => (
        <WaveformBar
          key={i}
          index={i}
          isActive={isActive}
          baseHeight={6 + (i % 3) * 3}
          maxHeight={36}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.3)',
  },
  bar: {
    width: 3.5,
    borderRadius: 3,
  },
});
