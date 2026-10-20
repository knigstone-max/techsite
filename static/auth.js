// Accounts, favorites, comments, roles (admin / dashboard) (Supabase free tier, loaded from CDN only when keys exist).
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
    notConnected: 'יופעל ברגע שמסד נתוני המשתמשים יחובר.',
    noAccess: 'אין לך הרשאה לדף הזה.', adminsOnly: 'הדף הזה מיועד לאדמינים בלבד.',
    writersOnly: 'הדף הזה מיועד לכתבים, עורכים ואדמינים. אדמין יכול לשנות לך את התפקיד.',
    search: 'חיפוש לפי אימייל או שם', searchBtn: 'חיפוש', colUser: 'משתמש/ת', colEmail: 'אימייל', colRole: 'תפקיד', colJoined: 'הצטרפות',
    you: '(את/ה)', roleSaved: 'התפקיד עודכן.', noUsers: 'לא נמצאו משתמשים.',
    roles: { reader: 'קורא/ת', writer: 'כתב/ת', editor: 'עורך/ת', admin: 'אדמין' },
    status: { draft: 'טיוטה', pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה' },
    newSub: 'טיוטה חדשה', editSub: 'עריכת טיוטה', titleHe: 'כותרת בעברית', titleEn: 'כותרת באנגלית', bodyHe: 'תוכן בעברית', bodyEn: 'תוכן באנגלית',
    category: 'קטגוריה', imageUrl: 'קישור לתמונה (https, רשמית או ברישיון חופשי)', sources: 'מקורות (קישור בכל שורה)',
    saveDraft: 'שמירה כטיוטה', submit: 'שליחה לאישור', cancel: 'ביטול', needTitle: 'צריך כותרת אחת לפחות.',
    mySubs: 'הטיוטות שלי', noSubs: 'אין עדיין טיוטות.', edit: 'עריכה', queue: 'תור לבדיקה', approve: 'אישור', reject: 'דחייה',
    note: 'הערה לכתב/ת (לא חובה)', noteLabel: 'הערת עורך:', by: 'מאת', empty: 'אין כאן כלום כרגע.',
    tabs: { pending: 'ממתינים', approved: 'אושרו (לפרסום)', rejected: 'נדחו', all: 'הכל' },
    cats: { 'smartphones-gadgets': "סמארטפונים וגאדג'טים", 'home-appliances': 'מוצרי חשמל לבית', 'tech-news': 'חדשות טכנולוגיה', reviews: 'ביקורות', tips: 'טיפים' },
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
    notConnected: 'This will be activated once the user database is connected.',
    noAccess: "You don't have access to this page.", adminsOnly: 'This page is for admins only.',
    writersOnly: 'This page is for writers, editors and admins. An admin can change your role.',
    search: 'Search by email or name', searchBtn: 'Search', colUser: 'User', colEmail: 'Email', colRole: 'Role', colJoined: 'Joined',
    you: '(you)', roleSaved: 'Role updated.', noUsers: 'No users found.',
    roles: { reader: 'Reader', writer: 'Writer', editor: 'Editor', admin: 'Admin' },
    status: { draft: 'Draft', pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' },
    newSub: 'New draft', editSub: 'Edit draft', titleHe: 'Hebrew title', titleEn: 'English title', bodyHe: 'Hebrew text', bodyEn: 'English text',
    category: 'Category', imageUrl: 'Image link (https, official or freely licensed)', sources: 'Sources (one link per line)',
    saveDraft: 'Save draft', submit: 'Submit for review', cancel: 'Cancel', needTitle: 'Add at least one title.',
    mySubs: 'My drafts', noSubs: 'No drafts yet.', edit: 'Edit', queue: 'Review queue', approve: 'Approve', reject: 'Reject',
    note: 'Note to the writer (optional)', noteLabel: 'Editor note:', by: 'by', empty: 'Nothing here right now.',
    tabs: { pending: 'Pending', approved: 'Approved (to publish)', rejected: 'Rejected', all: 'All' },
    cats: { 'smartphones-gadgets': 'Smartphones & Gadgets', 'home-appliances': 'Home Appliances', 'tech-news': 'Tech News', reviews: 'Reviews', tips: 'Tips' },
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

const RANK = { reader: 0, writer: 1, editor: 2, admin: 3 };
const ROLE_VIEWS = ['admin', 'dashboard'];

if (!enabled) {
  if (authRoot) authRoot.replaceChildren(el('p', { class: 'notice', text: ROLE_VIEWS.includes(authRoot.dataset.view) ? T.notConnected : T.soon }));
  if (commentsRoot) { commentsRoot.hidden = false; commentsRoot.replaceChildren(el('h2', { text: T.comments }), el('p', { class: 'notice', text: T.commentsSoon })); }
} else {
  start().catch((e) => {
    console.error(e);
    if (authRoot) authRoot.replaceChildren(el('p', { class: 'notice', text: ROLE_VIEWS.includes(authRoot.dataset.view) ? T.notConnected : T.soon }));
  });
}

async function start() {
  const { createClient } = await import(SUPABASE_ESM);
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
  const { data: { session } } = await sb.auth.getSession();
  const user = session?.user || null;
  document.querySelectorAll('[data-auth-link]').forEach((a) => a.classList.toggle('signed-in', !!user));
  let role = 'reader';
  if (user) {
    const { data } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (data?.role && data.role in RANK) role = data.role;
  }
  // Header shortcuts only for the roles that can use them (the database enforces access either way).
  document.querySelectorAll('[data-role-min]').forEach((a) => { a.hidden = !(user && RANK[role] >= RANK[a.dataset.roleMin]); });

  const view = authRoot?.dataset.view;
  if (view === 'login') renderLogin(sb, user);
  if (view === 'account') renderAccount(sb, user, role);
  if (view === 'admin') renderAdmin(sb, user, role);
  if (view === 'dashboard') renderDashboard(sb, user, role);
  if (post && favRoot) renderFav(sb, user);
  if (post && commentsRoot) renderComments(sb, user, role);
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

async function renderAccount(sb, user, role) {
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
    el('p', {}, T.loggedAs + ' ', el('strong', { text: user.email || '' }), ' · ' + T.colRole + ': ' + (T.roles[role] || role)),
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

async function renderComments(sb, user, role) {
  const canModerate = !!user && RANK[role] >= RANK.editor;
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
        user && (user.id === c.user_id || canModerate) ? el('button', { class: 'link-btn', type: 'button', text: T.del, on: { click: async () => {
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

// ---------- role pages ----------
function gate(user, role, min, msg) {
  if (!user) {
    authRoot.replaceChildren(el('p', { class: 'notice' }, T.notSigned + ' ', el('a', { href: page('login/'), text: T.toLogin })));
    return false;
  }
  if (RANK[role] < RANK[min]) { authRoot.replaceChildren(el('p', { class: 'notice', text: msg })); return false; }
  return true;
}

function renderAdmin(sb, user, role) {
  if (!gate(user, role, 'admin', T.adminsOnly)) return;
  const q = el('input', { type: 'search', placeholder: T.search, 'aria-label': T.search, maxlength: '100' });
  const msg = el('p', { class: 'msg', role: 'status' });
  const tbody = el('tbody');
  const table = el('table', { class: 'user-table' },
    el('thead', {}, el('tr', {}, el('th', { text: T.colUser }), el('th', { text: T.colEmail }), el('th', { text: T.colRole }), el('th', { text: T.colJoined }))), tbody);
  const form = el('form', { class: 'toolbar form', role: 'search', on: { submit: (e) => { e.preventDefault(); load(); } } },
    q, el('button', { class: 'btn', type: 'submit', text: T.searchBtn }));
  authRoot.replaceChildren(el('section', { class: 'panel' }, form, msg, table));

  async function load() {
    msg.textContent = ''; msg.classList.remove('err');
    const { data, error } = await sb.rpc('admin_list_users', { search: q.value.trim() });
    if (error) { msg.textContent = T.error; msg.classList.add('err'); return; }
    if (!data.length) { tbody.replaceChildren(el('tr', {}, el('td', { colspan: '4', class: 'empty', text: T.noUsers }))); return; }
    tbody.replaceChildren(...data.map((u) => {
      const self = u.id === user.id;
      const sel = el('select', { 'aria-label': T.colRole + ' ' + (u.email || ''), disabled: self },
        ...Object.keys(RANK).map((r) => el('option', { value: r, selected: r === u.role, text: T.roles[r] })));
      sel.addEventListener('change', async () => {
        const prev = u.role; sel.disabled = true;
        const { error } = await sb.from('profiles').update({ role: sel.value }).eq('id', u.id);
        sel.disabled = false;
        if (error) { sel.value = prev; msg.textContent = error.message || T.error; msg.classList.add('err'); return; }
        u.role = sel.value; msg.classList.remove('err'); msg.textContent = T.roleSaved;
      });
      return el('tr', {},
        el('td', {}, el('strong', { text: u.display_name || '—' }), self ? ' ' + T.you : null),
        el('td', { class: 'email', text: u.email || '' }),
        el('td', {}, sel),
        el('td', { text: u.created_at ? fmt(u.created_at) : '' }));
    }));
  }
  load();
}

function renderDashboard(sb, user, role) {
  if (!gate(user, role, 'writer', T.writersOnly)) return;
  const isEditor = RANK[role] >= RANK.editor;
  const mine = el('ul', { class: 'sub-list' });
  const formWrap = el('section', { class: 'panel' });
  const sections = [formWrap, el('section', { class: 'panel' }, el('h2', { text: T.mySubs }), mine)];
  let queueList, tab = 'pending';
  if (isEditor) {
    queueList = el('ul', { class: 'sub-list' });
    const tabs = el('div', { class: 'tabs', role: 'tablist' });
    for (const k of Object.keys(T.tabs)) {
      tabs.append(el('button', { class: 'btn btn-ghost', type: 'button', role: 'tab', 'aria-selected': k === tab ? 'true' : 'false', text: T.tabs[k], on: { click: (e) => {
        tab = k; tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b === e.currentTarget ? 'true' : 'false')); loadQueue();
      } } }));
    }
    sections.push(el('section', { class: 'panel' }, el('h2', { text: T.queue }), tabs, queueList));
  }
  authRoot.replaceChildren(...sections);
  showForm(null);
  loadMine();
  if (isEditor) loadQueue();

  function badge(s) { return el('span', { class: 'status status-' + s, text: T.status[s] || s }); }
  function title(s) { return (lang === 'en' ? (s.title_en || s.title_he) : (s.title_he || s.title_en)) || '—'; }

  function showForm(sub) {
    const f = (name, attrs = {}) => el(attrs.rows ? 'textarea' : 'input', { name, ...attrs });
    const tHe = f('title_he', { type: 'text', maxlength: '200', dir: 'rtl', lang: 'he', value: sub?.title_he || '' });
    const tEn = f('title_en', { type: 'text', maxlength: '200', dir: 'ltr', lang: 'en', value: sub?.title_en || '' });
    const bHe = f('body_he', { rows: '8', maxlength: '20000', dir: 'rtl', lang: 'he' }); bHe.value = sub?.body_he || '';
    const bEn = f('body_en', { rows: '8', maxlength: '20000', dir: 'ltr', lang: 'en' }); bEn.value = sub?.body_en || '';
    const cat = el('select', { name: 'category' }, ...Object.keys(T.cats).map((c) => el('option', { value: c, selected: c === (sub?.category || 'tech-news'), text: T.cats[c] })));
    const img = f('image_url', { type: 'url', pattern: 'https://.*', dir: 'ltr', value: sub?.image_url || '' });
    const src = f('source_links', { rows: '3', maxlength: '4000', dir: 'ltr' }); src.value = sub?.source_links || '';
    const msg = el('p', { class: 'msg', role: 'status' });
    const save = async (status) => {
      if (!tHe.value.trim() && !tEn.value.trim()) { msg.textContent = T.needTitle; msg.classList.add('err'); return; }
      const row = { title_he: tHe.value.trim() || null, title_en: tEn.value.trim() || null, body_he: bHe.value.trim() || null, body_en: bEn.value.trim() || null,
        category: cat.value, image_url: img.value.trim() || null, source_links: src.value.trim() || null, status };
      const { error } = sub ? await sb.from('submissions').update(row).eq('id', sub.id) : await sb.from('submissions').insert({ ...row, author_id: user.id });
      if (error) { msg.textContent = error.message || T.error; msg.classList.add('err'); return; }
      showForm(null); loadMine(); if (isEditor) loadQueue();
    };
    formWrap.replaceChildren(el('h2', { text: sub ? T.editSub : T.newSub }),
      el('form', { class: 'form', on: { submit: (e) => { e.preventDefault(); save('pending'); } } },
        el('label', {}, T.titleHe, tHe), el('label', {}, T.titleEn, tEn), el('label', {}, T.category, cat),
        el('label', {}, T.bodyHe, bHe), el('label', {}, T.bodyEn, bEn), el('label', {}, T.imageUrl, img), el('label', {}, T.sources, src),
        el('div', { class: 'row' },
          el('button', { class: 'btn', type: 'submit', text: T.submit }),
          el('button', { class: 'btn btn-ghost', type: 'button', text: T.saveDraft, on: { click: () => save('draft') } }),
          sub ? el('button', { class: 'btn btn-ghost', type: 'button', text: T.cancel, on: { click: () => showForm(null) } }) : null),
        msg));
    if (sub) formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadMine() {
    const { data, error } = await sb.from('submissions').select('*').eq('author_id', user.id).order('updated_at', { ascending: false }).limit(100);
    if (error) { mine.replaceChildren(el('li', { class: 'msg err', text: T.error })); return; }
    if (!data.length) { mine.replaceChildren(el('li', { class: 'empty', text: T.noSubs })); return; }
    mine.replaceChildren(...data.map((s) => el('li', { class: 'sub-item' },
      el('header', {}, el('h3', { text: title(s) }), badge(s.status)),
      el('p', { text: (T.cats[s.category] || s.category) + ' · ' + fmt(s.updated_at) }),
      s.review_note ? el('p', { text: T.noteLabel + ' ' + s.review_note }) : null,
      el('div', { class: 'row' },
        s.status !== 'approved' ? el('button', { class: 'btn btn-ghost', type: 'button', text: T.edit, on: { click: () => showForm(s) } }) : null,
        s.status === 'draft' ? el('button', { class: 'btn btn-ghost', type: 'button', text: T.del, on: { click: async () => {
          const { error } = await sb.from('submissions').delete().eq('id', s.id); if (!error) loadMine();
        } } }) : null))));
  }

  async function loadQueue() {
    let q = sb.from('submissions').select('*, profiles!submissions_author_id_fkey(display_name)').order('updated_at', { ascending: false }).limit(100);
    q = tab === 'all' ? q.neq('status', 'draft') : q.eq('status', tab);
    const { data, error } = await q;
    if (error) { queueList.replaceChildren(el('li', { class: 'msg err', text: T.error })); return; }
    if (!data.length) { queueList.replaceChildren(el('li', { class: 'empty', text: T.empty })); return; }
    queueList.replaceChildren(...data.map((s) => {
      const note = el('input', { type: 'text', maxlength: '2000', placeholder: T.note, 'aria-label': T.note, value: s.review_note || '' });
      const act = (status) => async () => {
        const { error } = await sb.from('submissions').update({ status, review_note: note.value.trim() || null }).eq('id', s.id);
        if (!error) { loadQueue(); loadMine(); }
      };
      return el('li', { class: 'sub-item' },
        el('header', {}, el('h3', { text: title(s) }), badge(s.status)),
        el('p', { text: (T.cats[s.category] || s.category) + ' · ' + T.by + ' ' + (s.profiles?.display_name || T.anon) + ' · ' + fmt(s.updated_at) }),
        s.body_he || s.body_en ? el('p', { text: ((lang === 'en' ? s.body_en || s.body_he : s.body_he || s.body_en) || '').slice(0, 400) }) : null,
        s.source_links ? el('p', { dir: 'ltr', text: s.source_links }) : null,
        el('div', { class: 'row form' }, note,
          s.status !== 'approved' ? el('button', { class: 'btn', type: 'button', text: T.approve, on: { click: act('approved') } }) : null,
          s.status !== 'rejected' ? el('button', { class: 'btn btn-ghost', type: 'button', text: T.reject, on: { click: act('rejected') } }) : null));
    }));
  }
}
