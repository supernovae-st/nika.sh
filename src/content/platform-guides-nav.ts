import { ENGINE_VERSION } from '../content'

export type PlatformGuideId = 'arm64' | 'servers' | 'local-models'

/** Chrome-safe route labels. The full operating corpus stays behind the
    platform-guides access door. Tuple order: id, label, eyebrow, title,
    description. Keeping the route plate positional avoids shipping the full
    guide object grammar in the synchronous route graph. */
export const PLATFORM_GUIDE_NAV = [
  ['arm64', 'ARM64', `native lane · ${ENGINE_VERSION}`, 'Run Nika natively on ARM64.', 'Native Nika for Apple silicon and 64-bit ARM Linux.'],
  ['servers', 'Servers', 'linux · headless · ci', 'Run Nika on a server.', 'Linux and CI with a visible sandbox and verifiable trace.'],
  ['local-models', 'Local models', 'zero key · loopback', 'Keep the model on your machine.', 'Keep inference local through a local provider.'],
] as const satisfies readonly (readonly [PlatformGuideId, string, string, string, string])[]
