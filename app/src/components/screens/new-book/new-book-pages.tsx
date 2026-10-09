import { CircleActivityIndicator } from '@/components/app/activity-indicator'
import TextAlert from '@/components/app/alert'
import { BottomBar, TopBar } from '@/components/app/app-layout'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { Separator } from '@/components/ui/separator'
import { PageType, useNewBookContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  ArrowRight,
  BookOpenCheck,
  Ghost,
  ScanText,
  Square,
  SquareCheck,
  WavesHorizontal,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutRectangle,
  PanResponder,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  extractText,
  scanPage,
} from '../../../../modules/page-scan-module/src/PageScanModule'

function reorderPages(
  allPages: PageType[],
  selectedIds: string[],
  targetSlot: number,
): PageType[] {
  const selectedSet = new Set(selectedIds)
  const selectedItems = allPages.filter((p) => selectedSet.has(p.id))
  if (selectedItems.length === 0) return allPages

  let unselectedTargetIndex = 0
  for (let i = 0; i < targetSlot && i < allPages.length; i++) {
    if (!selectedSet.has(allPages[i].id)) {
      unselectedTargetIndex++
    }
  }

  const unselectedItems = allPages.filter((p) => !selectedSet.has(p.id))
  return [
    ...unselectedItems.slice(0, unselectedTargetIndex),
    ...selectedItems,
    ...unselectedItems.slice(unselectedTargetIndex),
  ]
}

function DropIndicatorBar() {
  return <Separator className='bg-brand-primary' />
}

function ScanPagesPressable() {
  const { pages, setPages } = useNewBookContext()

  const openPageScanner = async () => {
    const scanResult = await scanPage()
    if (!scanResult || !scanResult.pages.length) return

    const newPages: PageType[] = scanResult.pages.map(
      (uri: string, index: number) => ({
        id: `${index}`,
        uri: uri,
        text: null,
        state: 'processing',
      }),
    )

    setPages((prev) => [...prev, ...newPages])
    processImages(newPages)
  }

  const processImages = async (pagesToProcess: PageType[]) => {
    for (const page of pagesToProcess) {
      try {
        const textResult = await extractText(page.uri)

        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  text: textResult?.text ?? '',
                  state: 'ready',
                }
              : p,
          ),
        )
      } catch (err) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  state: 'error',
                }
              : p,
          ),
        )
      }
    }
  }

  const text = pages.length === 0 ? 'Scan pages' : 'Scan more pages'

  return (
    <DefaultPressable
      className='flex-1'
      text={text}
      variant='brand'
      onPress={openPageScanner}
      Icon={ScanText}
    />
  )
}

export function ScanPagesBottomBar() {
  const { selectedPages, setSelectedPages } = useNewBookContext()
  const isSelecting = selectedPages.length > 0

  if (isSelecting) {
    return (
      <BottomBar>
        <View className='px-4 pt-4 pb-2'>
          <DefaultPressable
            text='Deselect'
            variant='primary'
            Icon={WavesHorizontal}
            onPress={() => setSelectedPages([])}
          />
        </View>
      </BottomBar>
    )
  }

  return (
    <BottomBar>
      <View className='flex-row gap-2 px-4 pt-4 pb-2'>
        <ScanPagesPressable />
      </View>
    </BottomBar>
  )
}

export function AddPagesTopBar() {
  const { pages, selectedPages } = useNewBookContext()

  const done = () => {
    router.back()
  }

  const isSelecting = selectedPages.length > 0
  const pageLabel = pages.length === 1 ? 'Page' : 'Pages'
  const title = isSelecting
    ? `${selectedPages.length} selected`
    : `${pages.length} ${pageLabel}`

  return (
    <TopBar
      title={title}
      showBackButton={false}
    >
      {!isSelecting && (
        <Pressable onPress={done}>
          <GoogleSansText
            variant='bold'
            className='text-brand-primary text-lg'
          >
            Done
          </GoogleSansText>
        </Pressable>
      )}
    </TopBar>
  )
}

