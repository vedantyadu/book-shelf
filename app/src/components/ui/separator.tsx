import { View } from 'react-native'
import { twMerge } from 'tailwind-merge'

export function Separator({ className }: { className?: string }) {
  return <View className={twMerge('h-px bg-bg-highlight', className)} />
}
