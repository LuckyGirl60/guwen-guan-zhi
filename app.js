const articleSlug = new URLSearchParams(window.location.search).get('article') || 'cao-gui-lun-zhan';
const ARTICLE_URL = './content/articles/' + articleSlug + '.json';
const STORAGE_KEY = 'guwen-guan-zhi:progress:' + articleSlug;
let article = null;
const state = { selectedId: 'cao-gui-001', tab: 'translation', done: new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')), audio: null };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));

function currentSentence() {
  return article.sentences.find((item) => item.id === state.selectedId) || article.sentences[0];
}

function renderVisual() {
  const item = currentSentence();
  $('#sentence-visual').innerHTML = '<div class="visual-art"><img src="' + escapeHtml(item.visualPath || '') + '" alt="' + escapeHtml(item.visualAlt || '本句学习插图') + '"></div><div class="visual-caption"><span class="eyebrow">本句画面</span><strong>' + escapeHtml(item.text) + '</strong><p>' + escapeHtml(item.hint) + '</p></div>';
}

function renderVideo() {
  const item = article.mediaRefs?.find((media) => media.kind === 'video' && media.url);
  const slot = $('#video-slot');
  if (!item) return;
  const caption = item.status === 'prototype_generated' ? '原型预览：系统合成旁白与程序占位配乐；正式课程需替换为人工校对且已获授权的媒体。' : '授权视频：内容来源与使用范围已登记。';
  const track = item.subtitleUrl ? '<track kind="subtitles" srclang="zh" label="中文" src="' + escapeHtml(item.subtitleUrl) + '">' : '';
  slot.className = 'video-player';
  slot.innerHTML = '<video controls preload="metadata" poster="' + escapeHtml(item.poster || '') + '"><source src="' + escapeHtml(item.url) + '" type="video/mp4">' + track + '</video><small class="video-caption">' + caption + '</small>';
  const video = slot.querySelector('video');
  const status = slot.querySelector('.video-caption');
  const showFailure = () => { status.textContent = '视频暂时无法加载，请检查网络或稍后重试；逐句图片和浏览器朗读仍可继续使用。'; };
  video.addEventListener('error', showFailure);
  video.addEventListener('stalled', showFailure);
}

function renderSentences() {
  $('#sentence-list').innerHTML = article.sentences.map((item, index) => '<button class="sentence ' + (item.id === state.selectedId ? 'active ' : '') + (state.done.has(item.id) ? 'done' : '') + '" data-id="' + escapeHtml(item.id) + '"><span class="sentence-no">' + String(index + 1).padStart(2, '0') + '</span><span><span class="sentence-text">' + escapeHtml(item.text) + '</span><span class="sentence-hint">' + escapeHtml(item.hint) + '</span></span><span class="check">' + (state.done.has(item.id) ? '已理解' : '点此精读') + '</span></button>').join('');
  document.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.id; state.tab = 'translation'; renderSentences(); renderDetail(); }));
}

function renderDetail() {
  const item = currentSentence();
  const index = article.sentences.findIndex((sentence) => sentence.id === item.id);
  renderVisual();
  $('#detail-title').textContent = '第 ' + (index + 1) + ' 句';
  $('#detail-index').textContent = (index + 1) + ' / ' + article.sentences.length;
  $('#mark-understood').disabled = false;
  $('#mark-understood').textContent = state.done.has(item.id) ? '✓ 已理解 · 点击取消' : '✓ 标记这句已理解';
  document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === state.tab));
  if (state.tab === 'translation') $('#detail-panel').innerHTML = '<h3>白话翻译</h3><p>' + escapeHtml(item.translation) + '</p><p class="detail-note">先遮住翻译，自己说一遍，再打开核对。</p>';
  if (state.tab === 'words') $('#detail-panel').innerHTML = '<h3>重点字词</h3><ul>' + item.words.map(([word, meaning]) => '<li><b>' + escapeHtml(word) + '</b>：' + escapeHtml(meaning) + '</li>').join('') + '</ul>';
  if (state.tab === 'insight') $('#detail-panel').innerHTML = '<h3>历史与写法</h3><p>' + escapeHtml(item.insight) + '</p><p class="detail-note">讲解应由老师或编辑校对后作为正式教材发布。</p>';
}