export function PageList() {
  const { pages, setPages, selectedPages, setSelectedPages } =
    useNewBookContext()
  const [dropSlot, setDropSlot] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef<View>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollYRef = useRef(0)
  const containerTopRef = useRef(0)
  const itemLayoutsRef = useRef<{
    [index: number]: { y: number; height: number }
  }>({})
  const frozenLayoutsRef = useRef<{ y: number; height: number }[]>([])

  const isDraggingRef = useRef(false)
  const dropSlotRef = useRef<number | null>(null)
  const selectedPagesRef = useRef<string[]>([])
  const pagesRef = useRef<PageType[]>([])

  selectedPagesRef.current = selectedPages
  pagesRef.current = pages
  dropSlotRef.current = dropSlot

  const { height: windowHeight } = useWindowDimensions()

  const updateContainerLayout = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y) => {
      if (typeof y === 'number' && y > 0) {
        containerTopRef.current = y
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateContainerLayout()
    }, 100)
    return () => clearTimeout(timer)
  }, [updateContainerLayout])

  const calculateDropSlot = useCallback((pageY: number) => {
    const layouts = frozenLayoutsRef.current
    const total = pagesRef.current.length
    if (total === 0 || layouts.length === 0) return

    const scrollY = scrollYRef.current
    const containerTop = containerTopRef.current
    const contentY = pageY - containerTop + scrollY

    const first = layouts[0]
    if (first && contentY < first.y + first.height / 2) {
      setDropSlot(0)
      return
    }

    const last = layouts[total - 1]
    if (last && contentY >= last.y + last.height / 2) {
      setDropSlot(total)
      return
    }

    for (let i = 0; i < total - 1; i++) {
      const cur = layouts[i]
      const next = layouts[i + 1]
      if (cur && next) {
        const curMid = cur.y + cur.height / 2
        const nextMid = next.y + next.height / 2
        if (contentY >= curMid && contentY < nextMid) {
          setDropSlot(i + 1)
          return
        }
      }
    }

    setDropSlot(total)
  }, [])

  const onDragStart = useCallback(
    (pageId: string, pageY: number) => {
      isDraggingRef.current = true
      setIsDragging(true)

      const layouts: { y: number; height: number }[] = []
      for (let i = 0; i < pagesRef.current.length; i++) {
        layouts.push(itemLayoutsRef.current[i] ?? { y: i * 90, height: 90 })
      }
      frozenLayoutsRef.current = layouts

      const touchedIndex = pagesRef.current.findIndex((p) => p.id === pageId)
      if (
        containerTopRef.current === 0 &&
        touchedIndex !== -1 &&
        layouts[touchedIndex]
      ) {
        containerTopRef.current =
          pageY +
          scrollYRef.current -
          (layouts[touchedIndex].y + layouts[touchedIndex].height / 2)
      }

      updateContainerLayout()

      setSelectedPages((prev) => {
        if (prev.length === 0) {
          return [pageId]
        }
        if (!prev.includes(pageId)) {
          return [...prev, pageId]
        }
        return prev
      })

      calculateDropSlot(pageY)
    },
    [calculateDropSlot, setSelectedPages, updateContainerLayout],
  )

  const onDragMove = useCallback(
    (pageY: number) => {
      calculateDropSlot(pageY)

      const topMargin = 130
      const bottomMargin = windowHeight - 120

      if (pageY < topMargin && scrollYRef.current > 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollYRef.current - 14),
          animated: false,
        })
      } else if (pageY > bottomMargin) {
        scrollViewRef.current?.scrollTo({
          y: scrollYRef.current + 14,
          animated: false,
        })
      }
    },
    [calculateDropSlot, windowHeight],
  )

  const onDragEnd = useCallback(() => {
    if (isDraggingRef.current && dropSlotRef.current !== null) {
      const targetSlot = dropSlotRef.current
      const currentSelected = selectedPagesRef.current
      setPages((prev) => reorderPages(prev, currentSelected, targetSlot))
    }

    isDraggingRef.current = false
    setIsDragging(false)
    setDropSlot(null)
    dropSlotRef.current = null
  }, [setPages])

  const onTap = useCallback(
    (pageId: string) => {
      if (selectedPagesRef.current.length > 0) {
        setSelectedPages((prev) =>
          prev.includes(pageId)
            ? prev.filter((id) => id !== pageId)
            : [...prev, pageId],
        )
      }
    },
    [setSelectedPages],
  )

  const onItemLayout = useCallback((index: number, layout: LayoutRectangle) => {
    itemLayoutsRef.current[index] = { y: layout.y, height: layout.height }
  }, [])

  if (pages.length === 0) {
    return (
      <View className='flex-1 items-center justify-center'>
        <EmptyPageList />
      </View>
    )
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      className='flex-1'
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isDragging}
      onScroll={(e) => {
        scrollYRef.current = e.nativeEvent.contentOffset.y
      }}
      scrollEventThrottle={16}
    >
      <View
        ref={containerRef}
        className='px-4 flex-1 gap-2 pb-6'
        onLayout={updateContainerLayout}
      >
        {isDragging && dropSlot === 0 && <DropIndicatorBar />}
        {pages.map((page, i) => (
          <View
            key={page.id}
            onLayout={(e) => onItemLayout(i, e.nativeEvent.layout)}
            className='gap-2'
          >
            <PageItem
              page={page}
              pageNumber={i}
              isDragging={isDragging}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onTap={onTap}
            />
            {isDragging && dropSlot === i + 1 && <DropIndicatorBar />}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function EmptyPageList() {
  return (
    <View className='flex-1 gap-4 items-center justify-center'>
      <View className='items-center justify-center size-12'>
        <Ghost className='text-icon size-12' />
      </View>
      <GoogleSansText className='text-icon'>
        No pages scanned yet.
      </GoogleSansText>
    </View>
  )
}

function PageItem({
  page,
  pageNumber,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTap,
}: {
  page: PageType
  pageNumber: number
  isDragging: boolean
  onDragStart: (pageId: string, pageY: number) => void
  onDragMove: (pageY: number) => void
  onDragEnd: () => void
  onTap: (pageId: string) => void
}) {
  const { selectedPages } = useNewBookContext()
  const isSelected = selectedPages.includes(page.id)
  const isSelectionMode = selectedPages.length > 0

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingLocalRef = useRef(false)
  const touchStartPosRef = useRef({ x: 0, y: 0 })

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => isDraggingLocalRef.current,
        onPanResponderTerminationRequest: () => !isDraggingLocalRef.current,

        onPanResponderGrant: (evt) => {
          const startPageY = evt.nativeEvent.pageY
          touchStartPosRef.current = {
            x: evt.nativeEvent.pageX,
            y: startPageY,
          }
          isDraggingLocalRef.current = false

          longPressTimerRef.current = setTimeout(() => {
            isDraggingLocalRef.current = true
            onDragStart(page.id, startPageY)
          }, 250)
        },

        onPanResponderMove: (evt, gestureState) => {
          const dist = Math.hypot(gestureState.dx, gestureState.dy)

          if (!isDraggingLocalRef.current && dist > 8) {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current)
              longPressTimerRef.current = null
            }
            return
          }

          if (isDraggingLocalRef.current) {
            onDragMove(evt.nativeEvent.pageY)
          }
        },

        onPanResponderRelease: (evt, gestureState) => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
          }

          if (isDraggingLocalRef.current) {
            isDraggingLocalRef.current = false
            onDragEnd()
          } else {
            const dist = Math.hypot(gestureState.dx, gestureState.dy)
            if (dist <= 8) {
              onTap(page.id)
            }
          }
        },

        onPanResponderTerminate: () => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
          }
          if (isDraggingLocalRef.current) {
            isDraggingLocalRef.current = false
            onDragEnd()
          }
        },
      }),
    [page.id, onDragStart, onDragMove, onDragEnd, onTap],
  )

  const Description = () => {
    switch (page.state) {
      case 'processing':
        return (
          <View className='flex-row gap-2 items-center'>
            <CircleActivityIndicator
              iconSize={12}
              strokeWidth={2}
            />
            <GoogleSansText className='text-xs text-text-secondary'>
              Extracting text
            </GoogleSansText>
          </View>
        )
      case 'ready':
        return (
          <GoogleSansText
            className='text-xs text-text-secondary'
            numberOfLines={1}
            style={{
              includeFontPadding: false,
            }}
          >
            {page.text}
          </GoogleSansText>
        )
      case 'error':
        return (
          <TextAlert
            variant='default'
            textSize='xs'
            text='Failed to extract text from this page.'
          />
        )
    }
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        opacity: isDragging && isSelected ? 0.6 : 1,
      }}
    >
      <PageSection isSelected={isSelected}>
        <View className='flex-row gap-4 items-center'>
          {isSelectionMode && (
            <View className='size-5 items-center justify-center'>
              {isSelected ? (
                <SquareCheck className='text-brand-primary size-5' />
              ) : (
                <Square className='text-icon size-5' />
              )}
            </View>
          )}
          <View className='rounded-xl overflow-hidden'>
            <Image
              source={{
                uri: page.uri,
              }}
              contentFit='cover'
              style={{ width: 64, height: 64 }}
            />
          </View>
          <View className={`flex-1 gap-1 ${isSelectionMode ? '' : 'pr-4'}`}>
            <GoogleSansText
              variant='medium'
              className='text-text-secondary text-sm'
            >
              Page {pageNumber + 1}
            </GoogleSansText>

            <Description />
            <GoogleSansText
              className='text-xs text-icon'
              style={{
                includeFontPadding: false,
              }}
              numberOfLines={1}
            >
              Scanned as {page.id}
            </GoogleSansText>
          </View>
          {!isSelectionMode && <ArrowRight className='text-icon' />}
        </View>
      </PageSection>
    </View>
  )
}

function PageSection({
  isSelected,
  children,
}: {
  isSelected?: boolean
  children: React.ReactNode
}) {
  return (
    <View
      className={`rounded-xl p-4 bg-bg-secondary gap-2 border ${
        isSelected ? 'border-brand-primary/60' : 'border-transparent'
      }`}
    >
      {children}
    </View>
  )
}

ensureInterop([
  ScanText,
  Ghost,
  ArrowRight,
  BookOpenCheck,
  Square,
  SquareCheck,
  WavesHorizontal,
])
