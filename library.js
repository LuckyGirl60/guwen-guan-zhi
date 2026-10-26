const INDEX_URL = './content/articles/index.json';
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let articles = [];

function render() {
  const query = $('#article-search').value.trim().toLowerCase();
  const visible = articles.filter((article) => [article.title, article.sourceWork, article.era, article.grades.join(' ')].join(' ').toLowerCase().includes(query));
  $('#article-count').textContent = query ? '找到 ' + visible.length + ' 篇' : articles.length + ' 篇文章';
  $('#article-grid').innerHTML = visible.map((article) => '<a class="article-tile" href="./index.html?article=' + encodeURIComponent(article.slug) + '"><div class="article-tile-top"><span class="article-era">' + escapeHtml(article.era) + '</span><span class="article-status">' + (article.status === 'published' ? '已校对' : '校对中') + '</span></div><h2>' + escapeHtml(article.title) + '</h2><p class="article-source">' + escapeHtml(article.sourceWork) + ' · ' + escapeHtml(article.grades.join('、')) + '</p><p>' + escapeHtml(article.summary) + '</p><span class="article-link">开始精读 →</span></a>').join('');
  $('#library-empty').hidden = visible.length > 0;
}

async function init() {
  try {
    const response = await fetch(INDEX_URL);
    if (!response.ok) throw new Error('文章目录加载失败');
    const data = await response.json();
    articles = data.articles || [];
    $('#article-search').addEventListener('input', render);
    render();
  } catch (error) {
    $('#article-count').textContent = '目录加载失败';
    $('#library-empty').hidden = false;
    $('#library-empty').textContent = '文章目录暂时无法加载，请检查静态服务器。';
    console.error(error);
  }
}

init();
