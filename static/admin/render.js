// Live preview: a JS port of build.py md_to_html (same rules the site uses when it builds).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function inlineMd(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*(?!\*)(.+?)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    if (/^(javascript|data|vbscript):/i.test(href)) return text;
    const ext = href.startsWith('http');
    return `<a href="${href}"${ext ? ' rel="noopener" target="_blank"' : ''}>${text}</a>`;
  });
  return s;
}

const BODY_IMG = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

export function imageUrl(src, assets) {
  if (!src) return '';
  if (/^https:\/\//.test(src)) return src;
  return assets + src.replace(/^\/+/, '');
}

export function renderMarkdown(md, assets) {
  const out = []; let para = []; let lst = null; let box = null; const problems = [];
  const flush = () => {
    if (para.length) { out.push('<p>' + inlineMd(para.join(' ')) + '</p>'); para = []; }
    if (lst) { out.push(`<${lst[0]}>` + lst[1].map((i) => `<li>${inlineMd(i)}</li>`).join('') + `</${lst[0]}>`); lst = null; }
  };
  for (const line of String(md || '').split(/\r?\n/)) {
    const s = line.trim();
    if (!s) { flush(); continue; }
    const bx = s.match(/^:::\s*([a-z-]*)\s*$/);
    if (bx) {
      flush();
      if (box === null) box = [bx[1] || 'box', out.length];
      else {
        const [cls, start] = box;
        let inner = out.splice(start).join('\n');
        inner = inner.replace(/<p>(\d+(?:\.\d)?\/10)<\/p>/g, '<p class="score">$1</p>');
        out.push(`<aside class="box box-${esc(cls)}">${inner}</aside>`); box = null;
      }
      continue;
    }
    const im = s.match(BODY_IMG);
    if (im) {
      flush();
      if (!im[1]) problems.push('image_alt');
      const cap = im[3] ? `<figcaption>${inlineMd(im[3])}</figcaption>` : '';
      out.push(`<figure class="body-figure"><img src="${esc(imageUrl(im[2], assets))}" alt="${esc(im[1])}" loading="lazy">${cap}</figure>`);
      continue;
    }
    const h = s.match(/^(#{2,4})\s+(.*)$/);
    const ul = s.match(/^[-*]\s+(.*)$/);
    const ol = s.match(/^\d+[.)]\s+(.*)$/);
    if (h) { flush(); const n = h[1].length; out.push(`<h${n}>${inlineMd(h[2])}</h${n}>`); }
    else if (s.startsWith('>')) { flush(); out.push(`<blockquote><p>${inlineMd(s.replace(/^[>\s]+/, ''))}</p></blockquote>`); }
    else if (ul || ol) {
      if (para.length) { out.push('<p>' + inlineMd(para.join(' ')) + '</p>'); para = []; }
      const tag = ul ? 'ul' : 'ol';
      if (!lst || lst[0] !== tag) { flush(); lst = [tag, []]; }
      lst[1].push((ul || ol)[1]);
    } else { if (lst) flush(); para.push(s); }
  }
  flush();
  if (box !== null) problems.push('unclosed_box');
  return { html: out.join('\n'), problems };
}
