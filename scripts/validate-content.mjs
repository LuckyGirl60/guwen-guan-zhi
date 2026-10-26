import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const readJson = async (relativePath) => JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
const fail = (message) => { throw new Error(message); };

const index = await readJson('content/articles/index.json');
if (!Array.isArray(index.articles) || index.articles.length === 0) fail('文章清单不能为空');
const slugs = new Set();
let sentenceCount = 0;
for (const summary of index.articles) {
  for (const field of ['id', 'slug', 'title', 'contentPath']) if (!summary[field]) fail('清单缺少字段：' + field);
  if (slugs.has(summary.slug)) fail('文章 slug 重复：' + summary.slug);
  slugs.add(summary.slug);
  const article = await readJson('content/articles/' + summary.slug + '.json');
  if (article.id !== summary.id || article.slug !== summary.slug) fail('清单与文章 ID 不一致：' + summary.slug);
  if (!Array.isArray(article.sentences) || article.sentences.length === 0) fail('文章没有分句：' + summary.slug);
  sentenceCount += article.sentences.length;
  const sentenceIds = new Set();
  for (const sentence of article.sentences) {
    for (const field of ['id', 'text', 'hint', 'translation', 'insight', 'visualPath', 'visualAlt']) if (!sentence[field]) fail(summary.slug + ' 分句缺少字段：' + field);
    if (sentenceIds.has(sentence.id)) fail(summary.slug + ' 分句 ID 重复：' + sentence.id);
    sentenceIds.add(sentence.id);
    if (!Array.isArray(sentence.words)) fail(summary.slug + ' 分句字词不是数组：' + sentence.id);
  }
  if (!Array.isArray(article.mediaRefs)) fail(summary.slug + ' 缺少 mediaRefs');
}
console.log('内容校验通过：' + index.articles.length + ' 篇文章，' + sentenceCount + ' 个句子');
