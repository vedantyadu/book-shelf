import { BRAND_PRIMARY_COLOR, DARK_ICON_COLOR } from '@/utils/themes'
import { Pressable } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  value: boolean
  onValueChange: (value: boolean) => void
  width?: number
  height?: number
  trackColors?: { off: string; on: string }
  thumbColor?: string
}

export function ToggleSwitch({
  value,
  onValueChange,
  width = 40,
  height = 24,
  trackColors = { off: DARK_ICON_COLOR, on: BRAND_PRIMARY_COLOR },
  thumbColor = '#fff',
}: Props) {
  const padding = 3
  const thumbSize = height - padding * 2
  const travel = width - thumbSize - padding * 2

  const progress = useDerivedValue(() =>
    withTiming(value ? 1 : 0, { duration: 200 }),
  )

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [trackColors.off, trackColors.on],
    ),
  }))

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }))

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: height / 2,
            padding,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: thumbColor,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}
