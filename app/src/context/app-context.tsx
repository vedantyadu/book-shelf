import { api } from '@/lib/api'
import { SubscriptionType } from '@/types/subscription'
import { UserType } from '@/types/user'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type AuthType = {
  user: UserType | null
  loading: boolean
}

type userSubscriptionType = {
  subscription: SubscriptionType | null
  loading: boolean
}

interface AppContextType {
  auth: AuthType
  setAuth: (auth: AuthType) => void
  userSubscription: userSubscriptionType
  setUserSubscription: (userSubscription: userSubscriptionType) => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthType>({
    user: null,
    loading: true,
  })
  const [userSubscription, setUserSubscription] =
    useState<userSubscriptionType>({
      subscription: null,
      loading: true,
    })

  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await api.get('/users/me')
        setAuth({ loading: false, user: res.data })
      } catch (err) {
        setAuth({ loading: false, user: null })
      }
    }
    getUserData()
  }, [])

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const res = await api.get('/subscriptions/me')
        setUserSubscription({ loading: false, subscription: res.data })
      } catch (err) {
        setUserSubscription({ loading: false, subscription: null })
      }
    }
    if (!auth.loading && auth.user) {
      loadSubscription()
    }
  }, [auth])

  return (
    <AppContext.Provider
      value={{ auth, setAuth, userSubscription, setUserSubscription }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
