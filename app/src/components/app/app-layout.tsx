import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PropsWithChildren } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GoogleSansText } from '../ui/fonts'

const BOTTOM_GRADIENT_HEIGHT = 0

export function SafeScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return <View className='relative flex-1 bg-bg-primary'>{children}</View>
}

export function BottomBar({ children }: PropsWithChildren) {
  const height = useBottomBarHeight()

  return (
    <View
      className='bg-bg-primary'
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

export function TopBar({ title }: { title: string }) {
  const inset = useSafeAreaInsets()

  const goBack = () => {
    router.back()
  }

  return (
    <View
      className='bg-bg-primary justify-end pb-3'
      style={{
        height: inset.top + 44,
      }}
    >
      <View className='flex-row items-center gap-4 px-4'>
        <View className='items-center justify-center size-6'>
          <Pressable
            className='size-6'
            onPress={goBack}
          >
            <ArrowLeft className='text-text-secondary size-6' />
          </Pressable>
        </View>
        <GoogleSansText
          variant='semi-bold'
          className='text-2xl'
        >
          {title}
        </GoogleSansText>
      </View>
    </View>
  )
}

ensureInterop([ArrowLeft])
