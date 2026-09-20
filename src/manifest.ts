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
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabCapture', 'contextMenus', 'offscreen'],
}

export default manifest
