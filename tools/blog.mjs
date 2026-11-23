// The Learn Retro blog (Zack, 2026-11-22: news on big retro sales and retro reprints, plus help articles, mainly
// for search). Each post is a Markdown file in blog/posts/<slug>.md with a header:
//   ---
//   title: What Is Edison Format?
//   date: 2026-11-22
//   description: One sentence for search results and the post list.
//   draft: true          (optional: drafts are skipped unless run with --drafts)
//   ---
// node tools/blog.mjs writes blog/<slug>/index.html for every post, blog/index.html (newest first) and sitemap.xml
// for the whole hub. build/publish.sh --site hub runs it before every push. Posts are written in our own words, with
// every fact's source linked in the post (a "Sources" section at the end).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://learnretro.com';
const drafts = process.argv.includes('--drafts');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Card art for post headers (Zack, 2026-11-23: "use card art so theyre easier to read/more visually appealing"; picked
// the header fan + share image). A post's header may list up to 3 cards, `cards: goat/Scapegoat | edison/Black Rose Dragon`:
// each is looked up by exact name in that format's card data and shown from that format's own art (/edison/img/<id>.webp,
// /goat/img/<id>.webp), fanned under the title, and composed by ImageMagick into blog/<slug>/og.jpg (1200x630) as the
// share image. An unknown name stops the build.
import { execFileSync } from 'child_process';
const ED = path.resolve(ROOT, '..');
const CARDS = {};
for (const [fmt, file, key] of [['edison', path.join(ED, 'data/cards.js'), 'EDISON_CARDS'], ['goat', path.join(ED, 'goat/data/cards.js'), 'GOAT_CARDS']]) {
  const w = {}; new Function('window', fs.readFileSync(file, 'utf8'))(w);
  const list = Array.isArray(w[key]) ? w[key] : Object.values(w[key]);
  CARDS[fmt] = new Map(list.map(c => [c.n, c.id]));
}
function postCards(p) {
  if (!p.cards) return [];
  return p.cards.split('|').map(x => x.trim()).filter(Boolean).slice(0, 3).map(x => {
    const k = x.indexOf('/'); const fmt = x.slice(0, k), name = x.slice(k + 1).trim();
    const id = CARDS[fmt] && CARDS[fmt].get(name);
    if (!id) throw new Error(`${p.slug}: no ${fmt} card named "${name}"`);
    const src = path.join(ED, fmt === 'edison' ? 'img' : 'goat/img', `${id}.webp`);
    if (!fs.existsSync(src)) throw new Error(`${p.slug}: no art for ${name} (${src})`);
    return { fmt, name, id, url: `/${fmt}/img/${id}.webp`, src };
  });
}
const fanHTML = cs => cs.length ? `<div class="pfan n${cs.length}" aria-hidden="true">${cs.map((c, i) => `<img src="${c.url}" alt="" width="421" height="614" style="--i:${i}" loading="eager">`).join('')}</div>` : '';
// The share image: the cards fanned on the dark brand background, rebuilt only when the cards change.
function ogImage(p, cs) {
  const dir = path.join(ROOT, 'blog', p.slug), out = path.join(dir, 'og.jpg'), stamp = path.join(dir, '.og-cards');
  const key = cs.map(c => c.fmt + '/' + c.id).join('|');
  if (!cs.length) return null;
  if (fs.existsSync(out) && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === key) return `${SITE}/blog/${p.slug}/og.jpg`;
  fs.mkdirSync(dir, { recursive: true });
  const n = cs.length, rot = n === 1 ? [0] : n === 2 ? [-7, 7] : [-10, 0, 10], dx = n === 1 ? [0] : n === 2 ? [-150, 150] : [-270, 0, 270];
  const args = ['-size', '1200x630', 'radial-gradient:#2a1f18-#16110e'];
  cs.forEach((c, i) => {
    const y = n === 3 && i !== 1 ? 30 : 0;
    args.push('(', c.src, '-resize', 'x500', '(', '+clone', '-background', 'black', '-shadow', '60x14+0+10', ')', '+swap', '-background', 'none', '-layers', 'merge', '+repage',
      '-rotate', String(rot[i]), ')', '-gravity', 'center', '-geometry', `${dx[i] >= 0 ? '+' : ''}${dx[i]}+${y + 10}`, '-composite');
  });
  args.push('-strip', '-quality', '86', out);
  execFileSync('magick', args);
  fs.writeFileSync(stamp, key);
  return `${SITE}/blog/${p.slug}/og.jpg`;
}

// A small Markdown reader: headings, paragraphs, lists, quotes, images, links, bold and italic.
function inline(s) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => `<img src="${u}" alt="${a}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) && !u.startsWith(SITE) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function md(src) {
  const out = []; const lines = src.replace(/\r/g, '').split('\n'); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,4})\s+(.*)/))) { const n = m[1].length; const id = m[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); out.push(`<h${n} id="${id}">${inline(m[2])}</h${n}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
      const ol = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && (ol ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; }
      out.push(`<${ol ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`); continue;
    }
    if (/^\s*\|/.test(l)) { // a table: header row, a |---| row, then body rows
      const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); i++; }
      const body = rows.filter((r, k) => !(k === 1 && r.every(c => /^:?-+:?$/.test(c))));
      const [head, ...rest] = body;
      out.push(`<div class="tablewrap"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (l.startsWith('>')) { const q = []; while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; } out.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`); continue; }
    const p = []; while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(lines[i])) { p.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}
