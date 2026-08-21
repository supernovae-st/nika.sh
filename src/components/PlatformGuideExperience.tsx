import { useParams } from 'react-router'
import { ARM64_RELEASE_ASSETS, PLATFORM_GUIDES } from '../content/platform-guides'
import PlatformGuideBody from './PlatformGuideBody'

export default function PlatformGuideExperience() {
  const { guide: guideId } = useParams()
  const guide = PLATFORM_GUIDES.find((entry) => entry.id === guideId) ?? PLATFORM_GUIDES[0]
  return <PlatformGuideBody guide={guide} assets={[...ARM64_RELEASE_ASSETS]} />
}
