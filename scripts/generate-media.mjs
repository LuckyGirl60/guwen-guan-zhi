import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_ARTICLE = join(ROOT, 'content', 'articles', 'cao-gui-lun-zhan.json');
const MIN_SCENE_SECONDS = 5;

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} 执行失败（退出码 ${result.status}）`);
}

function removeIfExists(file) {
  if (existsSync(file)) unlinkSync(file);
}

function vttTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${remainder}`;
}

async function wavDuration(file) {
  if (!existsSync(file)) return null;
  const buffer = await readFile(file);
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (chunk === 'fmt ' && offset + 20 <= buffer.length) byteRate = buffer.readUInt32LE(offset + 16);
    if (chunk === 'data') { dataSize = size; break; }
    offset += 8 + size + (size % 2);
  }
  return byteRate && dataSize ? dataSize / byteRate : null;
}

async function buildScenes(article, audioDir) {
  let start = 0;
  const scenes = [];
  for (let index = 0; index < article.sentences.length; index += 1) {
    const sentence = article.sentences[index];
    const audio = join(audioDir, `sentence-${String(index + 1).padStart(3, '0')}.wav`);
    const spokenSeconds = await wavDuration(audio);
    const duration = spokenSeconds ? Math.max(MIN_SCENE_SECONDS, spokenSeconds + 0.5) : MIN_SCENE_SECONDS;
    scenes.push({ sentence, index: index + 1, start, end: start + duration, duration, spokenSeconds, audio });
    start += duration;
  }
  return scenes;
}

async function writeSubtitles(scenes, output) {
  const cues = scenes.map((scene) => `${scene.index}\n${vttTime(scene.start)} --> ${vttTime(scene.end)}\n${scene.sentence.text}\n${scene.sentence.translation}\n`);
  await writeFile(join(output, 'subtitles.vtt'), `WEBVTT\n\n${cues.join('\n')}`, 'utf8');
}

async function writeStoryboard(article, scenes, output) {
  const storyboard = scenes.map((scene) => ({
    index: scene.index,
    sentenceId: scene.sentence.id,
    text: scene.sentence.text,
    translation: scene.sentence.translation,
    visualPrompt: `中国古代历史学习插图，${scene.sentence.visualAlt || scene.sentence.text}，水墨与暖色纸张质感，画面不生成文字，适合七至九年级学生，16:9`,
    durationSeconds: scene.duration,
    spokenSeconds: scene.spokenSeconds,
    image: `cards/sentence-${String(scene.index).padStart(3, '0')}.png`,
    audio: `audio/sentence-${String(scene.index).padStart(3, '0')}.wav`,
  }));
  await writeFile(join(output, 'storyboard.json'), JSON.stringify({ article: article.slug, status: 'prototype', scenes: storyboard }, null, 2) + '\n', 'utf8');
}

async function writeConcatFile(scenes, cardsDir, output) {
  const lines = [];
  scenes.forEach((scene) => {
    const path = join(cardsDir, `sentence-${String(scene.index).padStart(3, '0')}.png`).replaceAll('\\', '/');
    lines.push(`file '${path.replaceAll("'", "'\\''")}'`);
    lines.push(`duration ${scene.duration}`);
  });
  const last = join(cardsDir, `sentence-${String(scenes.length).padStart(3, '0')}.png`).replaceAll('\\', '/');
  lines.push(`file '${last.replaceAll("'", "'\\''")}'`);
  await writeFile(join(output, 'video-concat.txt'), `${lines.join('\n')}\n`, 'utf8');
}

