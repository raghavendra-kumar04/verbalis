import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'caution' | 'critical' | 'neutral';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryContainer;
      case 'success':
        return styles.successContainer;
      case 'caution':
        return styles.cautionContainer;
      case 'critical':
        return styles.criticalContainer;
      default:
        return styles.neutralContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'success':
        return styles.successText;
      case 'caution':
        return styles.cautionText;
      case 'critical':
        return styles.criticalText;
      default:
        return styles.neutralText;
    }
  };

  return (
    <View style={[styles.base, getContainerStyle(), style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    ...Typography.sizes.labelSm,
  },
  primaryContainer: {
    backgroundColor: '#EEF0FD',
    borderWidth: 1,
    borderColor: 'rgba(91, 80, 229, 0.2)',
  },
  primaryText: {
    color: Colors.light.primary,
  },
  successContainer: {
    backgroundColor: Colors.light.successTint,
    borderWidth: 1,
    borderColor: Colors.light.successBorder,
  },
  successText: {
    color: Colors.light.successText,
  },
  cautionContainer: {
    backgroundColor: Colors.light.cautionTint,
    borderWidth: 1,
    borderColor: Colors.light.cautionBorder,
  },
  cautionText: {
    color: Colors.light.cautionText,
  },
  criticalContainer: {
    backgroundColor: Colors.light.criticalTint,
    borderWidth: 1,
    borderColor: Colors.light.criticalBorder,
  },
  criticalText: {
    color: Colors.light.criticalText,
  },
  neutralContainer: {
    backgroundColor: Colors.light.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  neutralText: {
    color: Colors.light.onSurfaceVariant,
  },
});
