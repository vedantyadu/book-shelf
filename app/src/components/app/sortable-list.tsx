/**
 * SelectableSortableList
 * ----------------------
 * Spotify-playlist style list for Expo / React Native.
 *
 *  • Long-press a row  -> it becomes selected (and can be dragged right away).
 *  • Tap other rows    -> toggle them in / out of the selection.
 *  • Long-press + drag any selected row -> the WHOLE selection moves together.
 *    Selected rows keep their relative order and are inserted at the drop slot.
 *  • Auto-scrolls when you drag near the top / bottom edge.
 *
 * Rows are your own components (`renderItem`) and may have DIFFERENT heights:
 *  • Omit `itemHeight`  -> rows are measured with onLayout (set `estimatedItemHeight`
 *                          close to the typical height for the best first paint).
 *  • `itemHeight={68}`  -> every row is exactly 68px.
 *  • `itemHeight={(item) => ...}` -> you know each row's height up front (no measuring).
 *
 * Styled with NativeWind v4 (`className`).
 *
 * Requires: nativewind, react-native-gesture-handler, react-native-reanimated
 *   npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets
 * and your app must be wrapped in <GestureHandlerRootView style={{ flex: 1 }}>.
 */
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  SharedValue,
  runOnJS,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { GoogleSansText } from '../ui/fonts'

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export type RowInfo = {
  index: number
  /** This row is part of the current selection. */
  isSelected: boolean
  /** At least one row is selected (show checkboxes / drag handles). */
  selectionMode: boolean
  selectedCount: number
}

export type SelectableSortableListProps<T> = {
  data: T[]
  keyExtractor: (item: T, index: number) => string
  /** Your component for a row. */
  renderItem: (item: T, info: RowInfo) => React.ReactElement
  /** Called on drop with the full, re-ordered data. Update your state with it. */
  onReorder: (next: T[]) => void

  /**
   * Row height. Omit to measure rows automatically (variable heights).
   * Pass a number for uniform rows, or a function if you know each row's height.
   */
  itemHeight?: number | ((item: T, index: number) => number)
  /** Height assumed for rows that haven't been measured yet. Default 64. */
  estimatedItemHeight?: number

  /** Optional controlled selection. Omit to let the list manage it. */
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** Tap on a row while nothing is selected (e.g. "play this track"). */
  onItemPress?: (item: T, index: number) => void

  ListHeaderComponent?: React.ReactElement | null
  ListFooterComponent?: React.ReactElement | null
  /** NativeWind classes for the scroll view, e.g. "flex-1 bg-black". */
  className?: string
  /** Extra space under the last row (e.g. for a mini player). */
  bottomInset?: number
  /** Hold time to start selecting / dragging when NOTHING is selected. Default 450ms. */
  longPressMs?: number
  /** Hold time to start dragging once selection mode is on (shorter). Default 180ms. */
  selectionLongPressMs?: number
  /** iOS rubber-band / Android overscroll at the ends of the list. Default false. */
  bounces?: boolean

  /**
   * Fully custom selection indicator shown on the dragged row. Receives the number of
   * selected items. Return null to hide it. Replaces the default pill.
   */
  renderSelectionBadge?: (count: number) => React.ReactElement | null
  /** NativeWind classes that position the indicator on the row. */
  badgeContainerClassName?: string
  /** NativeWind classes for the DEFAULT pill (ignored with renderSelectionBadge). */
  badgeClassName?: string
}

/* ------------------------------------------------------------------ */
/* Worklet helpers                                                     */
/* ------------------------------------------------------------------ */

type Heights = Record<string, number>

function hOf(hs: Heights, id: string, est: number) {
  'worklet'
  const v = hs[id]
  return v === undefined ? est : v
}

/** Selected ids (in their relative order) are inserted after `slot` unselected ids. */
function buildOrder(
  order: string[],
  sel: Record<string, boolean>,
  slot: number,
): string[] {
  'worklet'
  const group: string[] = []
  const rest: string[] = []
  for (let i = 0; i < order.length; i++) {
    const id = order[i]
    if (sel[id]) group.push(id)
    else rest.push(id)
  }
  return [...rest.slice(0, slot), ...group, ...rest.slice(slot)]
}

/**
 * Which gap between the UNSELECTED rows should the group go into, given where the
 * dragged row's top edge is? Picks the boundary closest to the group's top edge.
 */
