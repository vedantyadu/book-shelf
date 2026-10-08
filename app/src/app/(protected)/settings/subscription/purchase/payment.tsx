import { SafeScreen } from '@/components/app/app-layout'
import {
  SubscriptionPaymentFailureScreen,
  SubscriptionPaymentProcessingScreen,
  SubscriptionPaymentScreenStateType,
  SubscriptionPaymentSuccessScreen,
} from '@/components/screens/subscription/subscription-payment'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { BanknoteCheck, Undo2 } from 'lucide-react-native'
import { useState } from 'react'

export default function PurchaseSuccessScreen() {
  const [subscriptionPaymentState, setSubscriptionPaymentState] =
    useState<SubscriptionPaymentScreenStateType>('processing')

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
    }
  }

  return (
    <SafeScreen>
      <CurrentScreen />
    </SafeScreen>
  )
}

ensureInterop([BanknoteCheck, Undo2])
