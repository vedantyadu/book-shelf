import { GoogleSansText } from '@/components/ui/fonts'
import { useAppContext } from '@/context/app-context'
import {
  getRefreshToken,
  removeAccessToken,
  removeRefreshToken,
} from '@/lib/access_token'
import { api } from '@/lib/api'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export function Logout() {
  const { setAuth } = useAppContext()

  const handleLogout = async () => {
    const refresh_token = await getRefreshToken()
    await api.post('/auth/logout', { refresh_token: refresh_token })
    setAuth({ loading: false, user: null })
    await removeAccessToken()
    await removeRefreshToken()
    router.replace('/auth')
  }

  return (
    <Pressable
      onPress={handleLogout}
      className='flex-row gap-2 items-center justify-center rounded-xl bg-bg-secondary p-4'
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-red-400'
      >
        Logout
      </GoogleSansText>
      <View className='size-4 items-center justify-center'>
        <LogOut className='size-4 text-red-400' />
      </View>
    </Pressable>
  )
}

ensureInterop([LogOut])
