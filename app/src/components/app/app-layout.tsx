import { PropsWithChildren } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const BOTTOM_GRADIENT_HEIGHT = 0

export function SafeScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className='relative flex-1 bg-bg-primary'
      style={{
        paddingTop: insets.top,
      }}
    >
      {children}
    </View>
  )
}

export function BottomBar({ children }: PropsWithChildren) {
  const height = useBottomBarHeight()

  return (
    <View
      style={{
        height: height,
      }}
    >
      {children}
    </View>
  )
}

export function useBottomBarHeight() {
  const insets = useSafeAreaInsets()
  return insets.bottom + BOTTOM_GRADIENT_HEIGHT
}
