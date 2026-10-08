import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import { LoadScreen } from '@/components/app/load-screen'
import { PurchaseSubscription } from '@/components/screens/subscription/purchase-subscription'
import { api } from '@/lib/api'
import { SubscriptionPlanType } from '@/types/subscription'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

export default function PurchasePlanScreen() {
  const { plan_id } = useLocalSearchParams<{ plan_id: string }>()

  const [plan, setPlan] = useState<SubscriptionPlanType>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const res = await api.get(`subscriptions/plans/${plan_id}`)
        setPlan(res.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlanDetails()
  }, [])

  const ScreenContent = () => {
    switch (loading) {
      case true:
        return <LoadScreen />
      case false:
        return (
          <View className='px-4'>
            {plan && (
              <PurchaseSubscription
                plan={plan}
                plan_id={plan_id}
              />
            )}
          </View>
        )
    }
  }

  return (
    <SafeScreen>
      <TopBar title='Purchase Subscription' />
      <ScreenContent />
      <BottomBar />
    </SafeScreen>
  )
}
