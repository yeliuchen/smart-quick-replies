# 嵌套设置折叠与面板拖动优化设计

## 目标

把智能快捷回复建议设置页改成两层可折叠结构，外层是扩展总设置入口，内层是通用、API、提示词、上下文和外观五个独立子标签；同时降低浮动建议面板拖动时的布局和存储开销。

## 根因

现有实现用自定义 `hidden` 属性隐藏内容区，但 SillyTavern 设置容器的样式会覆盖该隐藏规则，导致所有分页内容显示。页面也只有横向标签，没有独立的扩展总入口，因此视觉上缺少用户期待的“最外层标签”。拖动事件则在每个 `pointermove` 中读取面板尺寸、写入 `left/top` 并更新 `localStorage`，会触发不必要的布局和同步存储。

## 结构设计

使用浏览器原生 `details/summary`，避免依赖酒馆外部 CSS 的 `hidden` 行为：

```text
智能快捷回复建议 ▸
  通用设置 ▸
  API 配置 ▸
  提示词编辑 ▸
  上下文与压缩 ▸
  外观微调 ▸
```

- 外层 `details.sqr-settings` 默认关闭，`summary` 显示扩展名称和箭头。
- 内层每个设置区使用独立 `details.sqr-settings-section`，默认关闭，互不排斥。
- 移除顶部横向标签，避免同一设置出现两套入口。
- 点击外层标题只控制整个设置内容；点击子标题只控制对应子内容。
- `toggle` 事件同步 `aria-expanded` 和箭头方向，键盘操作自动获得原生支持。

## 拖动设计

- `pointerdown` 记录起点和面板初始坐标，并优先启用指针捕获。
- `pointermove` 只保存最新目标坐标，并安排一个 `requestAnimationFrame`。
- 帧回调使用 `translate3d` 更新视觉位置，避免每个指针事件触发布局。
- `pointerup`/`pointercancel` 取消待处理帧，将最终坐标写回 `left/top`，清除 transform，并只保存一次位置。
- 保留现有坐标边界校正和刷新/隐藏行为。

## 文件与测试

- `settings.html`：改为嵌套 `details/summary` 结构。
- `index.js`：绑定 details 状态和 rAF 拖动调度。
- `style.css`：为外层、子层和 summary 提供紧凑的酒馆主题样式，并用 `details[open]` 控制箭头。
- `tests/settings.test.js`：验证外层/子层结构和默认关闭状态。
- `tests/settings.test.js`：验证拖动调度器只保留最新坐标并在结束时提交。

## 验收

- 设置页首次打开只显示一个外层标题。
- 点击外层标题后显示五个子标题，点击任一子标题只展开或收起对应内容。
- 不再显示顶部横向重复标签。
- 拖动面板时视觉位置连续，松手后位置仍可记忆。
- `npm test`、`node --check index.js`、`git diff --check` 全部通过。
