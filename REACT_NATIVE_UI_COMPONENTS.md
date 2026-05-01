# PetHub - React Native UI Components Implementation

Production-ready, accessible React Native components following the PetHub design system.

---

## 🎨 Color Tokens (Centralized)

**File**: `mobile/src/theme/colors.js`

```javascript
export const colors = {
  // Primary
  primary: {
    50: '#F0F9FB',
    100: '#E0F2F7',
    500: '#1E7A8A',
    700: '#0F4A55',
  },
  
  // Secondary (Teal)
  secondary: {
    500: '#0F9B8E',
    700: '#067A6F',
  },
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral
  white: '#FFFFFF',
  slate: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
  },
  
  // Dark Mode
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    border: '#334155',
  },
};

// Semantic tokens
export const semanticColors = {
  light: {
    background: colors.white,
    surface: colors.slate[50],
    text: colors.slate[900],
    textSecondary: colors.slate[500],
    border: colors.slate[200],
  },
  dark: {
    background: colors.dark.background,
    surface: colors.dark.surface,
    text: colors.dark.text,
    textSecondary: colors.dark.textSecondary,
    border: colors.dark.border,
  },
};
```

---

## 🔘 Primary Button Component

```javascript
// mobile/src/components/Button.js
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, AccessibilityInfo } from 'react-native';
import { colors } from '../theme/colors';

export const Button = ({
  label,
  onPress,
  variant = 'primary', // primary, secondary, danger, ghost
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  accessibilityLabel,
  ...props
}) => {
  const styles = getStyles(variant, size);
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      <View style={styles.content}>
        {Icon && <Icon size={size === 'sm' ? 16 : 20} color={styles.iconColor} />}
        {loading ? (
          <ActivityIndicator size="small" color={styles.textColor} />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
};

const getStyles = (variant, size) => {
  const baseSize = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, minHeight: 32 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, minHeight: 44 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18, minHeight: 48 },
  };

  const styles = {
    primary: {
      button: {
        backgroundColor: colors.primary[500],
        borderRadius: 8,
        ...baseSize[size],
      },
      text: { color: colors.white, fontWeight: '600' },
      textColor: colors.white,
      iconColor: colors.white,
      pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
      disabled: { opacity: 0.5 },
    },
    secondary: {
      button: {
        backgroundColor: colors.slate[50],
        borderWidth: 1,
        borderColor: colors.slate[200],
        borderRadius: 8,
        ...baseSize[size],
      },
      text: { color: colors.primary[500], fontWeight: '600' },
      textColor: colors.primary[500],
      iconColor: colors.primary[500],
      pressed: { opacity: 0.8 },
      disabled: { opacity: 0.5 },
    },
    danger: {
      button: {
        backgroundColor: colors.error,
        borderRadius: 8,
        ...baseSize[size],
      },
      text: { color: colors.white, fontWeight: '600' },
      textColor: colors.white,
      iconColor: colors.white,
      pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
      disabled: { opacity: 0.5 },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        ...baseSize[size],
      },
      text: { color: colors.primary[500], fontWeight: '600' },
      textColor: colors.primary[500],
      iconColor: colors.primary[500],
      pressed: { backgroundColor: colors.slate[50] },
      disabled: { opacity: 0.5 },
    },
  };

  const selected = styles[variant];
  return {
    ...selected.button,
    text: selected.text,
    iconColor: selected.iconColor,
    textColor: selected.textColor,
    pressed: selected.pressed,
    disabled: selected.disabled,
    content: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  };
};
```

---

## 🎫 Card Component

```javascript
// mobile/src/components/Card.js
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, semanticColors } from '../theme/colors';

export const Card = ({
  children,
  onPress,
  variant = 'default', // default, elevated, outlined
  style,
  ...props
}) => {
  const scheme = useColorScheme();
  const semantic = semanticColors[scheme];
  
  const containerStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && { borderWidth: 1, borderColor: semantic.border },
    { backgroundColor: semantic.surface },
    style,
  ];

  const Component = onPress ? Pressable : View;

  return (
    <Component
      style={({ pressed }) => [
        containerStyle,
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
      accessible={!!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  elevated: {
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
```

