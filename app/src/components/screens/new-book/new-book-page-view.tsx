import { BottomBar, TopBar } from '@/components/app/app-layout'
import { ZoomableImage } from '@/components/app/zoomable-image'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { PageType, useNewBookContext } from '@/context/new-book-context'
import { ensureInterop } from '@/utils/icon-interop'
import { RotateCcw, X } from 'lucide-react-native'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

/**
 * A single page slot inside the paging strip.
 * Reports its zoom level up so the parent can lock/unlock horizontal scroll.
 */
function PageSlot({
  page,
  onZoomChange,
}: {
  page: PageType
  onZoomChange: (zoom: number) => void
}) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <ZoomableImage
        setZoom={onZoomChange}
        source={page.uri}
        className='absolute inset-0'
        imageClassName='w-full h-full'
        cachePolicy='memory'
      />
    </View>
  )
}

export function NewBookPageView() {
  const { pages, currentPageId, setCurrentPageId } = useNewBookContext()

  const currentIndex = pages.findIndex((p) => p.id === currentPageId)
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null
  const currentPage = pages.find((p) => p.id === currentPageId)
  const nextPage =
    currentIndex >= 0 && currentIndex < pages.length - 1
      ? pages[currentIndex + 1]
      : null

  // Track the highest zoom across all visible slots
  const zoomMap = useRef<Record<string, number>>({})
  const [scrollEnabled, setScrollEnabled] = useState(true)

  const updateZoom = useCallback(
    (pageId: string) => (zoom: number) => {
      zoomMap.current[pageId] = zoom
      const anyZoomed = Object.values(zoomMap.current).some((z) => z > 1)
      setScrollEnabled(!anyZoomed)
    },
    [],
  )

  const scrollRef = useRef<ScrollView>(null)
  // Guard against stale native scroll events arriving after a programmatic
  // reposition. Without this, a delayed onMomentumScrollEnd from the original
  // swipe can land after the re-render with the NEW slot array, mapping the
  // old offset to the wrong page and causing a double page-turn.
  const isResetting = useRef(false)

  // Whenever the current page changes, snap back to the centre slot so the
  // strip always shows prev + current + next relative to the new page.
  useLayoutEffect(() => {
    isResetting.current = true
    const centerOffset = previousPage ? SCREEN_WIDTH : 0
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false })
    // Allow scroll events again after any queued native events have drained.
    const timer = setTimeout(() => {
      isResetting.current = false
    }, 150)
    return () => clearTimeout(timer)
  }, [currentPageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isResetting.current) return

      const offsetX = e.nativeEvent.contentOffset.x
      const slotIndex = Math.round(offsetX / SCREEN_WIDTH)

      // Build the ordered slot array the same way we do in JSX
      const slots = [previousPage, currentPage, nextPage].filter(
        Boolean,
      ) as PageType[]

      const tappedPage = slots[slotIndex]
      if (tappedPage && tappedPage.id !== currentPageId) {
        // Clear zoom map so new neighbours don't inherit stale zoom
        zoomMap.current = {}
        setScrollEnabled(true)
        setCurrentPageId(tappedPage.id)
      }
    },
    [previousPage, currentPage, nextPage, currentPageId, setCurrentPageId],
  )

  if (!currentPage) return null

  const slots = [previousPage, currentPage, nextPage].filter(
    Boolean,
  ) as PageType[]

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      scrollEnabled={scrollEnabled}
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onScrollEnd}
      // Prevent the ScrollView's own pan from competing with ZoomableImage's pan
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {slots.map((page) => (
        <PageSlot
          key={page.id}
          page={page}
          onZoomChange={updateZoom(page.id)}
        />
      ))}
    </ScrollView>
  )
}

export function NewBookPageBottomBar() {
  const previousPage = () => {}

  const nextPage = () => {}

  return (
    <BottomBar>
      <View className='px-4 pt-4 pb-2 flex-row items-center justify-center'>
        <DefaultPressable
          text='Retake'
          className='flex-1'
          variant='warning'
          onPress={previousPage}
          Icon={RotateCcw}
        />
      </View>
    </BottomBar>
  )
}

export function NewBookPageTopBar() {
  const { pages, currentPageId } = useNewBookContext()
  const currentIndex = pages.findIndex((p) => p.id === currentPageId)

  return (
    <TopBar title={`Page ${currentIndex + 1} of ${pages.length}`}>
      <Pressable
        className='flex-row gap-1 items-center'
        onPress={() => {}}
      >
        <GoogleSansText
          variant='bold'
          className='text-red-500 text-lg'
        >
          Remove
        </GoogleSansText>
        <View className='size-4 items-center justify-center'>
          <X className='text-red-500 size-4' />
        </View>
      </Pressable>
    </TopBar>
  )
}

ensureInterop([RotateCcw, X])
