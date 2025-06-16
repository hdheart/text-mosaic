# Text Mosaic Extension

<div class="language-tabs">
  <button class="tab-button active" onclick="switchLanguage('zh')">中文</button>
  <button class="tab-button" onclick="switchLanguage('en')">English</button>
</div>

<style>
.language-tabs {
  margin: 20px 0;
  border-bottom: 1px solid #eaecef;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-right: 16px;
}

.tab-button.active {
  color: #0366d6;
  border-bottom-color: #0366d6;
}

.language-content {
  display: none;
}

.language-content.active {
  display: block;
}
</style>

<script>
function switchLanguage(lang) {
  // 更新按钮状态
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.tab-button[onclick="switchLanguage('${lang}')"]`).classList.add('active');
  
  // 更新内容显示
  document.querySelectorAll('.language-content').forEach(content => {
    content.classList.remove('active');
  });
  document.querySelector(`.language-content[data-lang="${lang}"]`).classList.add('active');
}
</script>

<div class="language-content active" data-lang="zh">

一个简单而强大的文字马赛克浏览器插件，让你可以优雅地保护敏感文字信息。

## 功能特点

- 🎭 多种马赛克样式
  - 模糊效果
  - 像素化
  - 方块
  - 波浪

- 🎯 智能范围显示
  - 以鼠标位置为中心显示周围文字
  - 可调节显示范围（50-400px）
  - 平滑的显示/隐藏过渡

- ⚡ 流畅动画效果
  - 可自定义显示过渡时间
  - 可自定义隐藏过渡时间
  - 自然的动画效果

- 🛠️ 便捷操作
  - 一键清除所有马赛克
  - 一键恢复所有马赛克
  - 实时强度调节

## 安装方法

1. 下载本仓库代码
2. 打开 Chrome 扩展程序页面 (chrome://extensions/)
3. 开启开发者模式
4. 点击"加载已解压的扩展程序"
5. 选择本仓库的目录

## 使用方法

1. 安装插件后，点击工具栏中的插件图标打开设置面板
2. 选择喜欢的马赛克样式
3. 调整强度、范围和过渡时间
4. 移动鼠标，周围文字会自动显示

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 技术栈

- React
- TypeScript
- Plasmo Framework

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

</div>

<div class="language-content" data-lang="en">

A simple yet powerful text mosaic browser extension that elegantly protects sensitive text information.

## Features

- 🎭 Multiple Mosaic Styles
  - Blur effect
  - Pixelation
  - Block
  - Wave

- 🎯 Smart Range Display
  - Mouse position-based text reveal
  - Adjustable display radius (50-400px)
  - Smooth show/hide transitions

- ⚡ Smooth Animations
  - Customizable show transition time
  - Customizable hide transition time
  - Natural animation effects

- 🛠️ Convenient Operations
  - One-click clear all mosaics
  - One-click restore all mosaics
  - Real-time intensity adjustment

## Installation

1. Download the repository code
2. Open Chrome Extensions page (chrome://extensions/)
3. Enable Developer Mode
4. Click "Load unpacked extension"
5. Select the repository directory

## Usage

1. After installation, click the extension icon in the toolbar to open settings
2. Choose your preferred mosaic style
3. Adjust intensity, range, and transition time
4. Move your mouse to reveal surrounding text

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build
```

## Tech Stack

- React
- TypeScript
- Plasmo Framework

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

</div>