function readPost(f) {
  const raw = fs.readFileSync(f, 'utf8'); const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${f}: missing the --- header`);
  const meta = Object.fromEntries(m[1].split('\n').filter(x => x.includes(':')).map(x => [x.slice(0, x.indexOf(':')).trim(), x.slice(x.indexOf(':') + 1).trim()]));
  for (const k of ['title', 'date', 'description']) if (!meta[k]) throw new Error(`${f}: no ${k}`);
  if (/—/.test(raw)) throw new Error(`${f}: em dash (use a comma, colon or period)`);
  return { ...meta, draft: meta.draft === 'true', slug: path.basename(f, '.md'), body: m[2] };
}
const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const shell = ({ title, desc, canonical, body, type = 'website', image = null }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">${image ? `\n<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}">` : ''}
<meta name="theme-color" content="#16110e">
<link rel="icon" href="/img/icon-d2-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/img/icon-d2-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="/blog/blog.css?v=3">
<script src="/consent.js" defer></script>
</head>
<body>
<header><div class="wrap"><a class="brand" href="/"><img class="blogo" src="/img/icon-t1-512.png" alt="" width="32" height="32">Learn<em>Retro</em></a><nav><a href="/">Formats</a><a href="/blog/">Blog</a><a href="/goat/">Goat</a><a href="/edison/">Edison</a><a class="soc" href="https://www.youtube.com/@LearnRetro" target="_blank" rel="noopener" aria-label="Learn Retro on YouTube" title="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="currentColor"/><path d="M10 8.8v6.4l5.6-3.2z" fill="var(--soc-bg,#fff)"/></svg></a><a class="soc" href="https://www.instagram.com/learnretroygo/" target="_blank" rel="noopener" aria-label="Learn Retro on Instagram" title="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg></a></nav></div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
  <p class="socfoot"><a class="soc" href="https://www.youtube.com/@LearnRetro" target="_blank" rel="noopener" aria-label="Learn Retro on YouTube" title="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="currentColor"/><path d="M10 8.8v6.4l5.6-3.2z" fill="var(--soc-bg,#fff)"/></svg><span>YouTube</span></a><a class="soc" href="https://www.instagram.com/learnretroygo/" target="_blank" rel="noopener" aria-label="Learn Retro on Instagram" title="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg><span>Instagram</span></a></p>
  <p>The literal and graphical information presented on this site about Yu-Gi-Oh!, including Card images, Attribute, Level, Rank, Type Symbols, is copyright 4K Media Inc, a subsidiary of Konami Digital Entertainment (KDE), Inc.</p>
  <p>This website is not produced by, endorsed by, supported by, or affiliated with 4k Media, Studio Dice, or KDE. <a href="/privacy/">Privacy</a></p>
</div></footer>
</body>
</html>
`;

const dir = path.join(ROOT, 'blog/posts');
const all = fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => readPost(path.join(dir, f)));
const posts = all.filter(p => drafts || !p.draft).sort((a, b) => b.date.localeCompare(a.date));
// Remove pages of posts that were deleted, renamed or turned back into drafts.
for (const d of fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })) {
  if (d.isDirectory() && d.name !== 'posts' && !posts.some(p => p.slug === d.name)) fs.rmSync(path.join(ROOT, 'blog', d.name), { recursive: true });
}
for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}/`;
  const cs = postCards(p), image = ogImage(p, cs);
  const body = `<article class="post">
<p class="crumbs"><a href="/blog/">Blog</a></p>
<h1>${esc(p.title)}</h1>
<p class="date"><time datetime="${p.date}">${fmtDate(p.date)}</time>${p.draft ? ' · <b>Draft</b>' : ''}</p>
${fanHTML(cs)}
${md(p.body)}
</article>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, url, publisher: { '@type': 'Organization', name: 'Learn Retro Yu-Gi-Oh!' } })}</script>`;
  fs.mkdirSync(path.join(ROOT, 'blog', p.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'blog', p.slug, 'index.html'), shell({ title: `${p.title} | Learn Retro`, desc: p.description, canonical: url, body, type: 'article', image }));
}
const list = posts.length ? `<ul class="posts">${posts.map(p => `<li><a href="/blog/${p.slug}/"><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><time datetime="${p.date}">${fmtDate(p.date)}</time></a></li>`).join('')}</ul>`
  : '<p class="empty">The first posts are on their way.</p>';
fs.writeFileSync(path.join(ROOT, 'blog/index.html'), shell({ title: 'Blog | Learn Retro Yu-Gi-Oh!', desc: 'News and guides for retro Yu-Gi-Oh! formats: big card sales, retro reprints in new sets, and help for Goat and Edison players.', canonical: `${SITE}/blog/`,
  body: `<section class="bloghead"><h1>The Learn Retro blog</h1><p>News and guides for retro Yu-Gi-Oh!: big sales of classic cards, retro reprints in new sets, and help for Goat and Edison players.</p></section>\n${list}` }));
// The privacy page (2026-11-23, with Google Analytics behind the consent banner in /consent.js).
fs.mkdirSync(path.join(ROOT, 'privacy'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'privacy/index.html'), shell({ title: 'Privacy | Learn Retro Yu-Gi-Oh!', desc: 'What Learn Retro collects and how to change your cookie choice.', canonical: `${SITE}/privacy/`,
  body: `<article class="post">
<h1>Privacy</h1>
<p>Learn Retro is a free, fan-made site. There are no accounts, no ads and nothing to buy.</p>
<h2>Google Analytics</h2>
<p>If you click Accept on the cookie banner, the site loads Google Analytics, which sets cookies to count visits: which pages are read, roughly where visitors come from, and what device they use. We use it only to see which lessons and tools people use, so we know what to build next. Google processes this data under its own <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">privacy policy</a>. If you click Decline, Google Analytics never loads and nothing is counted.</p>
<h2>Saved in your browser</h2>
<p>The site remembers some things in your own browser only, like your cookie choice, your theme, lesson progress and deck lists. They never leave your device, and clearing your browser data removes them.</p>
<h2>Change your choice</h2>
<p><button type="button" class="lr-consent-open" onclick="window.lrConsent &amp;&amp; lrConsent.open()">Cookie settings</button></p>
<h2>Contact</h2>
<p>Questions: message <a href="https://www.instagram.com/learnretroygo/" target="_blank" rel="noopener">Learn Retro on Instagram</a>.</p>
</article>` }));
const urls = [`${SITE}/`, `${SITE}/blog/`, `${SITE}/privacy/`, ...posts.filter(p => !p.draft).map(p => `${SITE}/blog/${p.slug}/`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Blog: ${posts.length} post(s)${drafts ? ' (drafts included)' : ''}, ${all.filter(p => p.draft).length} draft(s) in all, sitemap.xml with ${urls.length} addresses.`);
