import { SafeScreen } from '@/components/app/app-layout'
import {
  CancelSubscriptionErrorScreen,
  CancelSubscriptionLoadingScreen,
} from '@/components/screens/subscription/cancel-subscription'
import {
  SubscriptionPaymentFailureScreen,
  SubscriptionPaymentProcessingScreen,
  SubscriptionPaymentScreenStateType,
  SubscriptionPaymentSuccessScreen,
  SubscriptionPaymentWarningScreen,
} from '@/components/screens/subscription/subscription-payment'
import { useAppContext } from '@/context/app-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { BanknoteCheck, Undo2 } from 'lucide-react-native'
import { useState } from 'react'

export default function PurchaseSuccessScreen() {
  const { userSubscription } = useAppContext()

  const getInitialScreen: () => SubscriptionPaymentScreenStateType = () => {
    return userSubscription.subscription?.plan.default
      ? 'processing'
      : 'warning'
  }

  const [subscriptionPaymentState, setSubscriptionPaymentState] =
    useState<SubscriptionPaymentScreenStateType>('warning')

  const backToHome = () => {
    router.replace('/(protected)')
  }

  const CurrentScreen = () => {
    switch (subscriptionPaymentState) {
      case 'processing':
        return (
          <SubscriptionPaymentProcessingScreen
            setSubscriptionPaymentState={setSubscriptionPaymentState}
          />
        )
      case 'success':
        return <SubscriptionPaymentSuccessScreen />
      case 'failure':
        return <SubscriptionPaymentFailureScreen />
      case 'warning':
        return (
          <SubscriptionPaymentWarningScreen
            setSubscriptionPaymentState={setSubscriptionPaymentState}
          />
        )
      case 'cancel-processing':
        return <CancelSubscriptionLoadingScreen />
      case 'cancel-failure':
        return <CancelSubscriptionErrorScreen />
    }
  }

  return (
    <SafeScreen>
      <CurrentScreen />
    </SafeScreen>
  )
}

ensureInterop([BanknoteCheck, Undo2])
