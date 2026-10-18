// Accounts, favorites and comments (Supabase free tier, loaded from CDN only when keys exist).
// With no keys in config.js the site stays fully static: account pages say "coming soon",
// the favorites button stays hidden and the comments area shows a short notice.
const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const root = document.documentElement;
const lang = root.lang === 'en' ? 'en' : 'he';
const BASE = root.dataset.base || '/';
const prefix = lang === 'he' ? '' : 'en/';
const page = (p) => BASE + prefix + p;
const cfg = window.SITE_CONFIG || {};
const enabled = /^https:\/\/.+/.test(cfg.SUPABASE_URL || '') && (cfg.SUPABASE_ANON_KEY || '').length > 20;

const T = {
  he: {
    soon: 'חשבונות משתמש יגיעו בקרוב. בינתיים אפשר לקרוא הכל בלי להירשם.',
    commentsSoon: 'תגובות יגיעו בקרוב.',
    email: 'אימייל', password: 'סיסמה (לא חובה אם נכנסים בקישור)',
    magic: 'שלחו לי קישור כניסה', signin: 'כניסה עם סיסמה', signup: 'הרשמה עם סיסמה',
    magicSent: 'שלחנו קישור כניסה לאימייל. אפשר לסגור את הדף הזה.',
    signupSent: 'נרשמת. בדקו את האימייל כדי לאשר את החשבון.',
    needEmail: 'צריך להזין אימייל.', needPass: 'צריך סיסמה של 8 תווים לפחות.',
    loggedAs: 'מחובר/ת בתור', signout: 'התנתקות', displayName: 'שם תצוגה (יופיע ליד התגובות)', save: 'שמירה', saved: 'נשמר.',
    favs: 'מועדפים', noFavs: 'עדיין לא שמרת פוסטים.', remove: 'הסרה',
    notSigned: 'לא מחובר/ת.', toLogin: 'להתחברות', fav: 'שמירה למועדפים', faved: 'נשמר במועדפים',
    comments: 'תגובות', noComments: 'אין עדיין תגובות.', write: 'התגובה שלך', post: 'פרסום תגובה',
    loginToComment: 'כדי להגיב צריך', del: 'מחיקה', anon: 'משתמש/ת', error: 'משהו השתבש. נסו שוב.',
  },
  en: {
    soon: 'User accounts are coming soon. Everything on the site is readable without signing up.',
    commentsSoon: 'Comments are coming soon.',
    email: 'Email', password: 'Password (optional if you use the link)',
    magic: 'Email me a sign-in link', signin: 'Sign in with password', signup: 'Sign up with password',
    magicSent: 'We sent a sign-in link to your email. You can close this page.',
    signupSent: 'Account created. Check your email to confirm it.',
    needEmail: 'Enter your email.', needPass: 'Password needs at least 8 characters.',
    loggedAs: 'Signed in as', signout: 'Sign out', displayName: 'Display name (shown next to your comments)', save: 'Save', saved: 'Saved.',
    favs: 'Favorites', noFavs: "You haven't saved any posts yet.", remove: 'Remove',
    notSigned: 'Not signed in.', toLogin: 'Sign in', fav: 'Save to favorites', faved: 'Saved to favorites',
    comments: 'Comments', noComments: 'No comments yet.', write: 'Your comment', post: 'Post comment',
    loginToComment: 'To comment, please', del: 'Delete', anon: 'Reader', error: 'Something went wrong. Try again.',
  },
}[lang];

// Tiny DOM helper. Text always goes through textContent, never innerHTML.
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
    else if (k === 'text') n.textContent = v;
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids) if (k != null) n.append(k);
  return n;
}
const fmt = (iso) => new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const authRoot = document.getElementById('auth-root');
const favRoot = document.getElementById('fav-root');
const commentsRoot = document.getElementById('comments-root');
const post = document.querySelector('article.post');

