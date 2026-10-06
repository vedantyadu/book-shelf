import { createContext, useContext, useState } from 'react'
import { ScanResult } from '../../modules/page-scan-module/src/PageScanModule'

type ScanContextType = {
  scanResult: ScanResult | null
  setScanResult: (result: ScanResult | null) => void
}

const ScanContext = createContext<ScanContextType | undefined>(undefined)

export function ScanContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  return (
    <ScanContext.Provider value={{ scanResult, setScanResult }}>
      {children}
    </ScanContext.Provider>
  )
}

export function useScanContext() {
  const context = useContext(ScanContext)
  if (context === undefined) {
    throw new Error('useScanContext must be used within a ScanContextProvider')
  }
  return context
}
