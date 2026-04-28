import { createApp } from 'vue'
import IconfontSprite from '@/assets/iconfont/generated/IconfontSprite'

const iconfontSpriteRootId = 'app-iconfont-sprite-root'

export function mountIconfontSprite() {
  if (document.getElementById(iconfontSpriteRootId)) {
    return
  }

  const host = document.createElement('div')
  host.id = iconfontSpriteRootId
  document.body.prepend(host)

  createApp(IconfontSprite).mount(host)
}
