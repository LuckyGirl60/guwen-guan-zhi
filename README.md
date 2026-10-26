# 古文观止独立应用

这是《古文观止》阅读、精读和鉴赏应用，独立于 `english-helper`、`starter2-reading` 和未来的语文/数学应试应用。

## 当前状态

当前是静态原型，示例文章为《曹刿论战》。页面包含文章目录、分句阅读、白话、字词、历史与写法讲解、浏览器合成朗读和本机学习进度。视频区只作为授权素材接入位。

## 本地运行

在本目录启动内容校验和静态服务器：

```powershell
node scripts/validate-content.mjs
python -m http.server 4174
```

然后打开 `http://127.0.0.1:4174/library.html`。不能直接双击 HTML，因为文章目录和正文通过模块与 JSON 资源加载。

## 生成单篇媒体预览

Windows 环境可以运行：

```powershell
npm run media:generate
```

命令会从文章 JSON 生成逐句 PNG 卡片、系统中文合成语音、WebVTT 字幕和 MP4 预览，输出到 `content/generated/<slug>/`。视频中的语音和配乐只用于原型验收，清单会标记为 `prototype_only`，正式发布前必须替换为人工校对且已获授权的媒体。没有中文系统语音或 FFmpeg 时，可以分别使用 `--skip-audio`、`--skip-video` 生成其余产物。

PNG 是可复现的学习卡片，不代表已经调用 AI 图片模型；`storyboard.json` 会同时输出逐句画面提示词，后续可以接入获得授权的图片生成服务。生成完成后运行 `npm run media:check` 检查文件和字幕时间轴。

## 内容规则

- 文章正文和译注放在 `content/articles/`，逐句使用稳定 `id`。
- 视频、音频和字幕的来源、授权状态放在 `content/rights/`。
- 未获授权的媒体保持待接入状态，不复制机构课程内容。
- 发布前必须人工校对底本、断句、译注、年级和媒体授权。

## 后续拆分

确认文章模型后，再增加文章目录、阅读复习和 12–20 篇人工校对文章；账号同步、教师后台和服务端复习算法放到后续阶段。
