import { BottomBar, TopBar } from '@/components/app/app-layout'
import { ZoomableImage } from '@/components/app/zoomable-image'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import {
  PageType,
  PageViewModeType,
  useNewBookContext,
} from '@/context/new-book-context'
import { ensureInterop } from '@/utils/icon-interop'
import { Image as ImageIcon, TextInitial, Trash } from 'lucide-react-native'
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

function PageSlot({
  page,
  onZoomChange,
  mode,
}: {
  page: PageType
  onZoomChange: (zoom: number) => void
  mode: PageViewModeType
}) {
  return (
    <View
      className='flex-1'
      style={{ width: SCREEN_WIDTH }}
    >
      {mode === 'image' ? (
        <View className='px-4 flex-1 overflow-hidden'>
          <View className='w-full h-full relative rounded-xl overflow-hidden bg-bg-secondary'>
            <ZoomableImage
              setZoom={onZoomChange}
              source={page.uri}
              className='absolute inset-0'
              imageClassName='w-full h-full rounded-lg'
            />
          </View>
        </View>
      ) : (
        <View className='absolute inset-0 px-4'>
          <ScrollView
            className='flex-1  bg-bg-secondary rounded-xl'
            showsVerticalScrollIndicator={false}
          >
            <View className='p-4'>
              <GoogleSansText className='text-lg'>{page.text}</GoogleSansText>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

export function NewBookPageView() {
  const { pages, currentPageId, setCurrentPageId, pageViewMode } =
    useNewBookContext()

  const currentIndex = pages.findIndex((p) => p.id === currentPageId)
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null
  const currentPage = pages.find((p) => p.id === currentPageId)
  const nextPage =
    currentIndex >= 0 && currentIndex < pages.length - 1
      ? pages[currentIndex + 1]
      : null

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
  const isResetting = useRef(false)

  useLayoutEffect(() => {
    isResetting.current = true
    const centerOffset = previousPage ? SCREEN_WIDTH : 0
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false })
    const timer = setTimeout(() => {
      isResetting.current = false
    }, 150)
    return () => clearTimeout(timer)
  }, [currentPageId])

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isResetting.current) return

      const offsetX = e.nativeEvent.contentOffset.x
      const slotIndex = Math.round(offsetX / SCREEN_WIDTH)

      const slots = [previousPage, currentPage, nextPage].filter(
        Boolean,
      ) as PageType[]

      const tappedPage = slots[slotIndex]
      if (tappedPage && tappedPage.id !== currentPageId) {
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
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {slots.map((page) => (
        <PageSlot
          mode={pageViewMode}
          key={page.id}
          page={page}
          onZoomChange={updateZoom(page.id)}
        />
      ))}
    </ScrollView>
  )
}

export function NewBookPageBottomBar() {
  const { pageViewMode, setPageViewMode } = useNewBookContext()

  const changeMode = () => {
    setPageViewMode(pageViewMode === 'image' ? 'text' : 'image')
  }

  const Icon = pageViewMode === 'image' ? TextInitial : ImageIcon
  const text =
    pageViewMode === 'image' ? 'Switch to text mode' : 'Switch to image mode'

  return (
    <BottomBar>
      <View className='px-4 pt-4 flex-row items-center justify-center'>
        <DefaultPressable
          text={text}
          className='flex-1'
          variant='primary'
          onPress={changeMode}
          Icon={Icon}
        />
      </View>
    </BottomBar>
  )
}

export function NewBookPageTopBar() {
  const { pages, currentPageId, setCurrentPageId, setPages } =
    useNewBookContext()
  const currentIndex = pages.findIndex((p) => p.id === currentPageId)

  const deletePage = () => {
    if (pages.length <= 1) return
    const newPages = pages.filter((p) => p.id !== currentPageId)
    setPages(newPages)
    setCurrentPageId(newPages[currentIndex - 1].id)
  }

  return (
    <TopBar title={`Page ${currentIndex + 1} of ${pages.length}`}>
      <Pressable
        className='flex-row gap-1 items-center'
        onPress={deletePage}
        disabled={pages.length <= 1}
      >
        <View className='flex-row gap-1 items-center'>
          <GoogleSansText
            variant='bold'
            className='text-red-400 text-lg'
          >
            Delete
          </GoogleSansText>
          <Trash className='text-red-400 size-4' />
        </View>
      </Pressable>
    </TopBar>
  )
}

ensureInterop([TextInitial, ImageIcon, Trash])
