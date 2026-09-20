const MUTE_MENU_ID = 'vela-toggle-tab-mute'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MUTE_MENU_ID,
      title: 'Включить/выключить звук вкладки',
      contexts: ['tab'],
    })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MUTE_MENU_ID || tab.id === undefined) return
  void chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted })
})
