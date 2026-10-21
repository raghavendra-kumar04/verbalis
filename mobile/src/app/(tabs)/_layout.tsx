import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primaryContainer,
        tabBarInactiveTintColor: Colors.light.tertiary,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: 'rgba(200, 196, 215, 0.4)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#1c1d1f',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: (props: any) => (
            <MaterialIcons name="mic" size={24} color={props.color ?? Colors.light.primaryContainer} />
          ),
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: 'Topics',
          tabBarIcon: (props: any) => (
            <MaterialIcons name="category" size={24} color={props.color ?? Colors.light.tertiary} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progress',
          tabBarIcon: (props: any) => (
            <MaterialIcons name="insights" size={24} color={props.color ?? Colors.light.tertiary} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: (props: any) => (
            <MaterialIcons name="person" size={24} color={props.color ?? Colors.light.tertiary} />
          ),
        }}
      />
    </Tabs>
  );
}
