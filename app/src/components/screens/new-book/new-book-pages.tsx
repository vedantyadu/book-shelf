import { CircleActivityIndicator } from '@/components/app/activity-indicator'
import TextAlert from '@/components/app/alert'
import { BottomBar, TopBar } from '@/components/app/app-layout'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { Section } from '@/components/ui/section'
import { PageType, useNewBookContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import * as Crypto from 'expo-crypto'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  ArrowRight,
  BookOpenCheck,
  Ghost,
  ScanText,
  Square,
  SquareCheck,
} from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import {
  extractText,
  scanPage,
} from '../../../../modules/page-scan-module/src/PageScanModule'

function ScanPagesPressable() {
  const { pages, setPages } = useNewBookContext()

  const openPageScanner = async () => {
    const scanResult = await scanPage()
    if (!scanResult || !scanResult.pages.length) return

    const newPages: PageType[] = scanResult.pages.map((uri: string) => ({
      id: Crypto.randomUUID(),
      uri: uri,
      text: null,
      state: 'processing',
    }))

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
  return (
    <BottomBar>
      <View className='flex-row gap-2 px-4 pt-4 pb-2'>
        <ScanPagesPressable />
      </View>
    </BottomBar>
  )
}

export function AddPagesTopBar() {
  const { pages } = useNewBookContext()

  const done = () => {
    router.back()
  }

  const pageLabel = pages.length === 1 ? 'Page' : 'Pages'

  return (
    <TopBar
      title={`${pages.length} ${pageLabel}`}
      showBackButton={false}
    >
      <Pressable onPress={done}>
        <GoogleSansText
          variant='bold'
          className='text-brand-primary text-lg'
        >
          Done
        </GoogleSansText>
      </Pressable>
    </TopBar>
  )
}

export function PageList() {
  const { pages } = useNewBookContext()

  const Screen = () => {
    if (pages.length === 0) {
      return (
        <View className='flex-1 items-center justify-center'>
          <EmptyPageList />
        </View>
      )
    } else {
      return (
        <ScrollView
          className='flex-1'
          showsVerticalScrollIndicator={false}
        >
          <View className='px-4 flex-1 gap-2'>
            {pages.map((page, i) => (
              <PageItem
                key={page.id}
                page={page}
                pageNumber={i}
              />
            ))}
          </View>
        </ScrollView>
      )
    }
  }

  return <Screen />
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
}: {
  page: PageType
  pageNumber: number
}) {
  const { selectedPages, setSelectedPages } = useNewBookContext()

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
    <Section>
      <View className='flex-row gap-4 items-center'>
        {/* <View className='size-5 items-center justify-center'>
          <SquareCheck className='text-brand-primary size-5' />
        </View> */}
        <View className='rounded-xl overflow-hidden'>
          <Image
            source={{
              uri: page.uri,
            }}
            contentFit='cover'
            style={{ width: 64, height: 64 }}
          />
        </View>
        <View
          className={`flex-1 gap-1 ${selectedPages.length > 0 ? '' : 'pr-4'}`}
        >
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
            {page.id}
          </GoogleSansText>
        </View>
        {selectedPages.length === 0 && <ArrowRight className='text-icon' />}
      </View>
    </Section>
  )
}

ensureInterop([ScanText, Ghost, ArrowRight, BookOpenCheck, Square, SquareCheck])
