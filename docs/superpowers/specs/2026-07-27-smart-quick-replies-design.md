# SillyTavern 智能快捷回复建议扩展设计

## 目标

制作一个可直接复制到 `public/scripts/extensions/third-party/` 下使用的 SillyTavern 原生 ES 模块扩展。它在角色回复完成后或按需调用独立 API，生成 4 条简短的用户候选回复，并通过可拖动、可记忆位置的浮动面板供用户选择。

## 交付范围

交付目录为 `smart-quick-replies/`，包含：

```text
smart-quick-replies/
├─ manifest.json
├─ index.js
├─ style.css
├─ settings.html
├─ README.md
├─ package.json
└─ tests/
   ├─ api.test.js
   ├─ context.test.js
   ├─ parsing.test.js
   └─ settings.test.js
```

扩展不修改 SillyTavern 核心文件，不改变主 AI 生成流程，不把建议写入聊天历史，不依赖构建工具或第三方运行时依赖。

## 方案选择

### 方案一：原生 ES 模块扩展（采用）

使用 `manifest.json` 注册扩展，用原生 DOM、事件总线和 `extension_settings` 完成设置、上下文、API 和浮动面板。它无需构建，复制目录即可安装，适合当前空工作区和第三方扩展安装流程。

### 方案二：React/Webpack 扩展

可获得更强的组件化能力，但增加构建链和依赖，用户安装时需要使用构建产物，超出当前功能的必要范围。

### 方案三：浏览器扩展加酒馆服务端代理

能把 API Key 完全留在服务端，但需要额外服务端插件和部署步骤，不符合轻量、单目录安装的目标。

## 模块边界

### 设置模块

- 从 `extension_settings.smartQuickReplies` 读取并合并默认配置。
- 普通配置通过 SillyTavern 设置保存机制持久化。
- API Key 优先使用 SillyTavern Secrets 接口；Secrets 不可用时回退到本地存储，并在设置页展示安全提示。
- 监听设置控件变更，立即保存并更新面板样式。

### 上下文模块

- 从当前聊天取得最近 N 条消息。
- 为每条消息保留角色名、`isUser`、API role 和正文。
- 支持当前角色、用户名和角色描述占位符。
- 能在中断场景排除最后一条不完整 AI 消息及其之前的用户消息。
- 提供自动摘要、滑动窗口和不压缩三种策略。

### API 模块

- 根据 API 类型规范化 URL。
- 生成 OpenAI-compatible、Anthropic Messages 和 LM Studio（OpenAI-compatible）请求。
- 读取并过滤模型列表。
- 解析三种 API 的文本返回。
- 统一处理 HTTP 错误、超时、取消和格式错误。

### 面板模块

- 创建、显示、隐藏和更新浮动面板。
- 管理候选按钮、刷新、加载、错误重试和输入框填充。
- 管理拖动坐标、默认定位、窗口缩放边界和重置位置。
- 通过请求序号和 `AbortController` 防止旧请求覆盖新结果。

## 事件流

```text
角色回复完成
  → CHARACTER_MESSAGE_RENDERED
  → 构建完整上下文
  → 调用独立 API
  → 面板显示 4 条建议

用户停止生成
  → GENERATION_STOPPED
  → 等待酒馆最后一次 UI / chat 更新
  → 判断最后一条是否为不完整 AI 消息
  → 排除不完整 AI 消息和紧邻用户消息
  → 按设置决定是否生成建议

用户发送、切换聊天室、关闭对话
  → 隐藏面板并取消未完成请求
```

扩展在 `GENERATION_STARTED` 时记录聊天长度、最后消息索引和当前生成状态。`GENERATION_STOPPED` 触发后延迟检查 chat 数据，避免在酒馆流式生成清理完成前读取旧状态。`CHARACTER_MESSAGE_RENDERED` 事件和中断事件通过生成会话标识去重。