function composeVideo(scenes, output) {
  const ffmpeg = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const concatFile = join(output, 'video-concat.txt');
  const music = join(output, 'music-placeholder.wav');
  const narrationList = join(output, 'narration-concat.txt');
  const narration = join(output, 'narration.wav');
  const video = join(output, 'lesson-preview.mp4');
  const total = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const audioFiles = scenes.map((scene) => scene.audio).filter(existsSync);
  if (!audioFiles.length) return { video: null, audioStatus: 'unavailable' };
  try {
    const paddedFiles = [];
    scenes.forEach((scene) => {
      const padded = join(output, `padded-${String(scene.index).padStart(3, '0')}.wav`);
      if (existsSync(scene.audio)) {
        run(ffmpeg, ['-hide_banner', '-y', '-i', scene.audio, '-af', 'apad', '-t', String(scene.duration), '-ar', '22050', '-ac', '1', '-c:a', 'pcm_s16le', padded]);
        paddedFiles.push(padded);
      }
    });
    writeFileSync(narrationList, `${paddedFiles.map((file) => `file '${file.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`).join('\n')}\n`, 'utf8');
    run(ffmpeg, ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', narrationList, '-c:a', 'pcm_s16le', narration]);
    run(ffmpeg, ['-hide_banner', '-y', '-f', 'lavfi', '-i', `sine=frequency=220:duration=${total}`, '-f', 'lavfi', '-i', `sine=frequency=330:duration=${total}`, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=longest,volume=0.04[a]', '-map', '[a]', '-c:a', 'pcm_s16le', music]);
    run(ffmpeg, ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-i', narration, '-i', music, '-filter_complex', '[1:a]volume=1[n];[2:a]volume=0.8[m];[n][m]amix=inputs=2:duration=longest:dropout_transition=2[a]', '-map', '0:v:0', '-map', '[a]', '-t', String(total), '-r', '30', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart', '-metadata', 'comment=原型预览：合成语音与程序占位配乐，正式发布前需替换为授权媒体', video]);
    return { video: relative(ROOT, video).replaceAll('\\', '/'), audioStatus: 'synthetic_tts' };
  } catch (error) {
    throw new Error(`视频合成失败：${error.message}`);
  } finally {
    removeIfExists(concatFile);
    removeIfExists(narrationList);
    scenes.forEach((scene) => removeIfExists(join(output, `padded-${String(scene.index).padStart(3, '0')}.wav`)));
  }
}

async function main() {
  const articlePath = resolve(arg('--article', DEFAULT_ARTICLE));
  const article = JSON.parse(await readFile(articlePath, 'utf8'));
  if (!article.slug || !Array.isArray(article.sentences) || !article.sentences.length) throw new Error('文章 JSON 缺少 slug 或 sentences。');
  const output = resolve(arg('--out', join(ROOT, 'content', 'generated', article.slug)));
  const cards = join(output, 'cards');
  const audio = join(output, 'audio');
  await mkdir(cards, { recursive: true });
  await mkdir(audio, { recursive: true });
  run(process.platform === 'win32' ? 'python' : 'python3', ['scripts/render-cards.py', '--article', articlePath, '--out', cards]);
  if (process.platform === 'win32' && !process.argv.includes('--skip-audio')) run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/generate-tts.ps1', '-ArticlePath', articlePath, '-OutputDir', audio]);
  const scenes = await buildScenes(article, audio);
  await writeSubtitles(scenes, output);
  await writeStoryboard(article, scenes, output);
  await writeConcatFile(scenes, cards, output);
  const composed = process.argv.includes('--skip-video') ? { video: null, audioStatus: 'skipped' } : composeVideo(scenes, output);
  const manifest = {
    article: article.slug,
    generatedAt: new Date().toISOString(),
    status: 'prototype_only',
    rights: 'generated_locally; replace with reviewed and licensed media before public release',
    images: article.sentences.map((_, index) => `cards/sentence-${String(index + 1).padStart(3, '0')}.png`),
    audio: article.sentences.map((_, index) => `audio/sentence-${String(index + 1).padStart(3, '0')}.wav`),
    subtitles: 'subtitles.vtt',
    narration: composed.audioStatus,
    video: composed.video ? 'lesson-preview.mp4' : null,
    music: 'procedural_placeholder',
  };
  await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`媒体生成完成：${output}`);
  console.log(`图片 ${manifest.images.length} 张；字幕 1 份；视频 ${manifest.video ? '已生成' : '未生成'}；旁白 ${manifest.narration}。`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
