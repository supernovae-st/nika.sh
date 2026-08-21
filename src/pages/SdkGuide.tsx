import { lazy } from 'react'
import { SsgLazy } from '../lib/ssg-lazy'
import '../sections/v4-home.css'
import './page-chrome.css'
import './sdk-page.css'

const SdkGuidePageBody = lazy(() => import('../components/SdkGuidePageBody'))
let ServerSdkGuidePageBody: typeof import('../components/SdkGuidePageBody')['default'] | null = null
if (import.meta.env.SSR) ServerSdkGuidePageBody = (await import('../components/SdkGuidePageBody')).default

export function Component() {
  return (
    <SsgLazy id="sdk-guide-poster" poster={ServerSdkGuidePageBody ? <ServerSdkGuidePageBody /> : undefined}>
      <SdkGuidePageBody />
    </SsgLazy>
  )
}
