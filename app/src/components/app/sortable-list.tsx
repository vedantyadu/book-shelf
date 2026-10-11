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
 *                          Measured heights are cached across mounts, so revisiting a
 *                          screen renders correctly on the very first frame.
 *  • `itemHeight={68}`  -> every row is exactly 68px.
 *  • `itemHeight={(item) => ...}` -> you know each row's height up front (no measuring).
 *
 * Navigation performance:
 *  • The list mounts AFTER the screen transition finishes (`deferMount`, default true).
 *  • Measuring never re-renders React; the container height is driven from the UI thread.
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
import { ActivityIndicator, View } from 'react-native'
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
  /**
   * Namespace for the cross-mount height cache. Give each distinct list/screen its own
   * key (e.g. "playlist") so identical ids in different lists never share heights.
   * Default ''.
   */
  heightCacheKey?: string

  /**
   * Wait until navigation transitions/interactions finish before mounting the heavy list.
   * Default true.
   */
  deferMount?: boolean
  /**
   * Rendered while the mount is deferred (e.g. a skeleton). Defaults to an empty view with
   * the same `className` plus the header, so nothing flashes.
   */
  placeholder?: React.ReactElement | null

  /**
   * True while YOUR data is still being fetched. While true and `data` is empty, the
   * loader is shown instead of the list (a refresh with existing data keeps the list).
   */
  isLoading?: boolean
  /**
   * Custom loader element (skeleton, Lottie, spinner...). Omit for a default spinner,
   * pass null for no loader. Shown while data is loading, while the mount is deferred,
   * and while rows are measured for the first time.
   */
  loader?: React.ReactElement | null
  /** NativeWind classes wrapping the loader. It fills the available space, so
   *  Default 'flex-1 justify-center': full width and height, content centered vertically.
   *  Avoid 'items-center' if your loader should span the full width (it shrinks children
   *  to their content width); give the loader itself 'self-center' instead. */
  loaderContainerClassName?: string

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
/* Height cache (survives unmount / re-mount, i.e. screen navigation)  */
/* ------------------------------------------------------------------ */

const heightCache = new Map<string, number>()
const MAX_CACHED_HEIGHTS = 3000

function cacheKeyOf(ns: string, id: string) {
  return ns + '\u241F' + id
}

function cacheSet(key: string, h: number) {
  if (!heightCache.has(key) && heightCache.size >= MAX_CACHED_HEIGHTS) {
    // Map iterates in insertion order -> drop the oldest entry.
    const oldest = heightCache.keys().next().value
    if (oldest !== undefined) heightCache.delete(oldest)
  }
  heightCache.set(key, h)
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
  item: unknown
  index: number
  isSelected: boolean
  selectionMode: boolean
  /** NOTE: deliberately ignored by the memo comparison (see areEqual). */
  selectedCount: number
  renderItem: (item: any, info: RowInfo) => React.ReactElement
  renderBadge: (count: number) => React.ReactElement | null
}

/** Re-render a row only when something it actually shows has changed. Selecting one row
 *  therefore re-renders ONE row instead of the whole list. `selectedCount` is excluded on
 *  purpose (it changes on every tap); use `renderSelectionBadge` to show the count. */
function areEqual(a: RowProps, b: RowProps) {
  return (
    a.id === b.id &&
    a.initialTop === b.initialTop &&
    a.pressMs === b.pressMs &&
    a.fixedHeight === b.fixedHeight &&
    a.ctx === b.ctx &&
    a.item === b.item &&
    a.index === b.index &&
    a.isSelected === b.isSelected &&
    a.selectionMode === b.selectionMode &&
    a.renderItem === b.renderItem &&
    a.renderBadge === b.renderBadge
  )
}

/** The selected count reaches the badges through context, so a count change re-renders
 *  only these tiny badge components, never the row contents. */
const BadgeCountContext = React.createContext(0)

const RowBadge = memo(function RowBadge({
  renderBadge,
}: {
  renderBadge: (count: number) => React.ReactElement | null
}) {
  const count = React.useContext(BadgeCountContext)
  return renderBadge(count)
})

