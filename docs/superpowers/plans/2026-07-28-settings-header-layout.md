# 设置页标题与控件布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化母标签、模型列表区和提示词区的视觉层级与排列，同时保持现有设置行为不变。

**Architecture:** 继续使用 `settings.html` 提供语义结构，`style.css` 提供主题化布局。所有现有控件 ID 保持不变，因此 `index.js` 无需改动。

**Tech Stack:** 原生 HTML `<details>`、CSS Grid/Flex、SillyTavern CSS 变量、Node.js 内置测试。

## Global Constraints

- 不改变现有设置控件 ID 和 JavaScript 事件绑定。
- 使用现有 SillyTavern 主题变量，不引入依赖。
- 桌面端优先横向布局，窄屏端必须可堆叠。
- 每次实现前先增加能失败的结构测试。

---

### Task 1: 锁定新的设置结构

**Files:**
- Modify: `tests/settings.test.js`
- Modify: `settings.html`

**Interfaces:**
- 保留现有控件 ID：`sqr-model-search`、`sqr-model-list`、`sqr-fetch-models`、`sqr-system-prompt`、`sqr-reset-prompt`。
- 新增结构类名：`sqr-root-heading`、`sqr-model-toolbar`、`sqr-prompt-toolbar`。

- [ ] **Step 1: Write the failing test**

在 `tests/settings.test.js` 增加结构断言：母标签包含 `.sqr-root-heading`；模型区域包含 `.sqr-model-toolbar` 且同时包含搜索框和获取按钮；提示词区域包含 `.sqr-prompt-toolbar` 且同时包含系统提示词标题和恢复按钮。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="settings markup|theme-aware"`

Expected: 新增结构断言失败，因为当前 HTML 没有这些工具栏类名。

- [ ] **Step 3: Write minimal HTML structure**

将母标签 summary 的内容包入 `.sqr-root-heading`；将模型搜索 label/input 与获取按钮包入 `.sqr-model-toolbar`；将提示词标题与恢复按钮包入 `.sqr-prompt-toolbar`。保留现有选择框、状态文字和 textarea 的 ID。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="settings markup|theme-aware"`

Expected: 相关测试通过。

- [ ] **Step 5: Commit**

```bash
git add tests/settings.test.js settings.html
git commit -m "refactor: structure settings toolbars"
```

### Task 2: 实现主题化视觉布局

**Files:**
- Modify: `style.css`

**Interfaces:**
- `.sqr-root-heading` 控制母标签标题栏。
- `.sqr-model-toolbar` 控制模型搜索与获取按钮的横向布局。
- `.sqr-prompt-toolbar` 控制提示词标题与恢复按钮的横向布局。

- [ ] **Step 1: Add failing CSS contract tests**

在 `tests/settings.test.js` 增加 CSS 断言，要求这些类使用 `display: flex` 或 `display: grid`，并要求存在窄屏媒体查询下的单列布局规则。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="settings layout contracts"`

Expected: 测试失败，因为 CSS 尚未包含新类的布局规则。

- [ ] **Step 3: Write minimal CSS**

为母标签增加左侧主题色竖线、紧凑 padding 和轻量 hover/focus；为模型工具栏设置 `grid-template-columns: minmax(0, 1fr) auto`，结果列表占满下一行；为提示词工具栏设置标题和按钮两端对齐；在 `@media (max-width: 640px)` 中将两个工具栏改为单列。

- [ ] **Step 4: Run full verification**

Run: `npm test && node --check index.js && git diff --check`

Expected: 所有测试通过，语法检查和 diff 检查无输出错误。

- [ ] **Step 5: Commit**

```bash
git add style.css tests/settings.test.js
git commit -m "style: polish settings headers and toolbars"
```

### Task 3: 浏览器视觉确认

**Files:**
- No source changes unless visual verification reveals a concrete defect.

- [ ] **Step 1: Reload the local SillyTavern page**

重新加载已运行的酒馆页面，打开智能快捷回复建议设置，并确认母标签、模型区和提示词区均处于可见状态。

- [ ] **Step 2: Verify the three visual outcomes**

确认母标签是轻量标题栏；模型搜索框与获取按钮同一行且模型结果在下方；恢复默认提示词按钮位于提示词标题右侧。

- [ ] **Step 3: Verify narrow layout**

在窄视口下确认工具栏控件自动上下排列，按钮和输入框不发生横向溢出。

