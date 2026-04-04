import { View, Text } from 'react-native'

interface SectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function Section({ title, children, className = '' }: SectionProps) {
  return (
    <View className={`mb-6 ${className}`}>
      <Text
        className="text-[#dde4df] text-lg font-bold mb-3"
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  )
}
