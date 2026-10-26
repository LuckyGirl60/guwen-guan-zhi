# v0.2.0 · 逐句视觉朗读

## 变更

- 为《曹刿论战》5 个句子增加独立 SVG 学习插图。
- 点击句子时同步切换插图、当前句和翻译讲解。
- 全文朗读改为逐句播放，播放时当前句会跟随高亮。
- 增加“当前句”朗读按钮。
- 保留浏览器合成语音降级，不伪称为真人音频。

## 验证

- `node --check app.js`
- `node --check library.js`
- `node scripts/validate-content.mjs`
- 独立静态服务器页面、文章 JSON 和 5 个 SVG 均返回 200。
- 浏览器验证点击第 3 句后插图和讲解切换。

## 素材说明

本版本使用项目内自制 SVG 示意插图，不包含机构课程截图、视频或讲义。后续如替换为 AI 位图或真人媒体，需要在 `content/rights/media-manifest.json` 登记来源和授权状态。

# v0.3.0 · 单篇媒体生成预览

## 变更

- 新增 `npm run media:generate`，从文章 JSON 生成逐句学习卡片、系统中文合成语音、WebVTT 字幕和 MP4 预览。
- 文章页接入《曹刿论战》原型视频，明确标记合成语音、程序占位配乐和 `prototype_only` 状态。
- 新增 `storyboard.json`、`manifest.json` 和媒体授权登记，便于后续替换为 AI 或人工校对且已授权的素材。

## 原型产物

- 5 张 1280×720 PNG 卡片
- 5 段 WAV 逐句旁白
- 1 份 WebVTT 双语字幕
- 1 个 25 秒 H.264/AAC 预览视频

原型媒体仅用于验收交互和生产流程，不作为正式课程素材发布。

# v0.3.1 · 媒体时间轴与播放回退

## 变更

- 逐句 WAV 接入文章页，音频可用时优先播放，失败后回退浏览器 SpeechSynthesis。
- 视频字幕按照实际语音时长生成，画面、旁白和字幕时间轴保持一致。
- 视频加载失败或 stalled 时显示可继续学习的提示。
- 媒体校验增加 `npm run media:check`，检查文件、字幕数量和时间轴重叠。
- 视频合成脚本自动清理 concat 清单和 padding 中间文件。

## 验证

- `node --check app.js`
- `node --check scripts/generate-media.mjs`
- `node --check scripts/validate-media.mjs`
- `python -m py_compile scripts/render-cards.py`
- `npm run content:check`
- `npm run media:generate`
- `npm run media:check`
- `ffprobe` 视频时长约 25.579 秒
- `git diff --check`

## 素材边界

当前仍是 `prototype_only`：Windows System.Speech 合成旁白、程序占位配乐和可复现学习卡片。正式课程上线前仍需人工校对并取得媒体授权。
