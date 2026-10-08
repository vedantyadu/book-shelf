import { vars } from 'nativewind'

export const LIGHT_BG_PRIMARY_COLOR = '#fafafa'
export const DARK_BG_PRIMARY_COLOR = '#0a0a0a'

export const BRAND_PRIMARY_COLOR = '#4e56c0'

export const LIGHT_ICON_COLOR = '#d4d4d4'
export const DARK_ICON_COLOR = '#525252'

export const themes = {
  light: vars({
    '--color-bg-primary': LIGHT_BG_PRIMARY_COLOR,
    '--color-bg-secondary': '#f5f5f5',
    '--color-bg-highlight': '#e5e5e5',
    '--color-text-primary': '#404040',
    '--color-text-secondary': '#737373',
    '--color-icon': '#d4d4d4',
    '--color-brand-primary': BRAND_PRIMARY_COLOR,
  }),
  dark: vars({
    '--color-bg-primary': DARK_BG_PRIMARY_COLOR,
    '--color-bg-secondary': '#171717',
    '--color-bg-highlight': '#262626',
    '--color-text-primary': '#fafafa',
    '--color-text-secondary': '#e5e5e5',
    '--color-icon': '#525252',
    '--color-brand-primary': BRAND_PRIMARY_COLOR,
  }),
}
