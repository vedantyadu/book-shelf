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
import { ActivityIndicator, Dimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  SharedValue,
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
import { scheduleOnRN } from 'react-native-worklets'
import { GoogleSansText } from '../ui/fonts'
import { CircleActivityIndicator } from './activity-indicator'

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
   * Only mount the rows that are visible plus a buffer (windowing). Greatly reduces mount,
   * unmount and re-render cost for long lists. Row components lose their local state when
   * they scroll far out of view, so keep important state in your data. Default true.
   */
  virtualize?: boolean
  /** How many screens of rows to keep mounted above AND below the viewport. Default 0.5. */
  windowBuffer?: number
  /**
   * Loader shown at the edge of the mounted rows when the user scrolls faster than rows can
   * mount. It is a single element (not one per row) and the user cannot scroll past it until
   * more rows are mounted. Omit for a default spinner; pass null to disable the loader and
   * the scroll limit.
   */
  renderEdgeLoader?:
    | ((info: {
        position: 'top' | 'bottom'
        height: number
      }) => React.ReactElement | null)
    | null
  /** Height reserved for the edge loader. Default 64. */
  edgeLoaderHeight?: number
  /**
   * Minimum time (ms) the edge loader stays on screen once the user reaches it, before the
   * next rows are mounted. An artificial delay that avoids a flash of the loader and makes
   * loading feel deliberate. It only applies when the user actually reaches the loader.
   * 0 disables it. Default 350.
   */
  edgeLoaderMinMs?: number
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

/** Index of the row under list-space y (rows are stacked in `order`), or -1. */
function rowAt(order: string[], hs: Heights, est: number, y: number): number {
  'worklet'
  if (y < 0) return -1
  let acc = 0
  for (let i = 0; i < order.length; i++) {
    acc += hOf(hs, order[i], est)
    if (y < acc) return i
  }
  return -1
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
    badgeContainerClassName,
    selectedMap,
    tops,
    isDragging,
    activeId,
    dragTop,
    suppress,
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

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    zIndex: isActive.value || scale.value > 1.001 ? 10 : 1,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }))

  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.value }))

  return (
    <>
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
    </>
  )
}, areEqual)

/* ------------------------------------------------------------------ */
/* Public component: defers the heavy mount until transitions finish  */
/* ------------------------------------------------------------------ */

type Bounds = { top: number; bottom: number }

