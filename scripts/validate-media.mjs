import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(process.argv[2] || join(root, 'content', 'generated', 'cao-gui-lun-zhan'));
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
const manifest = await readJson(join(output, 'manifest.json'));
const storyboard = await readJson(join(output, 'storyboard.json'));

for (const file of [...manifest.images, ...manifest.audio, manifest.subtitles, manifest.video].filter(Boolean)) {
  if (!existsSync(join(output, file))) fail(`媒体文件缺失：${file}`);
}
if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length !== manifest.images.length) fail('storyboard 与 manifest 数量不一致');
const subtitles = await readFile(join(output, manifest.subtitles), 'utf8');
const cueTimes = [...subtitles.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/g)].map((match) => [match[1], match[2]]);
if (cueTimes.length !== storyboard.scenes.length) fail('字幕 cue 数量不一致');
for (let index = 0; index < cueTimes.length; index += 1) {
  if (cueTimes[index][0] >= cueTimes[index][1]) fail(`字幕时间轴无效：第 ${index + 1} 句`);
  if (index > 0 && cueTimes[index - 1][1] > cueTimes[index][0]) fail(`字幕时间轴重叠：第 ${index + 1} 句`);
}
console.log(`媒体校验通过：${manifest.images.length} 张图片，${manifest.audio.length} 段音频，${cueTimes.length} 条字幕，视频 ${manifest.video ? '存在' : '未生成'}`);