const SortableRow = memo(function SortableRow({
  id,
  initialTop,
  pressMs,
  fixedHeight,
  ctx,
  item,
  index,
  isSelected,
  selectionMode,
  selectedCount,
  renderItem,
  renderBadge,
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
        // 0. Flag the drag on the JS side first, so the selection update that follows
        //    can never rebuild the gesture while it is being activated.
        runOnJS(onDragStart)()

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
        {renderItem(item, { index, isSelected, selectionMode, selectedCount })}
        {isSelected ? (
          <Animated.View
            pointerEvents='none'
            className={badgeContainerClassName}
            style={badgeStyle}
          >
            <RowBadge renderBadge={renderBadge} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  )
}, areEqual)

/* ------------------------------------------------------------------ */
/* Public component: defers the heavy mount until transitions finish  */
/* ------------------------------------------------------------------ */

const LOADER_MIN_HEIGHT = 120

/**
 * Runs `cb` once the JS thread is idle (replacement for the deprecated
 * InteractionManager.runAfterInteractions). Waits one frame first so the screen
 * transition can start, then uses requestIdleCallback with a timeout so the callback is
 * guaranteed to run even if the thread never goes fully idle. Returns a cancel function.
 */
function runWhenIdle(cb: () => void, timeoutMs = 300): () => void {
  const g = globalThis as any
  let cancelled = false
  let idleId: number | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const run = () => {
    if (!cancelled) cb()
  }

  const rafId = requestAnimationFrame(() => {
    if (cancelled) return
    if (typeof g.requestIdleCallback === 'function') {
      idleId = g.requestIdleCallback(run, { timeout: timeoutMs })
    } else {
      timeoutId = setTimeout(run, 0) // very old runtimes without requestIdleCallback
    }
  })

  return () => {
    cancelled = true
    cancelAnimationFrame(rafId)
    if (idleId !== undefined) g.cancelIdleCallback?.(idleId)
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}

function sameHeights(a: Heights, b: Heights) {
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  for (let i = 0; i < ak.length; i++) {
    if (a[ak[i]] !== b[ak[i]]) return false
  }
  return true
}

function sameArray(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function SelectableSortableList<T>(
  props: SelectableSortableListProps<T>,
) {
  const {
    deferMount = true,
    isLoading = false,
    placeholder,
    className,
    ListHeaderComponent,
    loader,
    loaderContainerClassName = 'flex-1 justify-center',
  } = props
  const [show, setShow] = useState(!deferMount)

  useEffect(() => {
    if (!deferMount || show) return
    return runWhenIdle(() => setShow(true))
  }, [deferMount, show])

  if (!show || (isLoading && props.data.length === 0)) {
    if (placeholder !== undefined) return placeholder
    return (
      <View className={className}>
        {ListHeaderComponent}
        {loader === null ? null : (
          <View
            className={loaderContainerClassName}
            style={{ width: '100%', flexGrow: 1 }}
          >
            {loader ?? <ActivityIndicator size='large' />}
          </View>
        )}
      </View>
    )
  }
  return <SelectableSortableListImpl {...props} />
}

/* ------------------------------------------------------------------ */
/* List implementation                                                 */
/* ------------------------------------------------------------------ */

function SelectableSortableListImpl<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  itemHeight,
  estimatedItemHeight = 64,
  heightCacheKey = '',
  loader,
  loaderContainerClassName = 'flex-1 justify-center',
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
  const idsRaw = useMemo(() => data.map(keyExtractor), [data, keyExtractor])
  // Keep the SAME array identity while the ids are unchanged, so a parent re-render with a
  // fresh-but-equal `data` array (e.g. when the screen regains focus) triggers no extra work.
  const idsRef = useRef(idsRaw)
  if (idsRef.current !== idsRaw && !sameArray(idsRef.current, idsRaw)) {
    idsRef.current = idsRaw
  }
  const ids = idsRef.current
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
  const [, setDragTick] = useState(0)
  const selectionMode = selected.length > 0
  // Latched during render (single pass, no extra state + effect round trip). Frozen while a
  // drag is in progress; onDragEnd forces one more render to pick up the final mode.
  const gestureModeRef = useRef(false)
  if (!draggingRef.current) gestureModeRef.current = selectionMode
  const onDragStart = useCallback(() => {
    draggingRef.current = true
  }, [])
  const onDragEnd = useCallback(() => {
    draggingRef.current = false
    setDragTick((t) => t + 1)
  }, [])
  const pressMs = gestureModeRef.current ? selectionLongPressMs : longPressMs

  /* ---- heights known on the JS side (fixed, cached, measured, or estimated) ---- */
  const cacheNs = useRef(heightCacheKey)
  cacheNs.current = heightCacheKey

  // Seeded ONCE from the cross-mount cache. Mutated in place by reportHeight (it is only a
  // lookup table, never rendered from directly, so mutating it does not need a re-render).
  const [seed] = useState(() => {
    const knownInit: Heights = {}
    let all = true
    if (!fixed) {
      for (const id of ids) {
        const c = heightCache.get(cacheKeyOf(heightCacheKey, id))
        if (c === undefined) all = false
        else knownInit[id] = c
      }
    }
    return { known: knownInit, ready: fixed || all }
  })
  const known = seed.known

  const jsHeights = useMemo(() => {
    const out: Heights = {}
    data.forEach((item, i) => {
      const id = ids[i]
      out[id] = fixed
        ? typeof itemHeight === 'function'
          ? itemHeight(item, i)
          : (itemHeight as number)
        : (known[id] ?? est)
    })
    return out
  }, [data, ids, fixed, itemHeight, est, known])

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
  const ready = useSharedValue(seed.ready)
  const fade = useSharedValue(seed.ready ? 1 : 0)
  const lastHeights = useRef<Heights>(jsHeights)
  const insertSlot = useSharedValue(0)
  const groupOffset = useSharedValue(0)
  const viewH = useSharedValue(0)
  const contentH = useSharedValue(0)
  const headerH = useSharedValue(0)

  useEffect(() => {
    orderIds.value = ids
  }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Only cross to the UI thread when the heights actually changed.
  useEffect(() => {
    if (sameHeights(lastHeights.current, jsHeights)) return
    lastHeights.current = jsHeights
    heights.value = jsHeights
  }, [jsHeights]) // eslint-disable-line react-hooks/exhaustive-deps

  // Data arriving into a previously empty list: show the loader until rows are measured.
  const prevCount = useRef(ids.length)
  useEffect(() => {
    if (!fixed && prevCount.current === 0 && ids.length > 0) {
      if (ids.some((id) => known[id] === undefined)) ready.value = false
    }
    prevCount.current = ids.length
  }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-fade between loader and list.
  useAnimatedReaction(
    () => ready.value,
    (r) => {
      fade.value = withTiming(r ? 1 : 0, { duration: 180 })
    },
  )

  useEffect(() => {
    const m: Record<string, boolean> = {}
    selected.forEach((id) => (m[id] = true))
    selectedMap.value = m
  }, [selected.join('\u241F')]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- measurement reports (no React re-render) ---- */
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted = useRef(false)

  // Cleanup: never touch shared values after the screen is gone.
  useEffect(() => {
    unmounted.current = false // (also covers StrictMode's simulated unmount)
    return () => {
      unmounted.current = true
      if (flushTimer.current) {
        clearTimeout(flushTimer.current)
        flushTimer.current = null
      }
      if (suppressTimer.current) {
        clearTimeout(suppressTimer.current)
        suppressTimer.current = null
      }
    }
  }, [])

  /** Rows report their measured height; updates are batched into one UI-thread write. */
  const reportHeight = useCallback((id: string, h: number) => {
    if (Math.abs((known[id] ?? -1) - h) < 0.5) return
    known[id] = h
    cacheSet(cacheKeyOf(cacheNs.current, id), h)
    if (flushTimer.current) return
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null
      if (unmounted.current) return
      const l = latest.current
      const next: Heights = {}
      l.ids.forEach((rid) => {
        next[rid] = known[rid] ?? l.est
      })
      suppress.value = true // snap rows to corrected positions instead of animating
      lastHeights.current = next
      heights.value = next
      ready.value = true
      if (suppressTimer.current) clearTimeout(suppressTimer.current)
      suppressTimer.current = setTimeout(() => {
        suppressTimer.current = null
        if (!unmounted.current) suppress.value = false
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
    scrollEnabled: !isDragging.value && ready.value,
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

  /** Stable badge factory. Only selected rows mount a badge, and the count reaches them
   *  through context, so changing the selection never re-renders unrelated rows. */
  const renderBadge = useCallback(
    (c: number): React.ReactElement | null => {
      if (renderSelectionBadge) return renderSelectionBadge(c)
      if (c <= 1) return null
      return (
        <View
          className={`h-6 min-w-6 items-center justify-center rounded-full px-1.5 ${badgeClassName}`}
        >
          <GoogleSansText
            variant='bold'
            className='text-text-primary'
          >
            {c}
          </GoogleSansText>
        </View>
      )
    },
    [renderSelectionBadge, badgeClassName],
  )

  /** Container height comes straight from the UI thread (no React re-render needed when
   *  rows are measured). Hidden until the first measurement pass is applied. */
  const containerStyle = useAnimatedStyle(() => ({
    // While the first measurement is pending, fill the visible area (below the header)
    // so the loader can be centered on the screen.
    height: ready.value
      ? totalHeight.value
      : Math.max(
          totalHeight.value,
          viewH.value > 0 ? viewH.value - headerH.value : LOADER_MIN_HEIGHT,
        ),
  }))
  const rowsStyle = useAnimatedStyle(() => ({ opacity: fade.value }))
  const loaderStyle = useAnimatedStyle(() => ({ opacity: 1 - fade.value }))

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

      <Animated.View style={containerStyle}>
        <Animated.View style={[{ flex: 1 }, rowsStyle]}>
          <BadgeCountContext.Provider value={count}>
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
                  item={item}
                  index={index}
                  isSelected={selectedSet.has(id)}
                  selectionMode={selectionMode}
                  selectedCount={count}
                  renderItem={renderItem}
                  renderBadge={renderBadge}
                />
              )
            })}
          </BadgeCountContext.Provider>
        </Animated.View>

        {loader === null ? null : (
          <Animated.View
            pointerEvents='none'
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
              loaderStyle,
            ]}
          >
            <View
              className={loaderContainerClassName}
              style={{ width: '100%', flexGrow: 1 }}
            >
              {loader ?? <ActivityIndicator size='large' />}
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {ListFooterComponent}
    </Animated.ScrollView>
  )
}
