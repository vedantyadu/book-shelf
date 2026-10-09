import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { useAppContext } from '@/context/app-context'
import { api } from '@/lib/api'
import { ensureInterop } from '@/utils/icon-interop'
import { BRAND_PRIMARY_COLOR } from '@/utils/themes'
import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose'
import { router } from 'expo-router'
import { CircleAlert, RefreshCwOff, Undo2, X } from 'lucide-react-native'
import { View } from 'react-native'

export type CancelSubscriptionPageStateType =
  'initial' | 'loading' | 'error' | 'success'

export function CancelSubscriptionInitialScreen({
  setPageState,
}: {
  setPageState: React.Dispatch<
    React.SetStateAction<CancelSubscriptionPageStateType>
  >
}) {
  const { userSubscription, setUserSubscription } = useAppContext()

  const cancelSubscription = async () => {
    try {
      setPageState(() => 'loading')
      await api.post('/subscriptions/cancel')
      setPageState(() => 'success')
      const sub = await api.get('/subscriptions/me')
      setUserSubscription({ ...userSubscription, subscription: sub.data })
    } catch (err) {
      setPageState(() => 'error')
    }
  }

  const goBack = () => {
    router.back()
  }

  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <CircleAlert className='text-red-400 size-24' />
      <View className='items-center gap-4'>
        <GoogleSansText
          variant='semi-bold'
          className='text-2xl text-center'
        >
          Do you want to cancel your subscription?
        </GoogleSansText>
        <View className='gap-2'>
          <DefaultPressable
            text='Cancel subscription'
            onPress={cancelSubscription}
            variant='destructive'
            Icon={X}
          />
          <DefaultPressable
            text='Go back'
            onPress={goBack}
            Icon={Undo2}
          />
        </View>
      </View>
    </View>
  )
}

export function CancelSubscriptionLoadingScreen() {
  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <Host matchContents>
        <CircularProgressIndicator color={BRAND_PRIMARY_COLOR} />
      </Host>
      <View className='items-center gap-4'>
        <GoogleSansText
          variant='semi-bold'
          className='text-2xl text-center'
        >
          Cancelling your subscription.
        </GoogleSansText>
      </View>
    </View>
  )
}

export function CancelSubscriptionErrorScreen() {
  const goBack = () => {
    router.back()
  }

  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <CircleAlert className='text-red-400 size-24' />
      <View className='items-center gap-4'>
        <View className='items-center'>
          <GoogleSansText
            variant='semi-bold'
            className='text-2xl'
          >
            Failed to cancel subscription.
          </GoogleSansText>
          <GoogleSansText
            variant='regular'
            className='text-center'
          >
            Please try again.
          </GoogleSansText>
        </View>
        <DefaultPressable
          text='Go back'
          onPress={goBack}
          Icon={Undo2}
        />
      </View>
    </View>
  )
}

export function CancelSubscriptionSuccessScreen() {
  const backToHome = () => {
    router.replace('/(protected)')
  }

  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <RefreshCwOff className='text-icon size-24' />
      <View className='items-center gap-4'>
        <View className='items-center'>
          <GoogleSansText
            variant='semi-bold'
            className='text-2xl'
          >
            Subscription cancelled successfully.
          </GoogleSansText>
          <GoogleSansText
            variant='regular'
            className='text-center'
          >
            You are now on the free tier.
          </GoogleSansText>
        </View>
        <DefaultPressable
          text='Back to home'
          onPress={backToHome}
          Icon={Undo2}
        />
      </View>
    </View>
  )
}

ensureInterop([X, Undo2, CircleAlert, RefreshCwOff])