---

## 📝 Text Input Component

```javascript
// mobile/src/components/TextInput.js
import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { colors, semanticColors } from '../theme/colors';

export const TextInput = ({
  label,
  error,
  helperText,
  required,
  value,
  onChangeText,
  accessibilityLabel,
  testID,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const scheme = useColorScheme();
  const semantic = semanticColors[scheme];

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary[500]
    : semantic.border;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: semantic.text },
            error && { color: colors.error },
          ]}
          accessible={true}
          accessibilityRole="header"
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      <RNTextInput
        style={[
          styles.input,
          {
            borderColor,
            color: semantic.text,
            backgroundColor: semantic.surface,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={semantic.textSecondary}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={helperText}
        accessibilityState={{ disabled: props.editable === false }}
        testID={testID}
        {...props}
      />

      {error && (
        <Text
          style={[styles.error, { color: colors.error }]}
          accessible={true}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text style={[styles.helperText, { color: semantic.textSecondary }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
```

---

## 🏷️ Badge Component

```javascript
// mobile/src/components/Badge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const Badge = ({ label, variant = 'default', icon: Icon }) => {
  const styles = getStyles(variant);

  return (
    <View
      style={[styles.badge]}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="status"
    >
      {Icon && <Icon size={12} color={styles.textColor} />}
      <Text style={[styles.text, { color: styles.textColor }]}>{label}</Text>
    </View>
  );
};

const getStyles = (variant) => {
  const variants = {
    success: {
      backgroundColor: '#D1FAE5',
      textColor: '#065F46',
    },
    warning: {
      backgroundColor: '#FEF3C7',
      textColor: '#78350F',
    },
    error: {
      backgroundColor: '#FEE2E2',
      textColor: '#991B1B',
    },
    info: {
      backgroundColor: '#DBEAFE',
      textColor: '#1E40AF',
    },
    default: {
      backgroundColor: colors.slate[100],
      textColor: colors.slate[700],
    },
  };

  return {
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 9999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: variants[variant].backgroundColor,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: 10,
      fontWeight: '600',
    },
    textColor: variants[variant].textColor,
  };
};
```

---

## 📱 Navigation with Bottom Tab Bar

```javascript
// mobile/src/navigation/RootNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';

import HomeScreen from '../screens/HomeScreen';
import PetListScreen from '../screens/PetListScreen';
import ChatScreen from '../screens/ChatScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
  </Stack.Navigator>
);

const PetStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="PetList" component={PetListScreen} options={{ title: 'My Pets' }} />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Pet Care Assistant' }} />
  </Stack.Navigator>
);

const AccountStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const iconMap = {
              HomeStack: 'home',
              PetStack: 'heart',
              ChatStack: 'message-circle',
              AccountStack: 'user',
            };
            return <Feather name={iconMap[route.name]} size={size} color={color} />;
          },
          tabBarLabel: ({ focused, color }) => {
            const labelMap = {
              HomeStack: 'Home',
              PetStack: 'Pets',
              ChatStack: 'Chat',
              AccountStack: 'Account',
            };
            return <Text style={{ color, fontSize: 10, fontWeight: focused ? '600' : '400' }}>{labelMap[route.name]}</Text>;
          },
          tabBarActiveTintColor: '#1E7A8A',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
          },
          headerShown: true,
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="HomeStack" component={HomeStack} options={{ headerShown: false }} />
        <Tab.Screen name="PetStack" component={PetStack} />
        <Tab.Screen name="ChatStack" component={ChatStack} />
        <Tab.Screen name="AccountStack" component={AccountStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
```

---

## ⚡ Animation Utilities

```javascript
// mobile/src/utils/animations.js
import { Animated, Easing } from 'react-native';

// Button press animation
export const createPressAnimation = (scaleValue) => ({
  onPressIn: () => {
    Animated.timing(scaleValue, {
      toValue: 0.97,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  },
  onPressOut: () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  },
});

// Modal entrance animation
export const animateModalEntrance = (opacity, translateY) => {
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
};

// List item stagger
export const createListItemAnimation = (itemOpacity, index, staggerDelay = 50) => {
  Animated.timing(itemOpacity, {
    toValue: 1,
    duration: 300,
    delay: index * staggerDelay,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
};
```

