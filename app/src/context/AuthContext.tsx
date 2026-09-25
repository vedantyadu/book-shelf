import { api } from '@/lib/api'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type AuthType = {
  userDataFetched: boolean
  user: {
    id: string
    email: string
    name: string
    picture: string
  } | null
}

interface AuthContextType {
  auth: AuthType
  setAuth: (auth: AuthType) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthType>({
    userDataFetched: false,
    user: null,
  })

  const getUserData = async () => {
    try {
      const res = await api.get('/users/me')
      setAuth({ userDataFetched: true, user: res.data })
    } catch (err) {
      setAuth({ userDataFetched: true, user: null })
    }
  }

  useEffect(() => {
    getUserData()
  }, [])

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
