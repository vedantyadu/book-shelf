import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import {
  NewBookCloud,
  NewBookDetails,
  NewBookPages,
  SaveNewBookPressable,
} from '@/components/screens/new-book/new-book-sections'
import { Section } from '@/components/ui/section'
import { ScrollView, View } from 'react-native'

export default function ScanResultScreen() {
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
              <SaveNewBookPressable />
            </View>
          </Section>
        </View>
      </ScrollView>
      <BottomBar />
    </SafeScreen>
  )
}
