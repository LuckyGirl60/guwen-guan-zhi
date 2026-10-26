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

## 2026-10-26：单篇媒体生成预览

- 新增 `scripts/generate-media.mjs`、`scripts/render-cards.py`、`scripts/generate-tts.ps1` 和 `npm run media:generate`。
- 从《曹刿论战》JSON 生成 5 张 PNG 学习卡、5 段 Windows System.Speech WAV、WebVTT 字幕和 25 秒 H.264/AAC MP4。
- 文章页已接入原型视频；视频、旁白和配乐明确标记为 `prototype_only`，授权清单已登记。
- 原型媒体位于 `content/generated/cao-gui-lun-zhan/`，GitHub 只保存可复现脚本和本轮小型验收产物；正式发布前需替换合成语音、程序占位配乐和未经人工复核的画面。
- 验证：`node --check app.js`、`node --check scripts/generate-media.mjs`、`python -m py_compile scripts/render-cards.py`、`npm run content:check`、`npm run media:generate`、`ffprobe` 均通过。

## 2026-10-26：逐句媒体播放收尾与发布前验证

- 文章 JSON 为 5 个句子登记逐句 `audioPath`；文章页优先播放生成 WAV，失败回退浏览器 SpeechSynthesis；全文朗读会随音频完成切换当前句高亮。
- 视频播放器支持可选 WebVTT 字幕，并在 `error`/`stalled` 时提示用户继续使用逐句图片和朗读。
- `generate-media.mjs` 按实际 WAV 时长生成画面/字幕时间轴；合成结束自动删除 `video-concat.txt`、`narration-concat.txt` 和 `padded-*.wav` 中间文件。
- 新增 `scripts/validate-media.mjs` 与 `npm run media:check`；已验证 5 张图片、5 段音频、5 条字幕、约 25.579 秒 MP4，时间轴无重叠。
- 当前工作区尚未提交本轮修改，也尚未推送或重新部署；正式素材仍标记 `prototype_only`，不能称为真人朗读或授权课程素材。
- 下一步：提交并推送 `fix: align media timeline and playback fallback`，部署 Cloudflare Pages `guwen-guan-zhi`，验收正式域名 `https://guwen.luckyhyp.com` 的 MIME、Range、字幕和视频控件。
