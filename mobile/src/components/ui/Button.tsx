import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'pill' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'pill':
        return styles.pillContainer;
      case 'danger':
        return styles.dangerContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'pill':
        return styles.pillText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smContainer;
      case 'lg':
        return styles.lgContainer;
      default:
        return styles.mdContainer;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getSizeStyle(),
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.light.primary} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  smContainer: {
    height: 38,
    paddingHorizontal: Spacing.sm + 4,
    borderRadius: BorderRadius.sm + 2,
  },
  mdContainer: {
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  lgContainer: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  primaryContainer: {
    backgroundColor: Colors.light.primaryContainer,
    shadowColor: Colors.light.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(200, 196, 215, 0.4)',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primaryContainer,
  },
  pillContainer: {
    backgroundColor: Colors.light.primaryContainer,
    borderRadius: BorderRadius.pill,
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  dangerContainer: {
    backgroundColor: Colors.light.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.sizes.labelLg,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: Colors.light.onSurface,
  },
  outlineText: {
    color: Colors.light.primaryContainer,
  },
  pillText: {
    color: '#ffffff',
  },
  dangerText: {
    color: '#ffffff',
  },
});
