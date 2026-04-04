import { View, type ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface-container rounded-2xl p-4 shadow-sm shadow-black/20 ${className}`}
      {...props}
    >
      {children}
    </View>
  )
}