/** The single loader that sits at the top / bottom edge of the mounted rows. */
const EdgeLoader = memo(function EdgeLoader({
  position,
  height,
  bounds,
  isDragging,
  children,
}: {
  position: 'top' | 'bottom'
  height: number
  bounds: { readonly value: Bounds }
  isDragging: { readonly value: boolean }
  children: React.ReactNode
}) {
  const style = useAnimatedStyle(() => {
    const b = bounds.value
    return {
      height,
      opacity: isDragging.value ? 0 : 1,
      transform: [
        { translateY: position === 'top' ? b.top - height : b.bottom },
      ],
    }
  })
  return (
    <Animated.View
      pointerEvents='none'
      className='absolute left-0 right-0 top-0 justify-center'
      style={style}
    >
      {children}
    </Animated.View>
  )
})

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
  virtualize = true,
  windowBuffer = 0.75,
  renderEdgeLoader,
  edgeLoaderHeight = 64,
  edgeLoaderMinMs = 500,
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
    if (!fixed) {
      for (const id of ids) {
        const c = heightCache.get(cacheKeyOf(heightCacheKey, id))
        if (c !== undefined) knownInit[id] = c
      }
    }
    // Rows to mount on the very first render: enough to cover the screen + buffer.
    const limit = Dimensions.get('window').height * (1 + windowBuffer)
    const visible: string[] = []
    let acc = 0
    let allKnown = true
    for (let i = 0; i < ids.length; i++) {
      if (virtualize && acc >= limit) break
      const id = ids[i]
      let h: number
      if (fixed) {
        h =
          typeof itemHeight === 'function'
            ? itemHeight(data[i], i)
            : (itemHeight as number)
      } else if (knownInit[id] !== undefined) {
        h = knownInit[id]
      } else {
        h = est
        allKnown = false
      }
      visible.push(id)
      acc += h
    }
    // Ready right away only if every row we are about to show has a known height.
    return { known: knownInit, ready: fixed || allKnown, visible }
  })
  const [visibleIds, setVisibleIds] = useState<string[]>(seed.visible)
  const wall = virtualize && renderEdgeLoader !== null
  const mountedIds = useSharedValue<string[]>(seed.visible)
  /** When (Date.now) the user first reached an edge loader; 0 = not at an edge. */
  const wallHitAt = useSharedValue(0)
  const pendingWindow = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const touchY = useSharedValue(0)
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
      if (pendingWindow.current) {
        clearTimeout(pendingWindow.current)
        pendingWindow.current = null
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

  /** Extent (list coordinates) of the rows that are actually mounted. Without a drag in
   *  progress the mounted rows are contiguous, so this is where the loaded content ends. */
  const bounds = useDerivedValue<Bounds>(() => {
    const total = totalHeight.value
    if (!wall || isDragging.value) return { top: 0, bottom: total }
    const tp = tops.value
    const hs = heights.value
    const list = mountedIds.value
    let top = Infinity
    let bottom = 0
    for (let i = 0; i < list.length; i++) {
      const t = tp[list[i]]
      if (t === undefined) continue
      if (t < top) top = t
      const b = t + hOf(hs, list[i], est)
      if (b > bottom) bottom = b
    }
    if (top === Infinity) return { top: 0, bottom: total }
    return { top, bottom: Math.min(bottom, total) }
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

  /** Applies a new window from the UI thread. If the user is currently looking at an edge
   *  loader, hold the update until the loader has been visible for `edgeLoaderMinMs`. */
  const applyWindow = useCallback(
    (nextIds: string[]) => {
      if (pendingWindow.current) {
        clearTimeout(pendingWindow.current)
        pendingWindow.current = null
      }
      const hit = wallHitAt.value
      const wait =
        hit > 0 && edgeLoaderMinMs > 0
          ? Math.max(0, edgeLoaderMinMs - (Date.now() - hit))
          : 0
      if (wait === 0) {
        setVisibleIds(nextIds)
        return
      }
      pendingWindow.current = setTimeout(() => {
        pendingWindow.current = null
        if (!unmounted.current) setVisibleIds(nextIds)
      }, wait)
    },
    [edgeLoaderMinMs], // eslint-disable-line react-hooks/exhaustive-deps
  )

  /** Windowing: which rows should be mounted? Runs on the UI thread, uses the row tops
   *  (so rows being carried in a drag are placed correctly), always keeps the dragged row,
   *  and quantizes the window so React only updates every ~quarter screen of scrolling. */
  useAnimatedReaction(
    () => {
      if (!virtualize) return ''
      const vh = viewH.value
      if (vh <= 0) return ''
      const order = orderIds.value
      const tp = tops.value
      const hs = heights.value
      const snap = Math.max(vh / 4, 50)
      const buf = vh * windowBuffer
      const base = scrollY.value - headerH.value
      const lo = Math.floor((base - buf) / snap) * snap
      const hi = Math.ceil((base + vh + buf) / snap) * snap
      const act = isDragging.value ? activeId.value : ''
      let key = ''
      for (let i = 0; i < order.length; i++) {
        const id = order[i]
        const t = tp[id]
        if (t === undefined) continue
        if (id === act || (t < hi && t + hOf(hs, id, est) > lo)) {
          key += id + '\u241F'
        }
      }
      return key
    },
    (key, prev) => {
      if (key === '' || key === prev) return
      scheduleOnRN(applyWindow, key.split('\u241F').filter(Boolean))
    },
    [est, virtualize, windowBuffer],
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
      // Walls: the user cannot scroll past the loader at either edge of the mounted rows.
      // Both limits are enforced here on the UI thread, from the same `bounds` that position
      // the loaders, so they can never disagree (unlike animated layout heights, which lag).
      if (wall && !isDragging.value) {
        const bd = bounds.value
        const total = totalHeight.value
        // Remember when an edge loader first came into view (drives the minimum delay).
        const vTop = yy - headerH.value
        const touching =
          (bd.bottom < total - 0.5 && vTop + viewH.value > bd.bottom) ||
          (bd.top > 0.5 && vTop < bd.top)
        if (!touching) wallHitAt.value = 0
        else if (wallHitAt.value === 0) wallHitAt.value = Date.now()
        const minY =
          bd.top > 0.5
            ? Math.max(0, headerH.value + bd.top - edgeLoaderHeight)
            : 0
        const maxY =
          bd.bottom < total - 0.5
            ? Math.max(
                minY,
                headerH.value + bd.bottom + edgeLoaderHeight - viewH.value,
              )
            : Infinity
        const target = yy < minY - 1 ? minY : yy > maxY + 1 ? maxY : yy
        if (target !== yy) {
          scrollY.value = target
          scrollTo(scrollRef, 0, target, false)
        }
      } else if (wallHitAt.value !== 0) {
        wallHitAt.value = 0
      }
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

  /* ---- ONE gesture for the whole list (instead of two handlers per row) ----
     Mounting/unmounting hundreds of gesture handlers was the main cost when navigating
     back, and changing the hold time rebuilt every one of them. The row under the finger
     is found by hit-testing the touch position against the row heights. */
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activateAfterLongPress(pressMs)
      .onBegin((e) => {
        'worklet'
        touchY.value = e.y
      })
      .onStart(() => {
        'worklet'
        const order = orderIds.value
        const hs = heights.value
        const idx = rowAt(order, hs, est, touchY.value)
        if (idx < 0) return // pressed outside any row
        const id = order[idx]

        // 0. Flag the drag on the JS side first, so the selection update that follows
        //    can never rebuild the gesture while it is being activated.
        scheduleOnRN(onDragStart)

        // 1. Long-press selects the row if it isn't already.
        let map = selectedMap.value
        if (!map[id]) {
          map = { ...map, [id]: true }
          selectedMap.value = map
          scheduleOnRN(onSelect, id)
        }

        // 2. Measure: the row's top, and the height of selected rows above it.
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
        if (isDragging.value) translation.value = e.translationY
      })
      .onFinalize(() => {
        'worklet'
        if (!isDragging.value) return // gesture never started a drag
        const moved = Math.abs(dragTop.value - startTop.value) > 8
        if (moved) {
          const next = buildOrder(
            orderIds.value,
            selectedMap.value,
            insertSlot.value,
          )
          orderIds.value = next
          scheduleOnRN(onDrop, next)
        }
        autoActive.value = false
        isDragging.value = false
        activeId.value = ''
        scheduleOnRN(onDragEnd)
      })

    const tap = Gesture.Tap()
      .maxDuration(pressMs)
      .onEnd((e, success) => {
        'worklet'
        if (!success) return
        const order = orderIds.value
        const idx = rowAt(order, heights.value, est, e.y)
        if (idx >= 0) scheduleOnRN(onTap, order[idx])
      })

    return Gesture.Race(pan, tap)
  }, [est, pressMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = selected.length

  /** Indices (into `data`) of the rows that are mounted right now. */
  const renderedIndices = useMemo(() => {
    if (!virtualize) return ids.map((_, i) => i)
    const indexById = new Map<string, number>()
    ids.forEach((id, i) => indexById.set(id, i))
    let out: number[] = []
    for (const id of visibleIds) {
      const i = indexById.get(id)
      if (i !== undefined) out.push(i)
    }
    // New data arrived and the UI thread hasn't reported its window yet: show the top.
    if (out.length === 0) {
      out = ids.slice(0, seed.visible.length).map((_, i) => i)
    }
    return out.sort((a, b) => a - b)
  }, [ids, visibleIds, virtualize]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tell the UI thread which rows are REALLY mounted (after React committed them).
  const renderedIds = useMemo(
    () => renderedIndices.map((i) => ids[i]),
    [renderedIndices, ids],
  )
  useEffect(() => {
    mountedIds.value = renderedIds
  }, [renderedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const moreAbove = wall && renderedIndices.length > 0 && renderedIndices[0] > 0
  const moreBelow =
    wall &&
    renderedIndices.length > 0 &&
    renderedIndices[renderedIndices.length - 1] < ids.length - 1
  const edgeLoaderNode = (position: 'top' | 'bottom') =>
    renderEdgeLoader ? (
      renderEdgeLoader({ position, height: edgeLoaderHeight })
    ) : (
      <View
        className='items-center justify-center'
        style={{ height: edgeLoaderHeight }}
      >
        <CircleActivityIndicator
          iconSize={16}
          strokeWidth={2}
        />
      </View>
    )

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
  const containerStyle = useAnimatedStyle(() => {
    const total = totalHeight.value
    if (!ready.value) {
      // While the first measurement is pending, fill the visible area (below the header)
      // so the loader can be centered on the screen.
      return {
        height: Math.max(
          total,
          viewH.value > 0 ? viewH.value - headerH.value : LOADER_MIN_HEIGHT,
        ),
      }
    }
    return { height: total }
  })
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

      <GestureDetector gesture={gesture}>
        <Animated.View style={containerStyle}>
          <Animated.View style={[{ flex: 1 }, rowsStyle]}>
            <BadgeCountContext.Provider value={count}>
              {renderedIndices.map((index) => {
                const item = data[index]
                const id = ids[index]
                return (
                  <SortableRow
                    key={id}
                    id={id}
                    initialTop={initialTops[id]}
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

            {moreAbove ? (
              <EdgeLoader
                position='top'
                height={edgeLoaderHeight}
                bounds={bounds}
                isDragging={isDragging}
              >
                {edgeLoaderNode('top')}
              </EdgeLoader>
            ) : null}
            {moreBelow ? (
              <EdgeLoader
                position='bottom'
                height={edgeLoaderHeight}
                bounds={bounds}
                isDragging={isDragging}
              >
                {edgeLoaderNode('bottom')}
              </EdgeLoader>
            ) : null}
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
      </GestureDetector>

      {ListFooterComponent}
    </Animated.ScrollView>
  )
}
