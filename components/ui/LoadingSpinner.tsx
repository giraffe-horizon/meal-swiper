import { View, ActivityIndicator } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  className?: string
}

export default function LoadingSpinner({ size = 'large', className = '' }: LoadingSpinnerProps) {
  return (
    <View
      className={`flex-1 justify-center items-center ${className}`}
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie"
    >
      <ActivityIndicator size={size} color="#69dd96" />
    </View>
  )
}
