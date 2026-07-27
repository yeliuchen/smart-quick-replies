# 嵌套设置折叠与面板拖动优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用原生嵌套 `details/summary` 修复设置页折叠层级，并用 `requestAnimationFrame` 降低浮动面板拖动卡顿。

**Architecture:** 设置页使用一个外层 `details` 包裹五个独立的内层 `details`，删除重复的顶部横向 tab。面板拖动把指针事件和视觉渲染解耦：事件只更新待处理坐标，帧回调用 transform 渲染，结束拖动时再提交最终位置和持久化。

**Tech Stack:** 原生 HTML details/summary、DOM Pointer Events、requestAnimationFrame、CSS、Node.js 内置 node:test。

## Global Constraints

- 外层和内层折叠默认关闭，内层可以同时展开。
- 不依赖 `hidden` 属性来控制设置内容可见性。
- 不改变设置项 ID、API、聊天事件和快捷回复生成流程。
- 拖动过程中不写 localStorage，不在每个 pointermove 中调用 getBoundingClientRect。
- 保留当前面板位置边界校正和重置位置功能。

## File Map

- `settings.html` — 嵌套 details/summary 设置结构。
- `index.js:490-550` — details toggle 状态绑定；`index.js:745-775` — rAF 拖动调度。
- `style.css:1-130` — 外层/内层折叠外观和箭头；`style.css:190-230` — 拖动性能提示。
- `tests/settings.test.js` — 结构和拖动调度器回归测试。

### Task 1: Add failing regression tests

**Files:**
- Modify: `tests/settings.test.js`

- [x] **Step 1: Replace the old tab/hidden markup assertions**

```js
test('settings use one outer drawer and five independent inner drawers', () => {
  const html = fs.readFileSync(new URL('../settings.html', import.meta.url), 'utf8');
  assert.match(html, /<details[^>]*class="sqr-settings"[^>]*id="sqr-settings-root"/s);
  assert.match(html, /<summary[^>]*data-sqr-root-toggle/);
  assert.doesNotMatch(html, /data-sqr-tab=/);
  for (const id of ['general', 'api', 'prompt', 'context', 'appearance']) {
    assert.match(html, new RegExp(`<details[^>]*id="sqr-${id}"[^>]*data-sqr-section`));
    assert.match(html, new RegExp(`data-sqr-collapse="sqr-${id}"`));
    assert.match(html, new RegExp(`id="sqr-${id}"[^>]*>(?:\\s|.)*?<summary`));
  }
});
```

- [x] **Step 2: Add the failing drag scheduler test**

```js
test('drag scheduler keeps only the newest pending point until the frame runs', () => {
  const frames = [];
  const scheduler = createDragScheduler(callback => frames.push(callback));
  scheduler.queue({ left: 10, top: 20 });
  scheduler.queue({ left: 30, top: 40 });
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.deepEqual(scheduler.flushes, [{ left: 30, top: 40 }]);
});
```

- [x] **Step 3: Run the focused tests and verify they fail**

Run: `node --test tests/settings.test.js`

Expected: FAIL because the markup still uses a div plus tab buttons and no drag scheduler export exists.

### Task 2: Implement nested native drawers

**Files:**
- Modify: `settings.html`
- Modify: `index.js`
- Modify: `style.css`

- [x] **Step 1: Replace the root and section wrappers**

Use `<details class="sqr-settings" id="sqr-settings-root">` with a root `<summary data-sqr-root-toggle>智能快捷回复建议</summary>`. Move the five setting sections inside the details body. Replace each section with `<details class="sqr-settings-section" id="sqr-api" data-sqr-section>` and put its existing controls below a `<summary data-sqr-collapse="sqr-api">API 配置</summary>`.

- [x] **Step 2: Remove tab-only listeners and synchronize native toggle state**

In `renderSettings`, remove the `[data-sqr-tab]` loops. For every `[data-sqr-section]` and the root details element, listen for `toggle` and set the matching summary’s `aria-expanded` to `String(details.open)`. Keep all existing setting input and button handlers unchanged.

- [x] **Step 3: Add resilient details styling**

Style `summary` as a full-width row, hide the default marker, add a custom chevron, and rotate it under `details[open]`. Keep the form controls inside the details body. Do not use `[hidden]` as the only visibility mechanism.

- [x] **Step 4: Run the focused settings tests**

Run: `node --test tests/settings.test.js`

Expected: all settings structure and behavior tests pass.

### Task 3: Implement frame-coalesced dragging

**Files:**
- Modify: `index.js`
- Modify: `tests/settings.test.js`
- Modify: `style.css`

- [x] **Step 1: Add the pure drag scheduler**

Export `createDragScheduler(requestFrame)` returning `{ queue(point), flushes }`. `queue` stores only the newest point and schedules one frame; the frame pushes the newest point to `flushes` and clears the pending flag.

- [x] **Step 2: Integrate scheduler into createPanel**

Replace direct `setPosition` and `callbacks.onMove` calls inside `pointermove` with a scheduler callback that sets `element.style.transform = translate3d(...)`. On pointerup/pointercancel, apply the final coordinate to `left/top`, clear transform, call `callbacks.onMove` once, remove listeners, and cancel any pending frame when possible.

- [x] **Step 3: Use pointer capture when available**

On pointerdown call `dragHandle.setPointerCapture?.(event.pointerId)`. On end call `releasePointerCapture?.(event.pointerId)` and listen for `pointercancel` as well as `pointerup`.

- [x] **Step 4: Run focused drag tests and full tests**

Run: `node --test tests/settings.test.js` and then `npm test`.

Expected: all tests pass with zero failures.

### Task 4: Verify and publish

**Files:**
- Verify: `settings.html`, `style.css`, `index.js`, `tests/settings.test.js`

- [x] **Step 1: Run static checks**

Run: `node --check index.js; git diff --check`

Expected: both commands exit 0.

- [x] **Step 2: Review scope and secret scan**

Run: `git diff --stat` and scan repository files for credential-like strings without printing secrets.

Expected: only nested drawer, drag scheduling, tests, and docs changed; no credential-like matches.

- [ ] **Step 3: Commit and push**

```powershell
git add settings.html style.css index.js tests/settings.test.js docs/superpowers/specs/2026-07-28-nested-settings-drawer-design.md docs/superpowers/plans/2026-07-28-nested-settings-drawer.md
git -c user.name='Codex' -c user.email='codex@localhost' commit -m "fix: add nested settings drawers and smooth dragging"
git push origin master
```

- [ ] **Step 4: Verify remote and clean worktree**

Run: `git status --short --branch` and `git ls-tree -r --name-only origin/master`.

Expected: local master matches origin/master and root extension files remain present.
