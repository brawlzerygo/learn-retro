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
    if (l.startsWith('>')) { const q = []; while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; } out.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`); continue; }
    const p = []; while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { p.push(lines[i].trim()); i++; }
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
const shell = ({ title, desc, canonical, body, type = 'website' }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">
<meta name="theme-color" content="#16110e">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23c2410c'/%3E%3Ctext x='16' y='22.5' font-family='Verdana' font-weight='700' font-size='17' fill='%23fff' text-anchor='middle'%3ELR%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="/blog/blog.css">
</head>
<body>
<header><div class="wrap"><a class="brand" href="/">Learn<em>Retro</em></a><nav><a href="/">Formats</a><a href="/blog/">Blog</a><a href="https://edison.learnretro.com/" target="_blank" rel="noopener">Edison</a></nav></div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
  <p>The literal and graphical information presented on this site about Yu-Gi-Oh!, including Card images, Attribute, Level, Rank, Type Symbols, is copyright 4K Media Inc, a subsidiary of Konami Digital Entertainment (KDE), Inc.</p>
  <p>This website is not produced by, endorsed by, supported by, or affiliated with 4k Media, Studio Dice, or KDE.</p>
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
  const body = `<article class="post">
<p class="crumbs"><a href="/blog/">Blog</a></p>
<h1>${esc(p.title)}</h1>
<p class="date"><time datetime="${p.date}">${fmtDate(p.date)}</time>${p.draft ? ' · <b>Draft</b>' : ''}</p>
${md(p.body)}
</article>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, url, publisher: { '@type': 'Organization', name: 'Learn Retro Yu-Gi-Oh!' } })}</script>`;
  fs.mkdirSync(path.join(ROOT, 'blog', p.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'blog', p.slug, 'index.html'), shell({ title: `${p.title} | Learn Retro`, desc: p.description, canonical: url, body, type: 'article' }));
}
const list = posts.length ? `<ul class="posts">${posts.map(p => `<li><a href="/blog/${p.slug}/"><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><time datetime="${p.date}">${fmtDate(p.date)}</time></a></li>`).join('')}</ul>`
  : '<p class="empty">The first posts are on their way.</p>';
fs.writeFileSync(path.join(ROOT, 'blog/index.html'), shell({ title: 'Blog | Learn Retro Yu-Gi-Oh!', desc: 'News and guides for retro Yu-Gi-Oh! formats: big card sales, retro reprints in new sets, and help for Goat and Edison players.', canonical: `${SITE}/blog/`,
  body: `<section class="bloghead"><h1>The Learn Retro blog</h1><p>News and guides for retro Yu-Gi-Oh!: big sales of classic cards, retro reprints in new sets, and help for Goat and Edison players.</p></section>\n${list}` }));
const urls = [`${SITE}/`, `${SITE}/blog/`, ...posts.filter(p => !p.draft).map(p => `${SITE}/blog/${p.slug}/`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Blog: ${posts.length} post(s)${drafts ? ' (drafts included)' : ''}, ${all.filter(p => p.draft).length} draft(s) in all, sitemap.xml with ${urls.length} addresses.`);
