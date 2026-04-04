import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const TAB_BAR_ACTIVE = '#10B981'
const TAB_BAR_INACTIVE = '#94B4A6'
const TAB_BAR_BG = '#16221E'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_BAR_ACTIVE,
        tabBarInactiveTintColor: TAB_BAR_INACTIVE,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: '#24332D',
        },
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