当触发模式为自动时，只对角色消息完成事件自动生成。手动模式只由扩展工具栏按钮触发。关闭模式不自动生成，也保留手动按钮的显示状态与设置一致。

## 浮动面板

面板挂在 `document.body`，不嵌入聊天消息，避免被聊天区域裁剪。默认布局为：

```text
[ 建议 1 ] [ 建议 2 ] [ 建议 3 ] [ 建议 4 ] [ 🔄 ]
```

- 默认位于 `#send_textarea` 上方，宽度跟随输入框并左对齐。
- 面板顶部提供拖动区域，候选按钮和刷新按钮不参与拖动。
- 坐标以 `{ left, top }` 保存到 `localStorage`。
- 页面缩放或窗口变化后，将面板限制在可视区域内。
- 候选按钮单行省略，完整内容通过 `title` 和无障碍文本保留。
- 点击候选后写入 `#send_textarea`，派发 `input` 事件并聚焦。
- 发送消息后自动隐藏。
- 外部点击关闭和 Esc 关闭可分别配置。
- API 请求中显示加载状态；失败时保留面板并显示重试按钮。

## 设置页

使用 SillyTavern 原生 `inline-drawer` 风格，在扩展设置区域内提供独立的内部分页：

### 通用设置

- 触发模式：自动、手动、关闭。
- 中断后自动生成。
- 发送后消失。
- Esc 关闭。
- 点击外部关闭。
- 重置弹出位置。
- 当前坐标显示。

### API 配置

- API 类型：Anthropic-compatible、OpenAI-compatible、LM Studio。
- 自动检测。
- API URL。
- API Key 密码框。
- 模型名称输入框。
- 获取模型按钮。
- 可搜索模型下拉列表。
- 温度、最大 token、top_p。
- 请求超时。

### 提示词编辑

- 多行系统提示词。
- 占位符说明。
- 恢复默认提示词按钮。

默认提示词为：

```text
You are an assistant that helps the user reply to {{char}}. Given the conversation history, generate 4 distinct, short, and in-character replies that {{user}} might say next. Reply ONLY with a JSON array of 4 strings, like: ["reply1", "reply2", "reply3", "reply4"]
```

### 上下文与压缩

- 最近消息条数，默认 20。
- 包含角色描述。
- 启用压缩，默认开启。
- 压缩策略：自动摘要、滑动窗口、不压缩。
- 粗略 token 阈值，默认 3000。
- 摘要模型。
- 摘要保留的最近消息数量。
- 可选摘要 API URL、API 类型和 API Key；未配置时复用主 API。

### 外观微调

- 面板透明度。
- 面板背景色或 CSS 变量覆盖。
- 按钮背景色。
- 按钮文字色。

## 上下文与提示词

内部消息结构为：

```js
{
  name: "角色名",
  isUser: false,
  role: "assistant",
  content: "消息内容"
}
```

角色消息映射为 `assistant`，用户消息映射为 `user`。系统提示词始终单独处理。

占位符规则：

- `{{char}}` 替换为当前角色名。
- `{{user}}` 替换为当前用户名。
- `{{char_description}}` 在开关关闭或没有描述时替换为空字符串。
- `{{history}}` 如果存在于系统提示词，替换为纯文本历史，并且不再重复追加历史消息数组。
- 如果没有 `{{history}}`，历史使用 API 原生消息数组传递。

角色描述开关开启时，描述会前置到上下文；关闭时不向请求发送角色描述。

中断场景在移除最后一条不完整 AI 消息后，再移除它之前紧邻的用户消息（如果存在）。这样生成建议只参考本轮之前的历史。

粗略 token 估算使用文本长度估算，不依赖 tokenizer。自动摘要只处理早期消息，最近消息按设置原样保留。摘要调用使用独立的摘要提示词，摘要失败时自动回退到滑动窗口，并在面板显示轻提示。

## API 适配

### OpenAI-compatible

