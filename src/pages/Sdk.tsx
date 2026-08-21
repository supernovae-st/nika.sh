import { lazy } from 'react'
import { SsgLazy } from '../lib/ssg-lazy'
import '../sections/v4-home.css'
import './page-chrome.css'
import './sdk-page.css'

const SdkHubBody = lazy(() => import('../components/SdkHubBody'))
let ServerSdkHubBody: typeof import('../components/SdkHubBody')['default'] | null = null
if (import.meta.env.SSR) ServerSdkHubBody = (await import('../components/SdkHubBody')).default

export function Component() {
  return (
    <main className="theme-dark v4page sdk-page">
      <SsgLazy id="sdk-hub-poster" poster={ServerSdkHubBody ? <ServerSdkHubBody /> : undefined}>
        <SdkHubBody />
      </SsgLazy>
    </main>
  )
}
