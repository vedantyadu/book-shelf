import { LoadScreen } from '@/components/app/load-screen'
import { useAppContext } from '@/context/app-context'
import { useDeepLink } from '@/context/deep-link-context'
import { setAccessToken, setRefreshToken } from '@/lib/access_token'
import { api } from '@/lib/api'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useEffect } from 'react'

export default function RedirectScreen() {
  const { currentURL } = useDeepLink()
  const { setAuth } = useAppContext()

  const googleAuth = async (code: string) => {
    try {
      const res = await api.post('/auth/google', {
        code,
      })
      await setAccessToken(res.data.access_token)
      await setRefreshToken(res.data.refresh_token)

      const userData = await api.get('/users/me')
      setAuth({ loading: false, user: userData.data })
      router.replace('/(protected)')
    } catch (err) {}
  }

  useEffect(() => {
    if (!currentURL) return
    const result = Linking.parse(currentURL)
    if (result.queryParams?.code) {
      googleAuth(result.queryParams.code as string)
    }
  }, [currentURL])

  return <LoadScreen />
}
