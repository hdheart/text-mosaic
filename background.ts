// background.ts - 后台脚本

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认配置
  const defaultSettings = {
    isEnabled: true,
    style: "blur",
    intensity: 5
  }

  chrome.storage.sync.set({ mosaicSettings: defaultSettings })

  console.log("文字马赛克插件已安装")
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_SETTINGS":
      chrome.storage.sync.get(["mosaicSettings"], (result) => {
        sendResponse(
          result.mosaicSettings || {
            isEnabled: true,
            style: "blur",
            intensity: 5
          }
        )
      })
      return true // 保持消息通道开放以进行异步响应

    case "SAVE_SETTINGS":
      chrome.storage.sync.set({ mosaicSettings: message.settings }, () => {
        sendResponse({ success: true })
      })
      return true

    default:
      break
  }
})

// 监听标签页更新，可以用于重新注入脚本（如果需要）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // 页面加载完成后可以执行一些初始化操作
    console.log(`页面加载完成: ${tab.url}`)
  }
})

// 处理扩展图标点击（可选功能）
chrome.action.onClicked.addListener((tab) => {
  // 如果需要，可以在这里处理图标点击事件
  // 比如快速切换开关状态
  chrome.storage.sync.get(["mosaicSettings"], (result) => {
    const currentSettings = result.mosaicSettings || {
      isEnabled: true,
      style: "blur",
      intensity: 5
    }

    const newSettings = {
      ...currentSettings,
      isEnabled: !currentSettings.isEnabled
    }

    chrome.storage.sync.set({ mosaicSettings: newSettings }, () => {
      // 通知当前标签页更新设置
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "SETTINGS_UPDATE",
          settings: newSettings
        })
      }
    })
  })
})
