import { GoogleSansText } from '@/components/ui/fonts'
import { useScanContext } from '@/context/scan-context'
import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { extractText } from '../../../modules/page-scan-module/src/PageScanModule'

type PageType = {
  [id: string]: { uri: string; text: string | null }
}

export default function ScanResultScreen() {
  const [pages, setPages] = useState<PageType | null>(null)
  const { scanResult } = useScanContext()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!scanResult) return

    setPages(
      scanResult.pages.reduce((acc, page, i) => {
        acc[i] = { uri: page, text: null }
        return acc
      }, {} as PageType),
    )
  }, [scanResult])

  useEffect(() => {
    if (!pages) return

    const convertToText = async () => {
      Object.entries(pages).forEach(async ([id, page]) => {
        const text = await extractText(page.uri)

        if (text?.text) {
          setPages((prev) => {
            const newPages = { ...prev }
            newPages[id] = { ...newPages[id], text: text.text }
            return newPages
          })
        }
      })
    }
    convertToText()
  }, [pages])

  return (
    <View
      className='flex-1 bg-bg-primary gap-4 px-4'
      style={{
        paddingTop: insets.top + 16,
      }}
    >
      {pages &&
        Object.entries(pages).map(([id, page]) => (
          <View
            key={id}
            className='flex-row gap-4 items-center'
          >
            <View className='w-24 h-24'>
              <Image
                source={{ uri: page.uri }}
                style={{ width: 96, height: 96 }}
                contentFit='cover'
              />
            </View>
            <View className='gap-1'>
              <GoogleSansText variant='medium'>
                Page - {Number(id) + 1}
              </GoogleSansText>
              <View className='flex-row items-center gap-2'>
                <ActivityIndicator />
                <GoogleSansText className='text-xs'>
                  {page.text === null ? 'Extracting text' : 'Completed'}
                </GoogleSansText>
              </View>
            </View>
          </View>
        ))}
    </View>
  )
}
