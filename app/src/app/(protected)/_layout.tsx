import AuthLoadScreen from '@/components/screens/app/AuthLoadScreen'
import { useAuthContext } from '@/context/AuthContext'
import { Redirect, Stack } from 'expo-router'

export default function ProtectedLayout() {
  const { auth } = useAuthContext()

  if (!auth.userDataFetched) {
    return <AuthLoadScreen />
  }
  if (auth.userDataFetched && !auth.user) {
    return <Redirect href='/auth' />
  }

  return <Stack />
}
