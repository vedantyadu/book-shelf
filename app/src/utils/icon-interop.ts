import { cssInterop } from 'nativewind'
import { type ComponentType } from 'react'

export type IconComponent = ComponentType<{
  className?: string
  [key: string]: any
}>

const interopCache = new Set<IconComponent>()

export function ensureInterop(icons: IconComponent[]) {
  icons.forEach((Icon) => {
    if (interopCache.has(Icon)) return
    cssInterop(Icon, {
      className: {
        target: 'style',
        nativeStyleToProp: {
          color: true,
          width: true,
          height: true,
        },
      },
    })
    interopCache.add(Icon)
  })
}
