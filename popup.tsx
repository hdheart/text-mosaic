import { useEffect, useState } from "react"

import "./popup.css"

// 马赛克样式类型
type MosaicStyle = "blur" | "pixelate"

interface Settings {
  isEnabled: boolean
  style: MosaicStyle
  intensity: number
  revealRadius: number
  showDuration: number
  hideDuration: number
}

function IndexPopup() {
  const [settings, setSettings] = useState<Settings>({
    isEnabled: true,
    style: "blur",
    intensity: 5,
    revealRadius: 150,
    showDuration: 300,
    hideDuration: 500
  })

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(["mosaicSettings"], (result) => {
      if (result.mosaicSettings) {
        setSettings({
          ...settings,
          ...result.mosaicSettings,
          showDuration: result.mosaicSettings.showDuration ?? 300,
          hideDuration: result.mosaicSettings.hideDuration ?? 500
        })
      }
    })
  }, [])

  // 保存设置
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings)
    chrome.storage.sync.set({ mosaicSettings: newSettings })

    // 通知content script更新设置
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "SETTINGS_UPDATE",
          settings: newSettings
        })
      }
    })
  }

  const handleToggle = () => {
    saveSettings({ ...settings, isEnabled: !settings.isEnabled })
  }

  const handleStyleChange = (style: MosaicStyle) => {
    saveSettings({ ...settings, style })
  }

  const handleIntensityChange = (intensity: number) => {
    saveSettings({ ...settings, intensity })
  }

  const handleRadiusChange = (radius: number) => {
    saveSettings({ ...settings, revealRadius: radius })
  }

  const handleShowDurationChange = (duration: number) => {
    saveSettings({ ...settings, showDuration: duration })
  }

  const handleHideDurationChange = (duration: number) => {
    saveSettings({ ...settings, hideDuration: duration })
  }

  const clearAllMosaics = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "CLEAR_ALL" })
      }
    })
  }

  const restoreAllMosaics = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RESTORE_ALL" })
      }
    })
  }

  const styleOptions = [
    { value: "blur" as MosaicStyle, label: "模糊", icon: "🔍" },
    { value: "pixelate" as MosaicStyle, label: "像素化", icon: "🎮" }
  ]

  return (
    <div className="popup-container">
      <div className="header">
        <h2>🎭 文字马赛克</h2>
        <div className="toggle-container">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={handleToggle}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">
            {settings.isEnabled ? "已启用" : "已禁用"}
          </span>
        </div>
      </div>

      {settings.isEnabled && (
        <>
          <div className="section">
            <h3>马赛克样式</h3>
            <div className="style-grid">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  className={`style-btn ${settings.style === option.value ? "active" : ""}`}
                  onClick={() => handleStyleChange(option.value)}>
                  <span className="style-icon">{option.icon}</span>
                  <span className="style-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>强度调节</h3>
            <div className="intensity-container">
              <input
                type="range"
                min="1"
                max="10"
                value={settings.intensity}
                onChange={(e) => handleIntensityChange(Number(e.target.value))}
                className="intensity-slider"
              />
              <span className="intensity-value">{settings.intensity}</span>
            </div>
          </div>

          <div className="section">
            <h3>显示范围</h3>
            <div className="intensity-container">
              <input
                type="range"
                min="50"
                max="400"
                step="25"
                value={settings.revealRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="intensity-slider"
              />
              <span className="intensity-value">{settings.revealRadius}px</span>
            </div>
          </div>

          <div className="section">
            <h3>过渡时间</h3>
            <div className="duration-settings">
              <div className="duration-item">
                <label>显示过渡时间</label>
                <div className="intensity-container">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={settings.showDuration}
                    onChange={(e) => handleShowDurationChange(Number(e.target.value))}
                    className="intensity-slider"
                  />
                  <span className="duration-value">{settings.showDuration}ms</span>
                </div>
              </div>
              <div className="duration-item">
                <label>隐藏延迟时间</label>
                <div className="intensity-container">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={settings.hideDuration}
                    onChange={(e) => handleHideDurationChange(Number(e.target.value))}
                    className="intensity-slider"
                  />
                  <span className="duration-value">{settings.hideDuration}ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>操作</h3>
            <p className="instruction">💡 鼠标移动到文字上可以显示范围内的内容</p>
            <div className="action-buttons">
              <button className="action-btn clear-btn" onClick={clearAllMosaics}>
                🧹 清除马赛克
              </button>
              <button className="action-btn restore-btn" onClick={restoreAllMosaics}>
                🔄 恢复马赛克
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .radius-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 8px;
        }

        .radius-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: #ddd;
          border-radius: 2px;
          outline: none;
        }

        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #666;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .radius-slider::-webkit-slider-thumb:hover {
          background: #444;
          transform: scale(1.1);
        }

        .radius-value {
          min-width: 60px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .duration-settings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .duration-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .duration-item label {
          font-size: 14px;
          color: #fff;
          margin-bottom: 4px;
        }

        .duration-value {
          min-width: 70px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          color: #2196F3;
          background: rgba(33, 150, 243, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .intensity-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .intensity-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: #ddd;
          border-radius: 2px;
          outline: none;
        }

        .intensity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #2196F3;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .intensity-slider::-webkit-slider-thumb:hover {
          background: #1976D2;
          transform: scale(1.1);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .clear-btn {
          background-color: #ff6b6b;
          color: white;
        }

        .clear-btn:hover {
          background-color: #ff5252;
        }

        .restore-btn {
          background-color: #4CAF50;
          color: white;
        }

        .restore-btn:hover {
          background-color: #45a049;
        }
      `}</style>
    </div>
  )
}

export default IndexPopup
