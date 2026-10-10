import { CircleActivityIndicator } from '@/components/app/activity-indicator'
import TextAlert from '@/components/app/alert'
import { BottomBar, TopBar } from '@/components/app/app-layout'
import { SelectableSortableList } from '@/components/app/sortable-list'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { PageType, useNewBookContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  ArrowRight,
  BookOpenCheck,
  ClockFading,
  Ghost,
  ScanText,
  Square,
  SquareCheck,
  WavesHorizontal,
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import {
  extractText,
  scanPage,
} from '../../../../modules/page-scan-module/src/PageScanModule'

function ScanPagesPressable() {
  const { pages, setPages } = useNewBookContext()

  const openPageScanner = async () => {
    const scanResult = await scanPage()
    if (!scanResult || !scanResult.pages.length) return

    const startIndex = pages.length
    const newPages: PageType[] = scanResult.pages.map(
      (uri: string, index: number) => ({
        id: `${startIndex + index + 1}`,
        uri: uri,
        text: null,
        state: 'queued',
      }),
    )

    setPages((prev) => [...prev, ...newPages])
    processImages(newPages)
  }

  const processImages = async (pagesToProcess: PageType[]) => {
    for (const page of pagesToProcess) {
      try {
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  state: 'processing',
                }
              : p,
          ),
        )

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
  const { pages, setPages, selectedPages, setSelectedPages } =
    useNewBookContext()

  const done = () => {
    router.back()
  }

  const isSelecting = selectedPages.length > 0
  const pageLabel = pages.length === 1 ? 'Page' : 'Pages'
  const title = isSelecting
    ? `${selectedPages.length} selected`
    : `${pages.length} ${pageLabel}`

  const deleteSelectedPages = () => {
    setPages((prev) => prev.filter((p) => !selectedPages.includes(p.id)))
    setSelectedPages([])
  }

  const ActionButton = () => {
    if (isSelecting) {
      return (
        <Pressable onPress={deleteSelectedPages}>
          <GoogleSansText
            variant='bold'
            className='text-red-500 text-lg'
          >
            Delete
          </GoogleSansText>
        </Pressable>
      )
    }

    return (
      <Pressable onPress={done}>
        <GoogleSansText
          variant='bold'
          className='text-brand-primary text-lg'
        >
          Done
        </GoogleSansText>
      </Pressable>
    )
  }

  return (
    <TopBar
      title={title}
      showBackButton={false}
    >
      <ActionButton />
    </TopBar>
  )
}

export function PageList() {
  const { pages, setPages, selectedPages, setSelectedPages } =
    useNewBookContext()

  if (pages.length === 0) {
    return (
      <View className='flex-1 items-center justify-center'>
        <EmptyPageList />
      </View>
    )
  }

  return (
    <SelectableSortableList<PageType>
      className='flex-1'
      data={pages}
      keyExtractor={(item) => item.id}
      onReorder={setPages}
      selectedIds={selectedPages}
      onSelectionChange={setSelectedPages}
      badgeClassName='bg-brand-primary'
      renderItem={(item, info) => (
        <PageItem
          page={item}
          pageNumber={info.index}
          isSelected={info.isSelected}
          selectionMode={info.selectionMode}
        />
      )}
    />
  )
}

function EmptyPageList() {
  return (
    <View className='flex-1 gap-4 items-center justify-center'>
      <View className='items-center justify-center size-12'>
        <Ghost className='text-icon size-12' />
      </View>
      <View className='items-center'>
        <GoogleSansText
          className='text-icon text-xl'
          variant='bold'
        >
          No pages.
        </GoogleSansText>
        <GoogleSansText className='text-icon'>
          Scan some pages to get started.
        </GoogleSansText>
      </View>
    </View>
  )
}

function PageItem({
  page,
  pageNumber,
  isSelected,
  selectionMode,
}: {
  page: PageType
  pageNumber: number
  isSelected: boolean
  selectionMode: boolean
}) {
  const Description = () => {
    switch (page.state) {
      case 'queued':
        return (
          <View className='flex-row gap-2 items-center'>
            <ClockFading
              className='text-icon'
              size={12}
            />
            <GoogleSansText className='text-xs text-text-secondary'>
              Queued
            </GoogleSansText>
          </View>
        )
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
    <View className='px-4 pb-2 h-full'>
      <PageSection isSelected={isSelected}>
        <View className='flex-row gap-4 items-center'>
          {selectionMode && (
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
          <View className={`flex-1 gap-1 ${selectionMode ? '' : 'pr-4'}`}>
            <GoogleSansText
              variant='bold'
              className='text-text-secondary'
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
              Scanned as page {page.id}
            </GoogleSansText>
          </View>
          {!selectionMode && <ArrowRight className='text-icon' />}
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
      className={`rounded-xl p-4 bg-bg-secondary gap-2 border flex-1 justify-center ${
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
  ClockFading,
])