- 默认端点：`/v1/chat/completions`。
- 请求使用 `messages`、`temperature`、`max_tokens`、`top_p`、`stream: false`。
- 结果读取 `choices[0].message.content`，兼容文本内容数组。
- 模型列表读取 `/v1/models` 的 `data` 数组。
- API Key 使用 `Authorization: Bearer`。

### Anthropic-compatible

- 默认端点：`/v1/messages`。
- 系统提示词放入顶层 `system`。
- 历史放入 `messages`。
- 请求使用 `model`、`max_tokens`、`temperature`、`top_p`。
- 结果读取 `content` 中的文本块。
- 模型列表尝试读取 `/v1/models`；失败时提示手动输入。
- API Key 使用 `x-api-key`，同时发送 `anthropic-version: 2023-06-01`。

### LM Studio

- 在设置中单独展示，默认采用 OpenAI-compatible 请求路径。
- 默认请求 `/v1/chat/completions`，模型列表 `/v1/models`。
- `/v1/models` 不可用时兼容 `/api/v1/models`。
- 使用 Bearer Key；本地未启用认证时允许为空。

API URL 规范化支持用户填写根地址、`/v1`、完整请求路径或自定义网关路径。自动检测勾选后，包含 Anthropic 特征的域名或路径优先判断为 Anthropic；包含 LM Studio 特征的本地主机或路径判断为 LM Studio；其余判断为 OpenAI-compatible。未勾选时始终尊重用户的下拉选择。

## 响应解析

解析器按以下顺序处理：

1. 读取目标 API 的文本字段。
2. 去除 Markdown 代码围栏。
3. 从文本中提取第一个完整 JSON 数组。
4. 验证数组包含 4 个字符串。
5. 去除空字符串和重复项。
6. 如果不足 4 条，返回格式错误，不用重复内容伪造候选。

## 安全与错误处理

- API Key 不写入控制台日志、错误消息或 README 示例。
- Secrets 接口不可用时才回退本地存储，并在设置页说明浏览器本地存储并非真正的硬件安全存储。
- URL、模型和必要 Key 缺失时显示具体缺项。
- API 返回非 2xx 时显示状态码和通用排查建议。
- 网络错误、CORS 错误、超时和用户取消分别归类处理。
- 默认请求超时 30 秒。
- 任何刷新或切换聊天室都会取消旧请求。
- API 失败不会影响主聊天生成或消息发送。

## 测试策略

测试使用 Node.js 内置测试运行器，核心纯函数不依赖浏览器和 SillyTavern 全局对象。浏览器相关模块通过注入 DOM、存储和 fetch 依赖测试。

必须覆盖：

- 默认配置、配置合并和迁移。
- URL 规范化、API 自动检测和模型列表路径。
- OpenAI、Anthropic、LM Studio 请求体。
- 三种响应解析和 HTTP 错误。
- 普通上下文、角色描述和中断排除。
- 自动摘要、滑动窗口、不压缩及摘要失败回退。
- 四个占位符替换。
- JSON 数组清洗、去重、非法条目拒绝。
- 面板坐标保存、重置和视口边界。
- 请求序号和取消信号，确保旧请求不能覆盖新结果。
- 重复事件不会重复生成。

## 兼容性依据

扩展采用 SillyTavern 当前第三方扩展目录和 manifest 加载方式，监听其事件总线提供的 `CHARACTER_MESSAGE_RENDERED`、`GENERATION_STARTED`、`GENERATION_STOPPED`、`MESSAGE_SENT` 和 `CHAT_CHANGED` 等事件。

参考资料：

- https://github.com/SillyTavern/SillyTavern-Docs/blob/main/extensions/index.md
- https://raw.githubusercontent.com/SillyTavern/SillyTavern/release/public/scripts/events.js
- https://raw.githubusercontent.com/SillyTavern/SillyTavern/release/public/scripts/extensions.js
- https://lmstudio.ai/docs/developer/openai-compat
- https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector

