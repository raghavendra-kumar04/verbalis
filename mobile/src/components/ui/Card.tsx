import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'low' | 'highlight';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'surface' }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'low':
        return styles.low;
      case 'highlight':
        return styles.highlight;
      default:
        return styles.surface;
    }
  };

  return <View style={[styles.base, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  surface: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    shadowColor: '#1c1d1f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  low: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderColor: 'rgba(200, 196, 215, 0.25)',
  },
  highlight: {
    backgroundColor: '#EEF0FD',
    borderColor: 'rgba(91, 80, 229, 0.25)',
  },
});
