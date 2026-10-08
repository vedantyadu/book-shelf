import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { useAppContext } from '@/context/app-context'
import { api } from '@/lib/api'
import { ensureInterop } from '@/utils/icon-interop'
import {
  BRAND_PRIMARY_COLOR,
  DARK_BG_PRIMARY_COLOR,
  LIGHT_BG_PRIMARY_COLOR,
} from '@/utils/themes'
import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose'
import { router, useLocalSearchParams } from 'expo-router'
import { BanknoteCheck, BanknoteX, Undo2 } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { View } from 'react-native'
import RazorpayCheckout, { CheckoutOptions } from 'react-native-razorpay'

export type SubscriptionPaymentScreenStateType =
  'processing' | 'success' | 'failure'

export function SubscriptionPaymentSuccessScreen() {
  const backToHome = () => {
    router.replace('/(protected)')
  }

  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <BanknoteCheck className='text-green-600 size-24' />
      <View className='items-center gap-4'>
        <View className='items-center'>
          <GoogleSansText
            variant='semi-bold'
            className='text-2xl text-center'
          >
            Payment successful!
          </GoogleSansText>
          <GoogleSansText
            variant='regular'
            className='text-center'
          >
            Your subscription is now active.
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

export function SubscriptionPaymentFailureScreen() {
  const goBack = () => {
    router.back()
  }

  return (
    <View className='flex-1 items-center justify-center gap-8'>
      <BanknoteX className='text-red-500 size-24' />
      <View className='items-center gap-4'>
        <View className='items-center'>
          <GoogleSansText
            variant='semi-bold'
            className='text-2xl'
          >
            Payment failed!
          </GoogleSansText>
          <GoogleSansText
            variant='regular'
            className='text-center'
          >
            Please try again.
          </GoogleSansText>
        </View>
        <DefaultPressable
          text='Back to plan'
          onPress={goBack}
          Icon={Undo2}
        />
      </View>
    </View>
  )
}

export function SubscriptionPaymentProcessingScreen({
  setSubscriptionPaymentState,
}: {
  setSubscriptionPaymentState: React.Dispatch<
    React.SetStateAction<SubscriptionPaymentScreenStateType>
  >
}) {
  const { userSubscription, setUserSubscription } = useAppContext()
  const { colorScheme } = useColorScheme()
  const params = useLocalSearchParams()
  const plan_id = params.plan_id as string

  const purchasePlan = async () => {
    try {
      const res = await api.post(`/subscriptions/plans/${plan_id}/purchase`)

      const options = {
        subscription_id: res.data.subscription_id,
        key: res.data.key,
        name: 'Bookshelf',
        description: res.data.plan_name,
        theme: {
          color: BRAND_PRIMARY_COLOR,
          backdrop_color:
            (colorScheme ?? 'light') === 'light'
              ? LIGHT_BG_PRIMARY_COLOR
              : DARK_BG_PRIMARY_COLOR,
        },
      }

      RazorpayCheckout.open(
        options as CheckoutOptions,
        async (data) => {
          try {
            await api.post('/subscriptions/verify', data)
            const sub = await api.get('/subscriptions/me')
            setUserSubscription({ ...userSubscription, subscription: sub.data })
            setSubscriptionPaymentState(() => 'success')
          } catch (err) {
            setSubscriptionPaymentState(() => 'failure')
          }
        },
        () => {
          setSubscriptionPaymentState(() => 'failure')
        },
      )
    } catch (err) {
      setSubscriptionPaymentState(() => 'failure')
    }
  }

  useEffect(() => {
    purchasePlan()
  }, [])

  return (
    <View className='flex-1 items-center justify-center gap-8 p-4'>
      <Host matchContents>
        <CircularProgressIndicator color={BRAND_PRIMARY_COLOR} />
      </Host>
      <View className='items-center'>
        <GoogleSansText
          variant='semi-bold'
          className='text-2xl text-center'
        >
          Processing payment.
        </GoogleSansText>
        <View className='items-center'>
          <GoogleSansText
            variant='regular'
            className='text-center'
          >
            Please do not close or navigate away from this screen.
          </GoogleSansText>
        </View>
      </View>
    </View>
  )
}

ensureInterop([BanknoteCheck, BanknoteX, Undo2])