function updateProgress() {
  const percent = Math.round((state.done.size / article.sentences.length) * 100);
  $('#progress-percent').textContent = percent + '%';
  $('#progress-ring').style.setProperty('--progress', percent + '%');
  $('#progress-copy').textContent = percent === 100 ? '本篇完成，可以复述主线' : '已理解 ' + state.done.size + ' / ' + article.sentences.length + ' 句';
}

function speak(text) {
  if (!('speechSynthesis' in window)) { window.alert('当前浏览器不支持中文朗读，请换用新版 Chrome、Edge 或 Safari。'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = Number($('#speech-rate').value);
  window.speechSynthesis.speak(utterance);
}

function stopReading() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (state.audio) { state.audio.pause(); state.audio.currentTime = 0; state.audio = null; }
}

function speakWithBrowser(text, onend) {
  if (!('speechSynthesis' in window)) { window.alert('当前浏览器不支持中文朗读，请换用新版 Chrome、Edge 或 Safari。'); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = Number($('#speech-rate').value);
  utterance.onend = onend;
  window.speechSynthesis.speak(utterance);
}

function playSentence(item, onend) {
  if (item.audioPath) {
    const audio = new Audio(item.audioPath);
    state.audio = audio;
    audio.onended = () => { state.audio = null; onend?.(); };
    audio.onerror = () => { state.audio = null; speakWithBrowser(item.text, onend); };
    audio.play().catch(() => { state.audio = null; speakWithBrowser(item.text, onend); });
    return;
  }
  speakWithBrowser(item.text, onend);
}

function speakSentence(index) {
  const item = article.sentences[index];
  if (!item) return;
  stopReading();
  state.selectedId = item.id;
  state.tab = 'translation';
  renderSentences(); renderDetail();
  playSentence(item);
}

function speakAll() {
  stopReading();
  let index = 0;
  const playNext = () => {
    if (index >= article.sentences.length) return;
    const item = article.sentences[index];
    state.selectedId = item.id;
    state.tab = 'translation';
    renderSentences(); renderDetail();
    playSentence(item, () => { index += 1; playNext(); });
  };
  playNext();
}

function bindEvents() {
  $('#read-all').addEventListener('click', speakAll);
  $('#read-current').addEventListener('click', () => speakSentence(article.sentences.findIndex((item) => item.id === state.selectedId)));
  $('#mark-understood').addEventListener('click', () => {
    const id = currentSentence().id;
    if (state.done.has(id)) state.done.delete(id); else state.done.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.done]));
    renderSentences(); renderDetail(); updateProgress();
  });
  document.querySelectorAll('[data-tab]').forEach((tab) => tab.addEventListener('click', () => { state.tab = tab.dataset.tab; renderDetail(); }));
  $('#reset-progress').addEventListener('click', () => {
    if (!window.confirm('确定清除本篇学习进度吗？')) return;
    state.done.clear(); localStorage.removeItem(STORAGE_KEY);
    renderSentences(); renderDetail(); updateProgress();
  });
}

async function init() {
  try {
    const response = await fetch(ARTICLE_URL);
    if (!response.ok) throw new Error('文章内容加载失败');
    article = await response.json();
    document.title = '古文精读 · ' + article.title;
    bindEvents();
    renderVideo();
    renderSentences(); renderDetail(); updateProgress();
  } catch (error) {
    $('#sentence-list').innerHTML = '<p class="empty-state">文章内容暂时无法加载，请检查内容文件和静态服务器。</p>';
    console.error(error);
  }
}

init();