if (!enabled) {
  if (authRoot) authRoot.replaceChildren(el('p', { class: 'notice', text: T.soon }));
  if (commentsRoot) { commentsRoot.hidden = false; commentsRoot.replaceChildren(el('h2', { text: T.comments }), el('p', { class: 'notice', text: T.commentsSoon })); }
} else {
  start().catch((e) => {
    console.error(e);
    if (authRoot) authRoot.replaceChildren(el('p', { class: 'notice', text: T.soon }));
  });
}

async function start() {
  const { createClient } = await import(SUPABASE_ESM);
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
  const { data: { session } } = await sb.auth.getSession();
  const user = session?.user || null;
  document.querySelectorAll('[data-auth-link]').forEach((a) => a.classList.toggle('signed-in', !!user));

  if (authRoot?.dataset.view === 'login') renderLogin(sb, user);
  if (authRoot?.dataset.view === 'account') renderAccount(sb, user);
  if (post && favRoot) renderFav(sb, user);
  if (post && commentsRoot) renderComments(sb, user);
}

function renderLogin(sb, user) {
  if (user) { location.replace(page('account/')); return; }
  const msg = el('p', { class: 'msg', role: 'status' });
  const email = el('input', { type: 'email', name: 'email', autocomplete: 'email', required: true });
  const pass = el('input', { type: 'password', name: 'password', autocomplete: 'current-password', minlength: '8' });
  const redirect = location.origin + page('account/');
  const say = (text, err) => { msg.textContent = text; msg.classList.toggle('err', !!err); };
  const run = async (fn) => {
    if (!email.value) return say(T.needEmail, true);
    try { await fn(); } catch (e) { say(e.message || T.error, true); }
  };
  const form = el('form', { class: 'form panel', on: { submit: (e) => { e.preventDefault(); magic(); } } },
    el('label', {}, T.email, email),
    el('label', {}, T.password, pass),
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'submit', text: T.magic }),
      el('button', { class: 'btn btn-ghost', type: 'button', text: T.signin, on: { click: () => run(async () => {
        if (pass.value.length < 8) return say(T.needPass, true);
        const { error } = await sb.auth.signInWithPassword({ email: email.value, password: pass.value });
        if (error) throw error; location.replace(page('account/'));
      }) } }),
      el('button', { class: 'btn btn-ghost', type: 'button', text: T.signup, on: { click: () => run(async () => {
        if (pass.value.length < 8) return say(T.needPass, true);
        const { error } = await sb.auth.signUp({ email: email.value, password: pass.value, options: { emailRedirectTo: redirect } });
        if (error) throw error; say(T.signupSent);
      }) } })),
    msg);
  function magic() {
    run(async () => {
      const { error } = await sb.auth.signInWithOtp({ email: email.value, options: { emailRedirectTo: redirect } });
      if (error) throw error; say(T.magicSent);
    });
  }
  authRoot.replaceChildren(form);
}

async function renderAccount(sb, user) {
  if (!user) {
    authRoot.replaceChildren(el('p', { class: 'notice' }, T.notSigned + ' ', el('a', { href: page('login/'), text: T.toLogin })));
    return;
  }
  const msg = el('span', { class: 'msg', role: 'status' });
  const { data: prof } = await sb.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  const name = el('input', { type: 'text', maxlength: '40', value: prof?.display_name || '' });
  const profile = el('form', { class: 'form panel', on: { submit: async (e) => {
      e.preventDefault();
      const { error } = await sb.from('profiles').upsert({ id: user.id, display_name: name.value.trim() || null });
      msg.textContent = error ? T.error : T.saved;
    } } },
    el('p', {}, T.loggedAs + ' ', el('strong', { text: user.email || '' })),
    el('label', {}, T.displayName, name),
    el('div', { class: 'row' }, el('button', { class: 'btn', type: 'submit', text: T.save }),
      el('button', { class: 'btn btn-ghost', type: 'button', text: T.signout, on: { click: async () => { await sb.auth.signOut(); location.replace(page('')); } } })),
    msg);

  const list = el('ul', { class: 'archive' });
  const favPanel = el('section', { class: 'panel' }, el('h2', { text: T.favs }), list);
  authRoot.replaceChildren(profile, favPanel);
  const { data: favs, error } = await sb.from('favorites').select('post_slug, post_lang, post_title, created_at').order('created_at', { ascending: false });
  if (error) { list.replaceWith(el('p', { class: 'msg err', text: T.error })); return; }
  if (!favs.length) { list.replaceWith(el('p', { class: 'empty', text: T.noFavs })); return; }
  for (const f of favs) {
    const href = BASE + (f.post_lang === 'he' ? '' : 'en/') + 'posts/' + encodeURIComponent(f.post_slug) + '/';
    const li = el('li', {}, el('a', { href, text: f.post_title || f.post_slug }),
      el('button', { class: 'link-btn', type: 'button', text: T.remove, on: { click: async () => {
        const { error } = await sb.from('favorites').delete().match({ user_id: user.id, post_slug: f.post_slug, post_lang: f.post_lang });
        if (!error) li.remove();
      } } }));
    list.append(li);
  }
}

