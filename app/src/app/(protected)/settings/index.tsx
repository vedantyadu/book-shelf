import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import { AccountSettings } from '@/components/screens/settings/account-settings'
import { Logout } from '@/components/screens/settings/logout'
import { SubscriptionSettings } from '@/components/screens/settings/subscription-settings'
import { ThemeSettings } from '@/components/screens/settings/theme-settings'
import { ScrollView, View } from 'react-native'

export default function Settings() {
  return (
    <SafeScreen>
      <TopBar title='Settings' />
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
      >
        <View className='gap-4 px-4'>
          <AccountSettings />
          <SubscriptionSettings />
          <ThemeSettings />
          <Logout />
        </View>
      </ScrollView>
      <BottomBar />
    </SafeScreen>
  )
}
