import type { ManifestV3Export } from '@crxjs/vite-plugin'

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Vela — эквалайзер',
  description: 'Настройка звука вкладок в Chrome.',
  version: '0.1.0',
  action: {
    default_title: 'Открыть Vela',
    default_popup: 'index.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabs', 'tabCapture', 'contextMenus'],
}

export default manifest
