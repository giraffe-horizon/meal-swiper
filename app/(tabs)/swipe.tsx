import { View, Text } from 'react-native'

export default function SwipeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B120F',
      }}
    >
      <Text style={{ color: '#ECF3F0', fontSize: 24, fontWeight: '700' }}>Swipe</Text>
      <Text style={{ color: '#94B4A6', fontSize: 16, marginTop: 8 }}>Placeholder — Phase 2</Text>
    </View>
  )
}
