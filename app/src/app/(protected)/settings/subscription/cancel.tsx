import { SafeScreen } from '@/components/app/app-layout'
import {
  CancelSubscriptionErrorScreen,
  CancelSubscriptionInitialScreen,
  CancelSubscriptionLoadingScreen,
  CancelSubscriptionPageStateType,
  CancelSubscriptionSuccessScreen,
} from '@/components/screens/subscription/cancel-subscription'
import { useState } from 'react'

export default function CancelSubscriptionScreen() {
  const [pageState, setPageState] =
    useState<CancelSubscriptionPageStateType>('initial')

  const RenderAccordingToState = () => {
    switch (pageState) {
      case 'initial':
        return <CancelSubscriptionInitialScreen setPageState={setPageState} />
      case 'loading':
        return <CancelSubscriptionLoadingScreen />
      case 'error':
        return <CancelSubscriptionErrorScreen />
      case 'success':
        return <CancelSubscriptionSuccessScreen />
    }
  }

  return (
    <SafeScreen>
      <RenderAccordingToState />
    </SafeScreen>
  )
}
