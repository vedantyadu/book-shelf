import { CircleActivityIndicator } from '@/components/app/activity-indicator'
import TextAlert from '@/components/app/alert'
import { GoogleSansText } from '@/components/ui/fonts'
import { TextInputField } from '@/components/ui/input'
import { ToggleSwitch } from '@/components/ui/switch'
import { useNewBookContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { AlertCircle, ArrowRight, Check, FilePlus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

export function NewBookDetails() {
  return (
    <View className='gap-2'>
      <TextInputField
        label='Book name'
        placeholder='Animal Farm'
        required
      />
      <TextInputField
        label='Author name'
        placeholder='George Orwell'
      />
    </View>
  )
}

export function NewBookPages() {
  const { pages } = useNewBookContext()

  const goToPages = () => {
    router.push('/(protected)/new-book/pages')
  }

  const pageLabel = pages.length === 1 ? 'page' : 'pages'
  const text =
    pages.length === 0 ? 'Scan pages' : `${pages.length} ${pageLabel}`

  const PageIcon = () => {
    if (pages.length === 0) {
      return (
        <View className='size-4 items-center justify-center'>
          <FilePlus className='size-4 text-icon' />
        </View>
      )
    }

    if (
      pages.some(
        (page) => page.state === 'processing' || page.state === 'queued',
      )
    ) {
      return (
        <CircleActivityIndicator
          iconSize={12}
          strokeWidth={2}
        />
      )
    }

    if (pages.some((page) => page.state === 'error')) {
      return (
        <View className='size-4 items-center justify-center'>
          <AlertCircle className='size-4 text-amber-500' />
        </View>
      )
    }

    return (
      <View className='size-4 items-center justify-center'>
        <Check className='size-4 text-brand-primary' />
      </View>
    )
  }

  return (
    <View className='flex-row items-center justify-between rounded-xl'>
      <View className='flex-row items-center gap-2'>
        <GoogleSansText
          variant='medium'
          className='text-text-secondary'
        >
          {text}
        </GoogleSansText>
        <PageIcon />
      </View>
      <Pressable
        className='size-8 items-center justify-center'
        onPress={goToPages}
      >
        <ArrowRight className='text-text-secondary size-6' />
      </Pressable>
    </View>
  )
}

export function NewBookCloud() {
  const [cloudSync, setCloudSync] = useState(false)

  return (
    <View className='flex-row items-center justify-between rounded-xl'>
      <View className='gap-1 flex-1'>
        <GoogleSansText
          variant='medium'
          className='text-text-secondary'
        >
          Cloud backup
        </GoogleSansText>
        <TextAlert
          variant='muted'
          text='Cloud backup requires an active subscription plan.'
        />
      </View>
      <ToggleSwitch
        value={cloudSync}
        onValueChange={setCloudSync}
      />
    </View>
  )
}

ensureInterop([ArrowRight, FilePlus])
