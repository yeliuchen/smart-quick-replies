# 智能快捷回复建议

这是一个 SillyTavern 第三方扩展。角色回复完成后，它会根据最近的聊天内容请求独立 API，生成 4 条简短的用户候选回复。点击候选会填入 `#send_textarea`，刷新按钮会重新请求。

快捷回复面板会在支持 WebGL 时动态加载 [LiquidGlass](https://github.com/ybouane/liquidglass) 的液态玻璃效果；无法加载 CDN 或浏览器不支持 WebGL 时，会自动回退到扩展内置样式。

## 安装

将整个 `smart-quick-replies` 文件夹复制或克隆到：

```text
SillyTavern/public/scripts/extensions/third-party/smart-quick-replies/
```

刷新 SillyTavern 页面，并在扩展设置中找到“智能快捷回复建议”。本扩展不修改 SillyTavern 的主 AI 生成流程。

## API 配置

- OpenAI-compatible：例如 `https://api.openai.com/v1` 或兼容网关地址。
- Anthropic-compatible：例如 `https://api.anthropic.com/v1`，请求使用 Messages API。
- LM Studio：通常填写 `http://localhost:1234/v1`，请求走 OpenAI 兼容格式；模型发现也会尝试 `/api/v1/models`。

API URL 支持自定义端点。开启自动检测后，包含 `anthropic` 或 `/messages` 的地址会按 Anthropic 处理，LM Studio 常见的本地地址会按 LM Studio 处理。模型列表获取失败时仍可手动填写模型 ID。

API Key 会优先使用 SillyTavern Secrets 接口。若当前版本没有可用的 Secrets 接口，扩展会明确提示，并使用命名空间本地存储作为回退；不要在公共电脑上启用这个回退来保存重要密钥。

## 使用与上下文

默认触发模式是角色回复完成后自动弹出，也可以改为手动触发或关闭。面板默认贴在输入框上方，支持拖动，坐标会保存到浏览器本地存储，设置页可以重置位置。

停止主 AI 生成后，如果最后一条聊天消息是未完成的角色消息，并且开启了“中断后自动生成”，扩展会排除这条不完整角色消息及其紧邻的用户消息，再生成候选。切换聊天、删除聊天、创建聊天和发送消息都会隐藏面板；Esc 和点击外部关闭可分别配置。

默认只读取最近 20 条消息，启用压缩后超过粗略 token 阈值会使用自动摘要或滑动窗口。系统提示词支持 `{{char}}`、`{{user}}`、`{{history}}` 和 `{{char_description}}` 占位符。

## 常见问题

- 请求失败：确认 API URL、模型名称、API Key 和浏览器控制台中的 CORS 设置。
- LM Studio 无法访问：确认服务器已启动，并允许来自 SillyTavern 页面地址的跨域请求。
- 模型列表为空：部分 Anthropic 网关没有 `/v1/models`，请直接手动填写模型名称。
- 页面刷新后设置没有变化：确认扩展目录完整，并重新加载扩展设置。

## 开发

本扩展无需构建步骤。仓库根目录执行：

```powershell
npm test
node --check index.js
```

仓库或日志中绝不要放入 API Key、GitHub Token 或其他凭据。若曾经把 GitHub Token 粘贴到聊天、终端或日志中，应立即在 GitHub 撤销并重新生成，不能继续使用旧 Token。
