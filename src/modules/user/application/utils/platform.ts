import type { PlatformEnum } from '@/modules/user/application/models'

const PLATFORM_LABEL_KEY_MAP: Record<PlatformEnum, string> = {
  NATIVE: 'layout.profile.platform.native',
  GITHUB: 'layout.profile.platform.github',
  WECHAT: 'layout.profile.platform.wechat',
}

export function resolvePlatformLabelKey(platform?: PlatformEnum | null): string {
  if (!platform) {
    return PLATFORM_LABEL_KEY_MAP.NATIVE
  }

  return PLATFORM_LABEL_KEY_MAP[platform] ?? PLATFORM_LABEL_KEY_MAP.NATIVE
}