function slotFor(
  order: string[],
  sel: Record<string, boolean>,
  hs: Heights,
  est: number,
  dragTopY: number,
  groupOffset: number,
): number {
  'worklet'
  const desired = dragTopY - groupOffset
  let acc = 0
  let count = 0
  let bestT = 0
  let bestD = Math.abs(desired)
  for (let i = 0; i < order.length; i++) {
    const id = order[i]
    if (sel[id]) continue
    acc += hOf(hs, id, est)
    count++
    const d = Math.abs(acc - desired)
    if (d < bestD) {
      bestD = d
      bestT = count
    }
  }
  return bestT
}

function clamp(v: number, lo: number, hi: number) {
  'worklet'
  return Math.min(Math.max(v, lo), hi)
}

const EDGE = 90 // px from viewport edge where auto-scroll starts
const MAX_SCROLL_SPEED = 900 // px / second

/* ------------------------------------------------------------------ */
/* Shared context passed to each row                                   */
/* ------------------------------------------------------------------ */

type Ctx = {
  est: number
  badgeContainerClassName: string
  heights: SharedValue<Heights>
  orderIds: SharedValue<string[]>
  selectedMap: SharedValue<Record<string, boolean>>
  tops: SharedValue<Record<string, number>>
  isDragging: SharedValue<boolean>
  activeId: SharedValue<string>
  activeH: SharedValue<number>
  startTop: SharedValue<number>
  startScroll: SharedValue<number>
  translation: SharedValue<number>
  dragTop: SharedValue<number>
  scrollY: SharedValue<number>
  autoActive: SharedValue<boolean>
  suppress: SharedValue<boolean>
  insertSlot: SharedValue<number>
  groupOffset: SharedValue<number>
  onTap: (id: string) => void
  onSelect: (id: string) => void
  onDrop: (ids: string[]) => void
  onDragStart: () => void
  onDragEnd: () => void
  reportHeight: (id: string, h: number) => void
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

type RowProps = {
  id: string
  initialTop: number
  /** Hold time before this row's drag activates (depends on selection mode). */
  pressMs: number
  /** Set when heights are known up front; undefined => measure with onLayout. */
  fixedHeight?: number
  ctx: Ctx
  badge: React.ReactElement | null
  children: React.ReactNode
}

const SortableRow = memo(function SortableRow({
  id,
  initialTop,
  pressMs,
  fixedHeight,
  ctx,
  badge,
  children,
}: RowProps) {
  const {
    est,
    badgeContainerClassName,
    heights,
    orderIds,
    selectedMap,
    tops,
    isDragging,
    activeId,
    activeH,
    startTop,
    startScroll,
    translation,
    dragTop,
    scrollY,
    autoActive,
    suppress,
    insertSlot,
    groupOffset,
    onTap,
    onSelect,
    onDrop,
    onDragStart,
    onDragEnd,
    reportHeight,
  } = ctx

  /* Per-row animated state. Only small reactions write to these, so the animated
     style re-runs only when THIS row actually has to change. */
  const y = useSharedValue(initialTop)
  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)
  const badgeOpacity = useSharedValue(0)
  const isActive = useDerivedValue(
    () => isDragging.value && activeId.value === id,
  )

  // Slide to the top offset this row should occupy (skipped while it is the dragged row).
  useAnimatedReaction(
    () => (isActive.value ? -1 : (tops.value[id] ?? initialTop)),
    (target, prev) => {
      if (target < 0) return
      // First placement and measurement corrections snap; real reorders animate.
      if (prev === null || suppress.value) y.value = target
      else y.value = withTiming(target, { duration: 200 })
    },
    [initialTop],
  )

  // The dragged row follows the finger.
  useAnimatedReaction(
    () => (isActive.value ? dragTop.value : -1),
    (top) => {
      if (top >= 0) y.value = top
    },
  )

  // Other selected rows fade while the group is being carried.
  useAnimatedReaction(
    () => isDragging.value && activeId.value !== id && !!selectedMap.value[id],
    (ghost) => {
      opacity.value = withTiming(ghost ? 0.35 : 1, { duration: 150 })
    },
  )

  // Lift + badge for the dragged row.
  useAnimatedReaction(
    () => isActive.value,
    (active) => {
      scale.value = withTiming(active ? 1.03 : 1, {
        duration: active ? 120 : 220,
      })
      badgeOpacity.value = withTiming(active ? 1 : 0, { duration: 120 })
    },
  )

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activateAfterLongPress(pressMs)
      .onStart(() => {
        'worklet'
        // 1. Long-press selects the row if it isn't already.
        let map = selectedMap.value
        if (!map[id]) {
          map = { ...map, [id]: true }
          selectedMap.value = map
          runOnJS(onSelect)(id)
        }

        // 2. Measure: the row's top, and the height of selected rows above it.
        const order = orderIds.value
        const hs = heights.value
        let acc = 0
        let top = 0
        let offset = 0
        let found = false
        for (let i = 0; i < order.length; i++) {
          const oid = order[i]
          if (oid === id) {
            top = acc
            found = true
          } else if (!found && map[oid]) {
            offset += hOf(hs, oid, est)
          }
          acc += hOf(hs, oid, est)
        }
        groupOffset.value = offset
        activeH.value = hOf(hs, id, est)
        startTop.value = top
        startScroll.value = scrollY.value
        translation.value = 0
        autoActive.value = false
        insertSlot.value = slotFor(order, map, hs, est, top, offset)
        activeId.value = id
        isDragging.value = true
        runOnJS(onDragStart)()
      })
      .onUpdate((e) => {
        'worklet'
        translation.value = e.translationY
      })
      .onFinalize(() => {
        'worklet'
        if (activeId.value !== id) return // gesture never activated
        const moved = Math.abs(dragTop.value - startTop.value) > 8
        if (moved) {
          const next = buildOrder(
            orderIds.value,
            selectedMap.value,
            insertSlot.value,
          )
          orderIds.value = next
          runOnJS(onDrop)(next)
        }
        autoActive.value = false
        isDragging.value = false
        activeId.value = ''
        runOnJS(onDragEnd)()
      })

    const tap = Gesture.Tap()
      .maxDuration(pressMs)
      .onEnd((_e, success) => {
        'worklet'
        if (success) runOnJS(onTap)(id)
      })

    return Gesture.Race(pan, tap)
  }, [id, est, pressMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    zIndex: isActive.value || scale.value > 1.001 ? 10 : 1,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }))

  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.value }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        className='absolute left-0 right-0 top-0'
        style={[
          fixedHeight !== undefined ? { height: fixedHeight } : null,
          rowStyle,
        ]}
        onLayout={
          fixedHeight === undefined
            ? (e) => reportHeight(id, e.nativeEvent.layout.height)
            : undefined
        }
      >
        {children}
        {badge ? (
          <Animated.View
            pointerEvents='none'
            className={badgeContainerClassName}
            style={badgeStyle}
          >
            {badge}
          </Animated.View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  )
})

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

