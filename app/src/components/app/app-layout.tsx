import { ensureInterop } from '@/utils/icon-interop'
import { DARK_BG_PRIMARY_COLOR, LIGHT_BG_PRIMARY_COLOR } from '@/utils/themes'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { PropsWithChildren } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GoogleSansText } from '../ui/fonts'

export function SafeScreen({
  children,
  topPadding,
}: PropsWithChildren & { topPadding?: boolean }) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className='relative flex-1 bg-bg-primary'
      style={{ paddingTop: topPadding ? insets.top : 0 }}
    >
      {children}
    </View>
  )
}

export function BottomBar({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className='bg-bg-primary'
      style={{
        paddingBottom: insets.bottom,
      }}
    >
      {children}
    </View>
  )
}

export function BottomBarGradient({
  children,
  height,
  setHeight,
}: PropsWithChildren & {
  height: number
  setHeight: (height: number) => void
}) {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const bgColor = isDark ? DARK_BG_PRIMARY_COLOR : LIGHT_BG_PRIMARY_COLOR
  const centerColor = isDark
    ? DARK_BG_PRIMARY_COLOR.slice(0, -2) + '80'
    : LIGHT_BG_PRIMARY_COLOR.slice(0, -2) + '80'
  const transparentBg = isDark
    ? DARK_BG_PRIMARY_COLOR.slice(0, -2) + '00'
    : LIGHT_BG_PRIMARY_COLOR.slice(0, -2) + '00'

  return (
    <View
      onLayout={(e) => {
        const layoutHeight = e.nativeEvent.layout.height
        if (layoutHeight !== height) {
          setHeight(layoutHeight)
        }
      }}
      style={{
        paddingBottom: insets.bottom,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <LinearGradient
        colors={[transparentBg, centerColor, bgColor]}
        locations={[0, 0.2, 0.5]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height,
        }}
      />
      {children}
    </View>
  )
}

export function TopBar({
  title,
  children,
  showBackButton = true,
}: {
  title: string
  children?: React.ReactNode
  showBackButton?: boolean
}) {
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
      <View className='flex-row items-center justify-between gap-4 px-4'>
        <View className='flex-row items-center gap-4'>
          {showBackButton && (
            <View className='items-center justify-center size-6'>
              <Pressable
                className='size-6'
                onPress={goBack}
              >
                <ArrowLeft className='text-text-secondary size-6' />
              </Pressable>
            </View>
          )}
          <GoogleSansText
            variant='semi-bold'
            className='text-2xl'
          >
            {title}
          </GoogleSansText>
        </View>
        {children}
      </View>
    </View>
  )
}

ensureInterop([ArrowLeft])
