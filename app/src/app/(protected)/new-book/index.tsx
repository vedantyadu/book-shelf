import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import {
  NewBookCloud,
  NewBookDetails,
  NewBookPages,
} from '@/components/screens/new-book/new-book-sections'
import { Section } from '@/components/ui/section'
import { ScrollView, View } from 'react-native'

export default function ScanResultScreen() {
  // useEffect(() => {
  //   if (!scanResult) return

  //   setPages(
  //     scanResult.pages.reduce((acc, page, i) => {
  //       acc[i] = { uri: page, text: null }
  //       return acc
  //     }, {} as PageType),
  //   )
  // }, [scanResult])

  // useEffect(() => {
  //   if (!pages) return

  //   const convertToText = async () => {
  //     Object.entries(pages).forEach(async ([id, page]) => {
  //       const text = await extractText(page.uri)

  //       if (text?.text) {
  //         setPages((prev) => {
  //           const newPages = { ...prev }
  //           newPages[id] = { ...newPages[id], text: text.text }
  //           return newPages
  //         })
  //       }
  //     })
  //   }
  //   convertToText()
  // }, [pages])

  return (
    <SafeScreen>
      <TopBar title='New book' />
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
      >
        <View className='px-4'>
          <Section>
            <View className='gap-6'>
              <NewBookDetails />
              <NewBookPages />
              <NewBookCloud />
            </View>
          </Section>
        </View>
      </ScrollView>
      <BottomBar />
    </SafeScreen>
  )
}