async function renderFav(sb, user) {
  const slug = post.dataset.slug, title = post.dataset.title;
  const btn = el('button', { class: 'btn btn-ghost fav-btn', type: 'button', 'aria-pressed': 'false', text: T.fav });
  favRoot.replaceChildren(btn); favRoot.hidden = false;
  let on = false;
  const paint = () => { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? '★ ' + T.faved : '☆ ' + T.fav; };
  paint();
  if (user) {
    const { data } = await sb.from('favorites').select('post_slug').match({ user_id: user.id, post_slug: slug, post_lang: lang }).maybeSingle();
    on = !!data; paint();
  }
  btn.addEventListener('click', async () => {
    if (!user) { location.href = page('login/'); return; }
    btn.disabled = true;
    const q = on
      ? sb.from('favorites').delete().match({ user_id: user.id, post_slug: slug, post_lang: lang })
      : sb.from('favorites').insert({ user_id: user.id, post_slug: slug, post_lang: lang, post_title: title });
    const { error } = await q;
    if (!error) on = !on;
    paint(); btn.disabled = false;
  });
}

async function renderComments(sb, user) {
  const slug = post.dataset.slug;
  const list = el('ol', { class: 'comment-list' });
  commentsRoot.hidden = false;
  commentsRoot.replaceChildren(el('h2', { text: T.comments }), list);

  async function load() {
    const { data, error } = await sb.from('comments')
      .select('id, body, created_at, user_id, profiles(display_name)')
      .match({ post_slug: slug, post_lang: lang }).order('created_at', { ascending: true }).limit(200);
    if (error) { list.replaceChildren(el('li', { class: 'msg err', text: T.error })); return; }
    if (!data.length) { list.replaceChildren(el('li', { class: 'empty', text: T.noComments })); return; }
    list.replaceChildren(...data.map((c) => el('li', { class: 'comment' },
      el('header', {}, el('strong', { text: c.profiles?.display_name || T.anon }), el('time', { datetime: c.created_at, text: fmt(c.created_at) }),
        user && user.id === c.user_id ? el('button', { class: 'link-btn', type: 'button', text: T.del, on: { click: async () => {
          const { error } = await sb.from('comments').delete().eq('id', c.id); if (!error) load();
        } } }) : null),
      el('p', { text: c.body }))));
  }
  await load();

  if (!user) {
    commentsRoot.append(el('p', { class: 'notice' }, T.loginToComment + ' ', el('a', { href: page('login/'), text: T.toLogin.toLowerCase() })));
    return;
  }
  const body = el('textarea', { rows: '4', maxlength: '2000', required: true });
  const msg = el('p', { class: 'msg', role: 'status' });
  commentsRoot.append(el('form', { class: 'form', on: { submit: async (e) => {
      e.preventDefault();
      const text = body.value.trim(); if (!text) return;
      const { error } = await sb.from('comments').insert({ post_slug: slug, post_lang: lang, user_id: user.id, body: text });
      if (error) { msg.textContent = T.error; msg.classList.add('err'); return; }
      body.value = ''; msg.textContent = ''; load();
    } } },
    el('label', {}, T.write, body), el('div', { class: 'row' }, el('button', { class: 'btn', type: 'submit', text: T.post })), msg));
}
