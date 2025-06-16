import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// 马赛克样式类型
type MosaicStyle = "blur" | "pixelate"

interface Settings {
  isEnabled: boolean
  style: MosaicStyle
  intensity: number
  revealRadius: number
  showDuration: number  // 显示过渡时间（毫秒）
  hideDuration: number  // 隐藏延迟时间（毫秒）
}

class TextMosaicManager {
  private settings: Settings = {
    isEnabled: true,
    style: "blur",
    intensity: 5,
    revealRadius: 150,
    showDuration: 300,  // 默认300毫秒
    hideDuration: 500   // 默认500毫秒
  }

  private mosaicElements: Set<HTMLElement> = new Set()

  constructor() {
    this.init()
  }

  private init() {
    // 加载设置
    this.loadSettings()

    // 添加样式
    this.injectStyles()

    // 确保设置已经完全加载后再处理页面
    setTimeout(() => {
      // 自动处理页面文本
      if (this.settings.isEnabled) {
        this.autoProcessPageText()
      }

      // 添加鼠标移动事件监听
      document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    }, 0)

    // 监听消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "SETTINGS_UPDATE":
          const oldSettings = { ...this.settings }
          this.settings = message.settings

          // 如果是禁用状态，直接清除所有马赛克
          if (!this.settings.isEnabled) {
            this.clearAllMosaics()
            return
          }

          // 如果之前是禁用状态，现在启用了，重新创建所有马赛克
          if (!oldSettings.isEnabled && this.settings.isEnabled) {
            this.autoProcessPageText()
            return
          }

          // 如果只是强度改变
          if (oldSettings.intensity !== this.settings.intensity && 
              oldSettings.style === this.settings.style) {
            this.updateMosaicStyles()
          } else if (oldSettings.style !== this.settings.style) {
            // 如果样式改变，需要重新应用所有马赛克
            this.updateAllMosaics()
          }
          break
        case "CLEAR_ALL":
          this.clearAllMosaics()
          break
        case "RESTORE_ALL":
          this.restoreAllMosaics()
          break
      }
    })
  }

  private async loadSettings() {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.get(["mosaicSettings"], (result) => {
        if (result.mosaicSettings) {
          // 确保新添加的配置项有默认值
          this.settings = {
            ...this.settings,
            ...result.mosaicSettings,
            showDuration: result.mosaicSettings.showDuration ?? 300,
            hideDuration: result.mosaicSettings.hideDuration ?? 500
          }
        }
        resolve()
      })
    })
  }

  private autoProcessPageText() {
    // 获取body下的所有文本节点
    const textNodes = this.getAllTextNodes(document.body)
    
    // 处理每个文本节点
    textNodes.forEach(node => {
      // 跳过空文本节点
      if (!node.textContent?.trim()) return
      
      // 跳过已经处理过的节点（在马赛克元素内的节点）
      if (node.parentElement?.closest('.text-mosaic-wrapper')) return
      
      // 创建范围
      const range = document.createRange()
      range.selectNode(node)
      
      // 检查是否在特殊元素内
      const specialElements = this.findSpecialElements(range)
      
      if (specialElements.length > 0) {
        // 如果在特殊元素内，使用特殊处理
        this.createMosaicsForSpecialSelection(range, specialElements)
      } else {
        // 普通文本节点直接处理
        this.createMosaic(range)
      }
    })
  }

  private getAllTextNodes(element: Node): Text[] {
    const textNodes: Text[] = []
    
    // 创建TreeWalker来遍历所有文本节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳过脚本和样式标签中的文本
          const parent = node.parentElement
          if (parent && (
            parent.tagName === 'SCRIPT' ||
            parent.tagName === 'STYLE' ||
            parent.tagName === 'NOSCRIPT' ||
            parent.tagName === 'IFRAME' ||
            // 跳过隐藏元素
            getComputedStyle(parent).display === 'none' ||
            getComputedStyle(parent).visibility === 'hidden'
          )) {
            return NodeFilter.FILTER_REJECT
          }
          
          // 跳过空文本节点
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT
          }
          
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )
    
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node instanceof Text) {
        textNodes.push(node)
      }
    }
    
    return textNodes
  }

  private findSpecialElements(range: Range): HTMLElement[] {
    const specialElements: HTMLElement[] = []
    const container = range.commonAncestorContainer
    
    // 如果容器本身是元素节点，也需要检查
    if (container instanceof HTMLElement) {
      if (this.isSpecialElement(container)) {
        specialElements.push(container)
      }
    }
    
    // 获取范围内的所有元素
    const iterator = document.createNodeIterator(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node: Node | null
    while ((node = iterator.nextNode())) {
      if (node instanceof HTMLElement && this.isSpecialElement(node)) {
        specialElements.push(node)
      }
    }

    return specialElements
  }

  private isSpecialElement(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element)
    return (
      element.classList.length > 0 ||  // 有类名
      element.style.cssText !== '' ||  // 有内联样式
      computedStyle.display !== 'inline' ||  // 不是内联元素
      computedStyle.position !== 'static' ||  // 有定位
      computedStyle.float !== 'none' ||  // 有浮动
      computedStyle.margin !== '0px' ||  // 有外边距
      computedStyle.padding !== '0px' ||  // 有内边距
      computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || // 有背景色
      element instanceof HTMLImageElement ||  // 是图片
      element instanceof HTMLButtonElement ||  // 是按钮
      element instanceof HTMLInputElement  // 是输入框
    )
  }

  private createMosaicsForSpecialSelection(range: Range, specialElements: HTMLElement[]) {
    // 创建一个临时的范围来处理文本
    const tempRange = range.cloneRange()
    
    // 获取所有文本节点
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (range.intersectsNode(node) && node.textContent?.trim()) {
            // 检查该文本节点是否在特殊元素内
            let parent = node.parentElement
            while (parent) {
              if (specialElements.includes(parent)) {
                // 如果文本节点在特殊元素内，我们需要特殊处理
                return NodeFilter.FILTER_ACCEPT
              }
              parent = parent.parentElement
            }
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      // 为每个文本节点创建一个新的范围
      tempRange.selectNode(node)
      if (range.intersectsNode(node)) {
        // 调整范围以仅包含交集
        const intersectionRange = this.getIntersectionRange(range, tempRange)
        if (intersectionRange) {
          this.createMosaic(intersectionRange)
        }
      }
    }
  }

  private getIntersectionRange(range1: Range, range2: Range): Range | null {
    try {
      const start = range1.compareBoundaryPoints(Range.START_TO_START, range2) <= 0
        ? range2.startContainer
        : range1.startContainer
      const startOffset = range1.compareBoundaryPoints(Range.START_TO_START, range2) <= 0
        ? range2.startOffset
        : range1.startOffset

      const end = range1.compareBoundaryPoints(Range.END_TO_END, range2) >= 0
        ? range2.endContainer
        : range1.endContainer
      const endOffset = range1.compareBoundaryPoints(Range.END_TO_END, range2) >= 0
        ? range2.endOffset
        : range1.endOffset

      const intersectionRange = document.createRange()
      intersectionRange.setStart(start, startOffset)
      intersectionRange.setEnd(end, endOffset)
      return intersectionRange
    } catch (error) {
      console.error("创建交集范围失败:", error)
      return null
    }
  }

  private createMosaic(range: Range) {
    try {
      // 创建包装元素
      const wrapper = document.createElement("span")
      wrapper.className = "text-mosaic-wrapper"
      wrapper.setAttribute("data-mosaic-style", this.settings.style)
      wrapper.setAttribute("data-mosaic-intensity", this.settings.intensity.toString())

      // 提取选中内容
      const contents = range.extractContents()
      wrapper.appendChild(contents)

      // 应用马赛克样式
      this.applyMosaicStyle(wrapper)

      // 插入到原位置
      range.insertNode(wrapper)

      // 记录元素
      this.mosaicElements.add(wrapper)

      // 确保事件监听器存在
      this.ensureEventListeners(wrapper)
    } catch (error) {
      console.error("创建马赛克失败:", error)
    }
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.settings.isEnabled) return

    const mouseX = event.clientX
    const mouseY = event.clientY

    this.mosaicElements.forEach(mosaicElement => {
      const rect = mosaicElement.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // 计算与鼠标的距离
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) +
        Math.pow(mouseY - centerY, 2)
      )

      // 如果在显示半径内，显示内容
      if (distance <= this.settings.revealRadius) {
        this.revealElement(mosaicElement)
      } else {
        this.restoreElement(mosaicElement)
      }
    })
  }

  private revealElement(element: HTMLElement) {
    if (element.hasAttribute('data-revealed')) return

    // 保存当前的马赛克样式
    const style = element.getAttribute("data-mosaic-style")
    const intensity = element.getAttribute("data-mosaic-intensity")
    element.setAttribute("data-previous-style", style || "")
    element.setAttribute("data-previous-intensity", intensity || "")
    element.setAttribute('data-revealed', 'true')

    // 设置过渡时间
    element.style.transition = `all ${this.settings.showDuration}ms ease`

    // 临时移除马赛克效果
    element.style.filter = "none"
    element.style.textShadow = "none"
    element.style.color = "inherit"
    element.style.backgroundColor = "transparent"
  }

  private restoreElement(element: HTMLElement) {
    if (!element.hasAttribute('data-revealed')) return

    // 设置过渡时间
    element.style.transition = `all ${this.settings.showDuration}ms ease`

    // 恢复之前的马赛克样式
    const previousStyle = element.getAttribute("data-previous-style")
    const previousIntensity = element.getAttribute("data-previous-intensity")
    
    if (previousStyle && previousIntensity) {
      element.setAttribute("data-mosaic-style", previousStyle)
      element.setAttribute("data-mosaic-intensity", previousIntensity)
      
      // 重新应用马赛克样式
      this.applyMosaicStyle(element)
    }

    // 移除已显示标记
    element.removeAttribute('data-revealed')
  }

  private applyMosaicStyle(element: HTMLElement) {
    const style = this.settings.style
    const intensity = this.settings.intensity

    // 移除现有样式类
    element.className =
      element.className.replace(/mosaic-\w+/g, "").trim() +
      ` text-mosaic-wrapper mosaic-${style}`

    // 重置所有可能的样式
    element.style.filter = "none"
    element.style.imageRendering = "auto"
    element.style.backgroundColor = "transparent"
    element.style.color = "inherit"
    element.style.textShadow = "none"
    element.style.borderRadius = "0"

    // 根据不同样式应用不同效果
    switch (style) {
      case "blur":
        element.style.filter = `blur(${intensity}px)`
        break
      case "pixelate":
        element.style.filter = `blur(${intensity * 0.5}px)`
        element.style.imageRendering = "pixelated"
        break
    }
  }

  private removeMosaic(element: HTMLElement) {
    // 恢复原始文本和样式
    const fragment = document.createDocumentFragment()
    
    const restoreNode = (node: Node) => {
      if (node instanceof HTMLElement) {
        // 恢复原始样式
        const originalStyle = node.getAttribute('data-original-style')
        if (originalStyle) {
          node.style.cssText = originalStyle
        }
        
        // 处理子节点
        Array.from(node.childNodes).forEach(restoreNode)
      }
    }
    
    // 恢复原始文本
    if (element.hasAttribute("data-original-text")) {
      element.textContent = element.getAttribute("data-original-text")
    }
    
    // 处理所有子节点
    while (element.firstChild) {
      const child = element.firstChild
      if (child instanceof HTMLElement) {
        restoreNode(child)
      }
      fragment.appendChild(child)
    }

    // 替换包装元素
    element.parentNode?.replaceChild(fragment, element)

    // 从记录中移除
    this.mosaicElements.delete(element)
  }

  private updateAllMosaics() {
    // 先清除所有马赛克
    this.clearAllMosaics()
    // 如果启用了，重新创建马赛克
    if (this.settings.isEnabled) {
      this.autoProcessPageText()
    }
  }

  private clearAllMosaics() {
    // 转换为数组避免在迭代时修改集合
    const elements = Array.from(this.mosaicElements)
    elements.forEach((element) => {
      if (element.parentNode) {
        this.removeMosaic(element)
      }
    })
    this.mosaicElements.clear()
  }

  private injectStyles() {
    if (document.getElementById("text-mosaic-styles")) return

    const style = document.createElement("style")
    style.id = "text-mosaic-styles"
    style.textContent = `
      .text-mosaic-wrapper {
        cursor: pointer;
        position: relative;
        display: inline;
        will-change: filter, color, background-color, text-shadow;
      }
      
      .text-mosaic-wrapper:hover {
        opacity: 1;
        transform: none;
      }
      
      .mosaic-blur {
        backdrop-filter: blur(2px);
      }
      
      .mosaic-pixelate {
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }
    `

    document.head.appendChild(style)
  }

  private restoreAllMosaics() {
    // 清除现有的马赛克
    this.clearAllMosaics()
    // 重新处理页面文本
    this.autoProcessPageText()
  }

  // 只更新样式，不重新创建马赛克
  private updateMosaicStyles() {
    this.mosaicElements.forEach((element) => {
      if (element.parentNode) {
        // 更新强度属性
        element.setAttribute("data-mosaic-intensity", this.settings.intensity.toString())
        
        // 确保事件监听器存在
        this.ensureEventListeners(element)
        
        // 如果元素当前不是显示状态，应用马赛克样式
        if (!element.hasAttribute('data-revealed')) {
          this.applyMosaicStyle(element)
        }
      }
    })
  }

  private ensureEventListeners(element: HTMLElement) {
    // 由于我们现在使用全局鼠标移动事件，这个方法不再需要做任何事情
    return
  }
}

// 初始化
new TextMosaicManager()
