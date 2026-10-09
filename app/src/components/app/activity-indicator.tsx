import { BRAND_PRIMARY_COLOR } from '@/utils/themes'
import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose'
import { size } from '@expo/ui/jetpack-compose/modifiers'

export function CircleActivityIndicator({
  iconSize = 48,
  strokeWidth = 4,
}: {
  iconSize?: number
  strokeWidth?: number
}) {
  return (
    <Host matchContents>
      <CircularProgressIndicator
        modifiers={[size(iconSize, iconSize)]}
        color={BRAND_PRIMARY_COLOR}
        strokeWidth={strokeWidth}
      />
    </Host>
  )
}
