import { SafeScreen } from '@/components/app/app-layout'
import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { Image } from 'expo-image'
import { openAuthSessionAsync } from 'expo-web-browser'
import { View } from 'react-native'

const appIcon = require('@/assets/images/bookshelf-icon.svg')
const googleLogo = require('@/assets/images/google-icon.svg')

export default function LoginScreen() {
  const googleLogin = async () => {
    const authURI = process.env.EXPO_PUBLIC_GOOGLE_AUTH_URI as string
    const redirectURI = process.env
      .EXPO_PUBLIC_GOOGLE_AUTH_REDIRECT_URI as string
    const clientID = process.env.EXPO_PUBLIC_GOOGLE_AUTH_CLIENT_ID as string

    const options = {
      redirect_uri: redirectURI,
      client_id: clientID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    }

    const queryString = new URLSearchParams(options).toString()
    const queryStringURL = `${authURI}?${queryString.toString()}`

    await openAuthSessionAsync(queryStringURL)
  }

  return (
    <SafeScreen>
      <View className='flex-1 items-center justify-center gap-16 p-4'>
        <View className='items-center justify-center size-32'>
          <Image
            source={appIcon}
            style={{ height: 128, width: 128 }}
            contentFit='contain'
          />
        </View>
        <View className='items-center gap-4'>
          <DefaultPressable
            variant='primary'
            onPress={googleLogin}
          >
            <Image
              source={googleLogo}
              style={{ width: 16, height: 16 }}
              contentFit='contain'
            />
            <GoogleSansText variant='medium'>
              Continue with Google
            </GoogleSansText>
          </DefaultPressable>
        </View>
      </View>
    </SafeScreen>
  )
}