---

## 🎨 Example Screen: Home Dashboard

```javascript
// mobile/src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  useColorScheme,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { colors, semanticColors } from '../theme/colors';

export const HomeScreen = ({ navigation }) => {
  const scheme = useColorScheme();
  const semantic = semanticColors[scheme];
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const listItemsOpacity = useRef([new Animated.Value(0)]).current;

  useEffect(() => {
    // Load appointments
    fetchAppointments();
    
    // Animate list items on mount
    appointments.forEach((_, index) => {
      Animated.timing(listItemsOpacity[index] || new Animated.Value(0), {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const fetchAppointments = async () => {
    // Fetch from API
    setAppointments([
      { id: 1, vetName: 'Dr. Sarah Johnson', petName: 'Buddy', time: 'Today 2:00 PM', status: 'Confirmed' },
      { id: 2, vetName: 'Dr. John Doe', petName: 'Max', time: 'May 15 10:00 AM', status: 'Pending' },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: semantic.background }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.greeting, { color: semantic.text }]}>Hi, John! 👋</Text>
        <Text style={[styles.subGreeting, { color: semantic.textSecondary }]}>
          Here's what's happening with your pets
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          label="Book Appt"
          variant="primary"
          size="sm"
          onPress={() => navigation.navigate('BookAppointment')}
        />
        <Button
          label="Chat AI"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('Chat')}
        />
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: semantic.text }]}>Upcoming Appointments</Text>
        {appointments.map((appt, index) => (
          <Animated.View
            key={appt.id}
            style={{ opacity: listItemsOpacity[index] }}
            accessible={true}
            accessibilityRole="button"
          >
            <Card
              onPress={() => navigation.navigate('AppointmentDetail', { id: appt.id })}
            >
              <View style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.vetName, { color: semantic.text }]}>{appt.vetName}</Text>
                  <Text style={[styles.petName, { color: semantic.textSecondary }]}>
                    Pet: {appt.petName}
                  </Text>
                  <Text style={[styles.time, { color: semantic.textSecondary }]}>
                    📅 {appt.time}
                  </Text>
                </View>
                <Badge
                  label={appt.status}
                  variant={appt.status === 'Confirmed' ? 'success' : 'warning'}
                />
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>

      {/* Pet Health Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: semantic.text }]}>Pet Health Summary</Text>
        <View style={styles.healthGrid}>
          <Card>
            <Text style={[styles.healthLabel, { color: semantic.textSecondary }]}>Vaccines Due</Text>
            <Text style={[styles.healthValue, { color: colors.primary[500] }]}>3 weeks</Text>
          </Card>
          <Card>
            <Text style={[styles.healthLabel, { color: semantic.textSecondary }]}>Medications</Text>
            <Text style={[styles.healthValue, { color: colors.secondary[500] }]}>1 refill needed</Text>
          </Card>
        </View>
      </View>

      {/* Bottom padding for safe area */}
      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    fontWeight: '400',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  petName: {
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;
```

---

## ✅ Implementation Checklist

Use these components as the foundation:

- [ ] Install color system (`colors.js`)
- [ ] Create reusable `Button` component
- [ ] Create reusable `Card` component
- [ ] Create reusable `TextInput` component
- [ ] Create reusable `Badge` component
- [ ] Setup navigation with bottom tabs
- [ ] Implement animations utility
- [ ] Update all screens to use components
- [ ] Test dark mode separately
- [ ] Verify accessibility with VoiceOver/TalkBack
- [ ] Test on 375px (small) and large screens
- [ ] Verify all touch targets are 44pt+
- [ ] Test contrast ratios (4.5:1 minimum)

---

## 🚀 Next Steps

1. **Copy-paste the color system** into your mobile app
2. **Create each component** as separate files
3. **Update existing screens** to use these components
4. **Test on real devices** (colors, spacing, touch feedback)
5. **Iterate** based on user feedback

This creates a **professional, accessible, modern** PetHub that users will love! 🐾
