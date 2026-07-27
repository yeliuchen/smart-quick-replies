# 设置分页折叠与主题输入框 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让智能快捷回复建议扩展的设置分页可独立折叠并允许多个同时展开，同时让表单控件跟随 SillyTavern 主题颜色。

**Architecture:** 在现有设置标签切换基础上，为每个 section 增加独立的折叠标题按钮。标签点击仍负责切换当前分页；标题点击只改变当前 section 的 `hidden` 和 `aria-expanded`，不修改其他 section。CSS 通过设置页级主题变量覆盖表单控件的背景、文字、边框和占位文字颜色，不触碰浮动建议面板或 SillyTavern 核心样式。

**Tech Stack:** 原生 ES modules、DOM API、CSS 自定义属性、Node.js 内置 `node:test`、Git。

## Global Constraints

- 保留现有五个顶部分页标签和设置项 ID。
- 多个分页可以同时展开；标题点击不强制其他分页收起。
- 默认五个分页全部折叠；点击顶部标签或标题后展开目标分页。
- 折叠状态只作用于 section 内的内容区，使用原生 `hidden` 与 `aria-expanded`，保证标题在收起后仍可点击。
- 输入框、下拉框、文本域和搜索框必须使用 SillyTavern 主题变量并提供回退值。
- 不改变 API 请求、快捷回复生成、主 AI 生成流程或浮动面板行为。

## File Map

- `settings.html` — 为五个设置 section 增加始终可见的折叠标题、独立内容区和无障碍属性。
- `index.js:513-519` — 绑定 section 折叠标题，并让标签切换保留当前 section 的展开状态。
- `style.css:1-90` — 增加主题表单控件变量、焦点态和折叠标题样式。
- `tests/settings.test.js` — 增加结构与 CSS 回归测试。

### Task 1: Add failing regression tests

**Files:**
- Modify: `tests/settings.test.js`

- [ ] **Step 1: Add the failing markup contract test**

```js
test('settings sections expose independent collapsible headers', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  for (const id of ['general', 'api', 'prompt', 'context', 'appearance']) {
    assert.match(html, new RegExp(`data-sqr-collapse="sqr-${id}"`));
  }
  assert.match(html, /id="sqr-general"[^>]*data-sqr-section[^>]*aria-expanded="false"/s);
  assert.match(html, /id="sqr-general"[^>]*data-sqr-section-content[^>]*hidden/s);
  assert.match(html, /id="sqr-api"[^>]*data-sqr-section[^>]*aria-expanded="false"/s);
  assert.match(html, /data-sqr-collapse="sqr-api"[^>]*aria-expanded="false"/s);
});
```

- [ ] **Step 2: Add the failing theme CSS contract test**

```js
test('settings CSS gives form controls theme-aware colors', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.sqr-settings[\s\S]*--sqr-input-background/);
  assert.match(css, /\.sqr-settings[\s\S]*\.sqr-field input/);
  assert.match(css, /background:\s*var\(--sqr-input-background/);
  assert.match(css, /color:\s*var\(--sqr-input-text/);
  assert.match(css, /::placeholder/);
});
```

- [ ] **Step 3: Run the focused tests and verify they fail for the missing contracts**

Run: `node --test tests/settings.test.js`

Expected: FAIL because settings.html has no `data-sqr-collapse` headers and style.css has no input theme variables.

### Task 2: Implement independent collapsible sections

**Files:**
- Modify: `settings.html`
- Modify: `index.js`

- [ ] **Step 1: Add a button header to each section**

Use the existing section heading text as a button with `data-sqr-collapse="sqr-<section>"`. Keep all five section contents hidden with `aria-expanded="false"` on first render; the outer section cards and title buttons remain visible.

- [ ] **Step 2: Bind title clicks without coupling sections**

In the settings UI binding, add a listener for `[data-sqr-collapse]` that finds the matching section and toggles:

```js
const section = [...container.querySelectorAll('[data-sqr-section]')]
  .find(candidate => candidate.id === button.dataset.sqrCollapse);
const content = section?.querySelector('[data-sqr-section-content]');
const expanded = Boolean(content && !content.hidden);
content.hidden = expanded;
section.setAttribute('aria-expanded', String(!expanded));
button.setAttribute('aria-expanded', String(!expanded));
```

The existing tab listener must only switch the active tab and open its target section content when a tab is clicked; it must not loop over all sections and close them after an accordion click. Opening a tab or accordion header never closes other sections.

- [ ] **Step 3: Run the focused tests and verify the markup is green**

Run: `node --test tests/settings.test.js`

Expected: the new structure test passes; existing tests remain green.

### Task 3: Implement theme-aware form controls and visual states

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add theme variables under `.sqr-settings`**

Define `--sqr-input-background`, `--sqr-input-text`, `--sqr-input-border`, `--sqr-input-placeholder`, and `--sqr-input-focus` from SillyTavern variables with dark translucent fallbacks.

- [ ] **Step 2: Apply variables to supported controls**

Extend the existing control selector to `input:not([type='checkbox']):not([type='range'])`, `select`, and `textarea`; set `background`, `color`, `border`, and `accent-color`. Add `::placeholder` and `:focus` rules. Set `color-scheme: dark` only for text-like controls and selects so native menus do not revert to a white palette.

- [ ] **Step 3: Style collapsible headers**

Add `.sqr-section-toggle` styles with left-aligned text, theme-aware background, border, hover/focus states, and an indicator that rotates when `[aria-expanded='true']`. Add `.sqr-settings-section-content[hidden] { display: none; }`, remove the old `h3` bottom margin assumption, and keep consistent spacing for the content below the toggle.

- [ ] **Step 4: Run the focused tests and CSS contract test**

Run: `node --test tests/settings.test.js`

Expected: all settings tests pass with zero failures.

### Task 4: Full verification and delivery

**Files:**
- Verify: `index.js`, `settings.html`, `style.css`, `tests/settings.test.js`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run syntax and whitespace checks**

Run: `node --check index.js; git diff --check`

Expected: both commands exit 0 with no whitespace errors.

- [ ] **Step 3: Review the diff for scope**

Run: `git diff -- settings.html style.css index.js tests/settings.test.js`

Confirm only accordion behavior, settings CSS, and regression tests changed.

- [ ] **Step 4: Commit the implementation**

```powershell
git add settings.html style.css index.js tests/settings.test.js
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "feat: add collapsible themed settings"
```

- [ ] **Step 5: Push and verify the branch is clean**

Run: `git push origin master; git status --short --branch`

Expected: push succeeds and the branch reports no uncommitted changes.
