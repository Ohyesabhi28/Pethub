import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PetListScreen from '../screens/PetListScreen';
import AddPetScreen from '../screens/AddPetScreen';
import AIChatScreen from '../screens/AIChatScreen';
import VetSearchScreen from '../screens/VetSearchScreen';
import BookingScreen from '../screens/BookingScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import PharmacyScreen from '../screens/PharmacyScreen';
import AdminScreen from '../screens/AdminScreen';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Pets: ['paw', 'paw-outline'],
  AI: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
  Vets: ['medical', 'medical-outline'],
  Pharmacy: ['medkit', 'medkit-outline'],
  Admin: ['shield-checkmark', 'shield-checkmark-outline'],
};

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { profile } = useAuth();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['help-circle', 'help-circle-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tabs.Screen name="Pets" component={PetListScreen} options={{ title: 'My Pets' }} />
      <Tabs.Screen name="AI" component={AIChatScreen} options={{ title: 'AI Chat' }} />
      <Tabs.Screen name="Vets" component={VetSearchScreen} options={{ title: 'Find a Vet' }} />
      <Tabs.Screen name="Pharmacy" component={PharmacyScreen} options={{ title: 'Pharmacy' }} />
      {profile?.role === 'Admin' && (
        <Tabs.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
      )}
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user) return <AuthFlow />;
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="AddPet"
        component={AddPetScreen}
        options={{
          title: 'Add Pet',
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <RootStack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          title: 'Book Appointment',
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <RootStack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ title: 'Consultation', headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