export function SelectableSortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  itemHeight,
  estimatedItemHeight = 64,
  selectedIds,
  onSelectionChange,
  onItemPress,
  ListHeaderComponent,
  ListFooterComponent,
  className,
  bottomInset = 0,
  longPressMs = 450,
  selectionLongPressMs = 180,
  bounces = false,
  renderSelectionBadge,
  badgeContainerClassName = 'absolute right-3 top-1.5',
  badgeClassName = 'bg-brand-primary',
}: SelectableSortableListProps<T>) {
  const ids = useMemo(() => data.map(keyExtractor), [data, keyExtractor])
  const idsKey = ids.join('\u241F')
  const est = estimatedItemHeight
  const fixed = itemHeight !== undefined

  /* ---- selection (controlled or uncontrolled) ---- */
  const [internalSel, setInternalSel] = useState<string[]>([])
  const selected = selectedIds ?? internalSel
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const latest = useRef({
    data,
    ids,
    selected,
    est,
    onReorder,
    onItemPress,
    onSelectionChange,
    controlled: selectedIds !== undefined,
  })
  latest.current = {
    data,
    ids,
    selected,
    est,
    onReorder,
    onItemPress,
    onSelectionChange,
    controlled: selectedIds !== undefined,
  }

  const setSelected = useCallback((next: string[]) => {
    const l = latest.current
    if (!l.controlled) setInternalSel(next)
    l.onSelectionChange?.(next)
  }, [])

  const onSelect = useCallback(
    (id: string) => {
      const l = latest.current
      if (!l.selected.includes(id)) setSelected([...l.selected, id])
    },
    [setSelected],
  )

  const onTap = useCallback(
    (id: string) => {
      const l = latest.current
      if (l.selected.length === 0) {
        const i = l.ids.indexOf(id)
        if (i >= 0) l.onItemPress?.(l.data[i], i)
        return
      }
      setSelected(
        l.selected.includes(id)
          ? l.selected.filter((x) => x !== id)
          : [...l.selected, id],
      )
    },
    [setSelected],
  )

  const onDrop = useCallback((nextIds: string[]) => {
    const l = latest.current
    const byId = new Map(l.ids.map((id, i) => [id, l.data[i]] as const))
    l.onReorder(nextIds.map((id) => byId.get(id) as T))
  }, [])

  /* The hold time depends on the mode, but the gesture is only re-configured while no
     drag is in progress (changing it mid-drag could interrupt the drag that just started). */
  const draggingRef = useRef(false)
  const [dragTick, setDragTick] = useState(0)
  const [gestureSelMode, setGestureSelMode] = useState(false)
  const selectionMode = selected.length > 0
  useEffect(() => {
    if (!draggingRef.current) setGestureSelMode(selectionMode)
  }, [selectionMode, dragTick])
  const onDragStart = useCallback(() => {
    draggingRef.current = true
  }, [])
  const onDragEnd = useCallback(() => {
    draggingRef.current = false
    setDragTick((t) => t + 1)
  }, [])
  const pressMs = gestureSelMode ? selectionLongPressMs : longPressMs

  /* ---- heights known on the JS side (fixed, measured, or estimated) ---- */
  const known = useRef<Heights>({})
  const [measureTick, setMeasureTick] = useState(0)
  const jsHeights = useMemo(() => {
    const out: Heights = {}
    data.forEach((item, i) => {
      const id = ids[i]
      out[id] = fixed
        ? typeof itemHeight === 'function'
          ? itemHeight(item, i)
          : (itemHeight as number)
        : (known.current[id] ?? est)
    })
    return out
  }, [data, ids, fixed, itemHeight, est, measureTick])

  const totalJs = useMemo(
    () => ids.reduce((acc, id) => acc + jsHeights[id], 0),
    [ids, jsHeights],
  )

  const initialTops = useMemo(() => {
    const out: Record<string, number> = {}
    let acc = 0
    ids.forEach((id) => {
      out[id] = acc
      acc += jsHeights[id]
    })
    return out
  }, [ids, jsHeights])

  /* ---- shared (UI thread) state ---- */
  const heights = useSharedValue<Heights>(jsHeights)
  const orderIds = useSharedValue<string[]>(ids)
  const selectedMap = useSharedValue<Record<string, boolean>>({})
  const isDragging = useSharedValue(false)
  const activeId = useSharedValue('')
  const activeH = useSharedValue(0)
  const startTop = useSharedValue(0)
  const startScroll = useSharedValue(0)
  const translation = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const autoActive = useSharedValue(false)
  const suppress = useSharedValue(false)
  const ready = useSharedValue(fixed)
  const insertSlot = useSharedValue(0)
  const groupOffset = useSharedValue(0)
  const viewH = useSharedValue(0)
  const contentH = useSharedValue(0)
  const headerH = useSharedValue(0)

  useEffect(() => {
    orderIds.value = ids
  }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    heights.value = jsHeights
  }, [jsHeights]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m: Record<string, boolean> = {}
    selected.forEach((id) => (m[id] = true))
    selectedMap.value = m
  }, [selected.join('\u241F')]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Rows report their measured height; updates are batched into one UI-thread write. */
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reportHeight = useCallback((id: string, h: number) => {
    if (Math.abs((known.current[id] ?? -1) - h) < 0.5) return
    known.current[id] = h
    if (flushTimer.current) return
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null
      const l = latest.current
      const next: Heights = {}
      l.ids.forEach((rid) => {
        next[rid] = known.current[rid] ?? l.est
      })
      suppress.value = true // snap rows to corrected positions instead of animating
      heights.value = next
      ready.value = true
      setMeasureTick((t) => t + 1) // re-render so the container gets the exact native height
      setTimeout(() => {
        suppress.value = false
      }, 60)
    }, 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalHeight = useDerivedValue(() => {
    const order = orderIds.value
    const hs = heights.value
    let acc = 0
    for (let i = 0; i < order.length; i++) acc += hOf(hs, order[i], est)
    return acc
  })

  /** Top of the dragged row in list coordinates (follows finger + scroll).
   *  Constant (0) while idle so plain scrolling never triggers downstream work. */
  const dragTop = useDerivedValue(() => {
    if (!isDragging.value) return 0
    const raw =
      startTop.value + translation.value + (scrollY.value - startScroll.value)
    return clamp(raw, 0, Math.max(0, totalHeight.value - activeH.value))
  })

  /** id -> top offset. While dragging, the selected group is gathered at `insertSlot`. */
  const tops = useDerivedValue(() => {
    const hs = heights.value
    const order = isDragging.value
      ? buildOrder(orderIds.value, selectedMap.value, insertSlot.value)
      : orderIds.value
    const out: Record<string, number> = {}
    let acc = 0
    for (let i = 0; i < order.length; i++) {
      out[order[i]] = acc
      acc += hOf(hs, order[i], est)
    }
    return out
  })

  /** Recompute the insertion slot whenever the dragged row moves. */
  useAnimatedReaction(
    () => dragTop.value,
    (top) => {
      if (!isDragging.value) return
      const t = slotFor(
        orderIds.value,
        selectedMap.value,
        heights.value,
        est,
        top,
        groupOffset.value,
      )
      if (t !== insertSlot.value) insertSlot.value = t
    },
    [est],
  )

  /* ---- scrolling ---- */
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const yy = e.contentOffset.y
      if (autoActive.value) {
        // While auto-scrolling we own `scrollY`; native events lag a frame behind and
        // would make it jitter. Hand control back once native has caught up.
        if (Math.abs(yy - scrollY.value) < 1.5) autoActive.value = false
        return
      }
      scrollY.value = yy
    },
  })
  const scrollProps = useAnimatedProps(() => ({
    scrollEnabled: !isDragging.value,
  }))

  useFrameCallback((info) => {
    'worklet'
    if (!isDragging.value) return
    const dt = Math.min((info.timeSincePreviousFrame ?? 16) / 1000, 0.05)
    const top = headerH.value + dragTop.value - scrollY.value
    const bottom = top + activeH.value
    let v = 0
    if (top < EDGE) v = -Math.min(EDGE - top, EDGE) / EDGE
    else if (bottom > viewH.value - EDGE)
      v = Math.min(bottom - (viewH.value - EDGE), EDGE) / EDGE
    if (v === 0) return
    const max = Math.max(0, contentH.value - viewH.value)
    const next = clamp(
      scrollY.value + v * Math.abs(v) * MAX_SCROLL_SPEED * dt,
      0,
      max,
    )
    if (next === scrollY.value) return
    autoActive.value = true
    scrollY.value = next
    scrollTo(scrollRef, 0, next, false)
  })

  /* ---- context ---- */
  const ctx: Ctx = useMemo(
    () => ({
      est,
      badgeContainerClassName,
      heights,
      orderIds,
      selectedMap,
      tops,
      isDragging,
      activeId,
      activeH,
      startTop,
      startScroll,
      translation,
      dragTop,
      scrollY,
      autoActive,
      suppress,
      insertSlot,
      groupOffset,
      onTap,
      onSelect,
      onDrop,
      onDragStart,
      onDragEnd,
      reportHeight,
    }),
    [est, badgeContainerClassName], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const count = selected.length

  /** One indicator element, shared by all rows (only the dragged row reveals it). */
  const badge = useMemo<React.ReactElement | null>(() => {
    if (renderSelectionBadge) return renderSelectionBadge(count)
    if (count <= 1) return null
    return (
      <View
        className={`h-6 min-w-6 items-center justify-center rounded-full px-1.5 ${badgeClassName}`}
      >
        <GoogleSansText
          variant='bold'
          className='text-text-primary'
        >
          {count}
        </GoogleSansText>
      </View>
    )
  }, [renderSelectionBadge, count, badgeClassName])

  const readyStyle = useAnimatedStyle(() => ({
    opacity: ready.value ? 1 : 0, // hidden until the first measurement pass is applied
  }))

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      ref={scrollRef}
      className={className}
      animatedProps={scrollProps}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onLayout={(e) => {
        viewH.value = e.nativeEvent.layout.height
      }}
      onContentSizeChange={(_w, h) => {
        contentH.value = h
      }}
      // iOS silently adds top/bottom content insets (status bar, nav bar, home indicator)
      // to a ScrollView by default. Turn that off so the list starts/ends exactly at its rows.
      bounces={bounces}
      alwaysBounceVertical={false}
      overScrollMode={bounces ? 'auto' : 'never'}
      contentInsetAdjustmentBehavior='never'
      automaticallyAdjustContentInsets={false}
      automaticallyAdjustKeyboardInsets={false}
      contentContainerStyle={
        bottomInset > 0 ? { paddingBottom: bottomInset } : undefined
      }
    >
      {ListHeaderComponent ? (
        <View onLayout={(e) => (headerH.value = e.nativeEvent.layout.height)}>
          {ListHeaderComponent}
        </View>
      ) : null}

      <Animated.View style={[{ height: totalJs }, readyStyle]}>
        {data.map((item, index) => {
          const id = ids[index]
          return (
            <SortableRow
              key={id}
              id={id}
              initialTop={initialTops[id]}
              pressMs={pressMs}
              fixedHeight={fixed ? jsHeights[id] : undefined}
              ctx={ctx}
              badge={badge}
            >
              {renderItem(item, {
                index,
                isSelected: selectedSet.has(id),
                selectionMode,
                selectedCount: count,
              })}
            </SortableRow>
          )
        })}
      </Animated.View>

      {ListFooterComponent}
    </Animated.ScrollView>
  )
}
