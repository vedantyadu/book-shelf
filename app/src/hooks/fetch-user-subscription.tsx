import { useAppContext } from '@/context/app-context'
import { api } from '@/lib/api'
import { useEffect } from 'react'

export function useFetchUserSubscription() {
  const { userSubscription, setUserSubscription } = useAppContext()

  useEffect(() => {
    const fetchPlanDetails = async () => {
      const sub = await api.get('subscriptions/me')
      setUserSubscription({ ...userSubscription, subscription: sub.data })
    }
    fetchPlanDetails()
  }, [])

  return { userSubscription }
}
