import type { ManifestV3Export } from '@crxjs/vite-plugin'

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'vela',
  description: 'Настройка звука вкладок в Chrome.',
  version: '0.1.0',
  minimum_chrome_version: '116',
  action: {
    default_title: 'vela',
    default_popup: 'index.html',
    default_icon: {
      16: 'icons/vela-prem-bg.png',
      32: 'icons/vela-prem-bg.png',
      48: 'icons/vela-prem-bg.png',
      128: 'icons/vela-prem-bg.png',
    },
  },
  icons: {
    16: 'icons/vela-prem-bg.png',
    32: 'icons/vela-prem-bg.png',
    48: 'icons/vela-prem-bg.png',
    128: 'icons/vela-prem-bg.png',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabCapture', 'contextMenus', 'offscreen'],
}

export default manifest
