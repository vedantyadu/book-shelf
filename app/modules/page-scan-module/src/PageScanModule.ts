import { requireNativeModule } from 'expo'

// declare class PageScanModule extends NativeModule<{}> {
//   scanPage(): Promise<string[]>
// }

// export default requireNativeModule<PageScanModule>('PageScanModule')

export type Frame = { x: number; y: number; width: number; height: number }

export type TextLine = { text: string; frame: Frame | null }

export type TextBlock = {
  text: string
  frame: Frame | null
  lines: TextLine[]
}

export type ExtractTextResult = {
  text: string
  blocks: TextBlock[]
}

export type ScanResult = {
  pages: string[]
  pageCount: number
} | null

const PageScanModule = requireNativeModule('PageScanModule')

export function scanPage(): Promise<ScanResult> {
  return PageScanModule.scanPage()
}

export function extractText(uri: string): Promise<ExtractTextResult> {
  return PageScanModule.extractText(uri)
}
