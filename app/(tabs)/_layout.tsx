import { View, Text, Pressable } from 'react-native'
import { Tabs } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ACTIVE_COLOR = '#69dd96' // primary
const INACTIVE_COLOR = 'rgba(236, 243, 240, 0.4)'

type TabConfig = {
  name: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
  iconActive: keyof typeof Ionicons.glyphMap
}

const TABS: TabConfig[] = [
  { name: 'swipe', title: 'Swipe', icon: 'heart-outline', iconActive: 'heart' },
  { name: 'plan', title: 'Plan', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'shopping', title: 'Lista', icon: 'cart-outline', iconActive: 'cart' },
  { name: 'settings', title: 'Ustawienia', icon: 'settings-outline', iconActive: 'settings' },
]

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="absolute bottom-0 left-0 right-0 px-4"
    >
      <BlurView
        intensity={40}
        tint="dark"
        className="flex-row items-center justify-around rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(26, 33, 30, 0.8)' }}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const tabConfig = TABS.find((t) => t.name === route.name)
          if (!tabConfig) return null

          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          function onLongPress() {
            navigation.emit({ type: 'tabLongPress', target: route.key })
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center py-3"
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? tabConfig.title}
            >
              <Ionicons
                name={isFocused ? tabConfig.iconActive : tabConfig.icon}
                size={22}
                color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <Text
                className="text-[10px] mt-1"
                style={{ color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {tabConfig.title}
              </Text>
              {isFocused && (
                <View className="w-1 h-1 rounded-full bg-primary mt-1" />
              )}
            </Pressable>
          )
        })}
      </BlurView>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { paddingBottom: 90 } }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Disable iOS swipe-back on Swipe tab to avoid gesture conflict with card swipe
            ...(tab.name === 'swipe' ? { gestureEnabled: false } : {}),
          }}
        />
      ))}
    </Tabs>
  )
}
