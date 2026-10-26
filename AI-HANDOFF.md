# AI 交接日志

## 2026-10-26：逐句插图、高亮朗读与首次发布

- 独立仓库：`https://github.com/LuckyGirl60/guwen-guan-zhi`
- 当前分支：`main`
- 当前 commit：`e2c55e6`（逐句视觉朗读功能）
- 在线地址：`https://guwen-guan-zhi.pages.dev/`
- 当前部署版本：Cloudflare Pages deployment `46194840.guwen-guan-zhi.pages.dev`

### 本轮完成

- 每个句子增加项目内 SVG 学习插图，并在内容 JSON 中登记 `visualPath` 和 `visualAlt`。
- 点击句子时同步切换原文高亮、插图、当前句翻译和讲解。
- 全文朗读按句播放，播放队列切换当前句；增加当前句朗读按钮。
- 文章目录、文章清单、内容校验和独立静态部署保持可用。
- 已创建 GitHub 仓库并推送 `main`；Cloudflare Pages 项目名为 `guwen-guan-zhi`。

### 验证

- `node --check app.js`
- `node --check library.js`
- `node scripts/validate-content.mjs`
- 本地 `http://127.0.0.1:4174/` 页面交互验证通过。
- 线上目录、详情页、文章 JSON、SVG 插图均 HTTP 200。

### 内容与媒体边界

- 当前插图是项目自制 SVG 示意图，不包含机构课程截图、讲义或视频。
- 当前朗读仍是浏览器 SpeechSynthesis 降级方案，不能称为真人音频。
- 视频和真人音频必须先在 `content/rights/media-manifest.json` 登记来源与授权状态。

### 下一步

- 增加第二篇人工校对文章，验证多文章进度隔离。
- 增加逐句字幕、授权真人朗读和视频加载失败状态。
- 通过内容校验后再扩充到 12–20 篇文章。
