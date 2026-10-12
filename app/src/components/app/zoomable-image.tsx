import { Image, ImageProps } from 'expo-image'
import { cssInterop } from 'nativewind'
import { LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

// Teach NativeWind how to map `className` -> `style` on expo-image
const StyledImage = cssInterop(Image, { className: 'style' })

type Props = Omit<ImageProps, 'style'> & {
  /** NativeWind classes for the outer (clipping) container */
  className?: string
  /** NativeWind classes for the image itself */
  imageClassName?: string
  maxScale?: number
  doubleTapScale?: number
}

export function ZoomableImage({
  className,
  imageClassName,
  maxScale = 5,
  doubleTapScale = 2.5,
  contentFit = 'contain',
  ...imageProps
}: Props) {
  const width = useSharedValue(0)
  const height = useSharedValue(0)

  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)
  const savedTx = useSharedValue(0)
  const savedTy = useSharedValue(0)
  const startFx = useSharedValue(0)
  const startFy = useSharedValue(0)
  const pinching = useSharedValue(false)
  const lastPanX = useSharedValue(0)
  const lastPanY = useSharedValue(0)

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width
    height.value = e.nativeEvent.layout.height
  }

  // Keep the image from being panned past its edges
  const clampX = (x: number, s: number) => {
    'worklet'
    const max = Math.max(0, (width.value * (s - 1)) / 2)
    return clamp(x, -max, max)
  }
  const clampY = (y: number, s: number) => {
    'worklet'
    const max = Math.max(0, (height.value * (s - 1)) / 2)
    return clamp(y, -max, max)
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      pinching.value = true
      savedScale.value = scale.value
      savedTx.value = tx.value
      savedTy.value = ty.value
      // Focal point at pinch start, relative to the container's center
      startFx.value = e.focalX - width.value / 2
      startFy.value = e.focalY - height.value / 2
    })
    // When the first finger lifts, the focal point suddenly jumps to the
    // remaining finger. Stop applying pinch updates the moment that happens.
    .onTouchesUp(() => {
      pinching.value = false
    })
    .onUpdate((e) => {
      if (!pinching.value) return
      // Allow slight overshoot below 1 for a rubber-band feel
      const s = clamp(savedScale.value * e.scale, 0.8, maxScale)

      // Current focal point, relative to the container's center
      const fx = e.focalX - width.value / 2
      const fy = e.focalY - height.value / 2

      // Keep the content point that was under the fingers at pinch start
      // under the current focal point (so two-finger drags pan too).
      const ratio = s / savedScale.value
      scale.value = s
      tx.value = clampX(fx - ratio * (startFx.value - savedTx.value), s)
      ty.value = clampY(fy - ratio * (startFy.value - savedTy.value), s)
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1)
        tx.value = withTiming(0)
        ty.value = withTiming(0)
      }
      savedScale.value = Math.max(scale.value, 1)
      savedTx.value = tx.value
      savedTy.value = ty.value
    })

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1) // two-finger movement is handled by the pinch's focal point
    .onStart((e) => {
      // Snapshot the image position and the finger translation at activation.
      // The position below is computed from these snapshots (not accumulated
      // frame by frame), so it always tracks the finger 1:1.
      savedTx.value = tx.value
      savedTy.value = ty.value
      lastPanX.value = e.translationX
      lastPanY.value = e.translationY
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return
      tx.value = clampX(
        savedTx.value + (e.translationX - lastPanX.value),
        scale.value,
      )
      ty.value = clampY(
        savedTy.value + (e.translationY - lastPanY.value),
        scale.value,
      )
    })
    .onEnd(() => {
      savedTx.value = tx.value
      savedTy.value = ty.value
    })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withTiming(1)
        tx.value = withTiming(0)
        ty.value = withTiming(0)
        savedScale.value = 1
        savedTx.value = 0
        savedTy.value = 0
      } else {
        // Zoom in, keeping the tapped point under the finger
        const s = doubleTapScale
        const nx = clampX((width.value / 2 - e.x) * (s - 1), s)
        const ny = clampY((height.value / 2 - e.y) * (s - 1), s)
        scale.value = withTiming(s)
        tx.value = withTiming(nx)
        ty.value = withTiming(ny)
        savedScale.value = s
        savedTx.value = nx
        savedTy.value = ny
      }
    })

  const gesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan))

  // Only the dynamic transform lives in `style`; everything else is className
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        className={`flex-1 overflow-hidden ${className ?? ''}`}
        onLayout={onLayout}
      >
        <Animated.View
          className='absolute inset-0'
          style={animatedStyle}
        >
          <StyledImage
            {...imageProps}
            contentFit={contentFit}
            className={`absolute inset-0 ${imageClassName ?? ''}`}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}
