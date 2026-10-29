// TechnoBayit CMS: a small single-page app. Supabase Auth + Postgres (RLS) + Storage, public key only.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
import { renderMarkdown, imageUrl } from './render.js';

const CFG = JSON.parse(document.getElementById('cms-config').textContent);
const ADMIN_PAGE = location.origin + location.pathname;
const START_URL = new URL(location.href);
const RECOVERY_IN_HASH = /type=recovery/.test(location.hash);
const sb = createClient(CFG.supabaseUrl, CFG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'technobayit-cms' },
});
const app = document.getElementById('app');
const RANK = { writer: 1, editor: 2, admin: 3 };

// ---------- text ----------
const T = {
  he: {
    cms: 'מערכת ניהול', brand: 'טכנו-בית', login_title: 'כניסה למערכת', login_sub: 'כניסה לכותבים, עורכים ומנהלים',
    email: 'אימייל', password: 'סיסמה', sign_in: 'כניסה', signing_in: 'נכנס…', forgot: 'שכחתי סיסמה',
    forgot_title: 'איפוס סיסמה', forgot_sub: 'נשלח קישור לאיפוס לכתובת האימייל של החשבון.', send_link: 'שליחת קישור', back_login: 'חזרה לכניסה',
    forgot_sent: 'אם קיים חשבון עם הכתובת הזו, נשלח אליו קישור לאיפוס. אפשר גם לבקש מהמנהל קישור איפוס ישיר.',
    bad_login: 'האימייל או הסיסמה לא נכונים.', link_invalid: 'הקישור לא תקף או שכבר נעשה בו שימוש. בקשו מהמנהל קישור חדש.',
    set_pw_title: 'בחירת סיסמה', set_pw_invite: 'ברוכים הבאים לצוות! בחרו שם תצוגה וסיסמה.', set_pw_reset: 'בחרו סיסמה חדשה לחשבון.',
    display_name: 'שם תצוגה', new_password: 'סיסמה חדשה', confirm_password: 'אימות סיסמה', save_password: 'שמירה וכניסה',
    pw_rule: 'לפחות 10 תווים.', pw_short: 'הסיסמה קצרה מדי (לפחות 10 תווים).', pw_mismatch: 'הסיסמאות לא תואמות.',
    no_role_title: 'החשבון עדיין לא מאושר', no_role: 'נכנסת בהצלחה, אבל לחשבון עדיין אין הרשאה. בקשו מהמנהל להגדיר לכם תפקיד (כותב/ת או עורך/ת).',
    sign_out: 'יציאה', nav_posts: 'פוסטים', nav_new: 'פוסט חדש', nav_users: 'משתמשים', nav_account: 'החשבון שלי', view_site: 'לאתר',
    role_admin: 'מנהל', role_editor: 'עורך', role_writer: 'כותב', role_none: 'ללא הרשאה',
    posts_title: 'כל הפוסטים', search: 'חיפוש לפי כותרת או כתובת', all_langs: 'כל השפות', all_cats: 'כל הקטגוריות', all_status: 'כל הסטטוסים',
    he: 'עברית', en: 'English', published: 'פורסם', draft: 'טיוטה', n_posts: 'פוסטים', n_published: 'פורסמו', n_drafts: 'טיוטות',
    edit: 'עריכה', view: 'צפייה', del: 'מחיקה', no_posts: 'אין פוסטים שמתאימים לסינון.', updated: 'עודכן', by: 'מאת', loading: 'טוען…',
    confirm_delete: 'למחוק את הפוסט?', confirm_delete_body: 'הפוסט "{t}" יימחק לצמיתות ויורד מהאתר בבנייה הבאה. אי אפשר לבטל.', cancel: 'ביטול', yes_delete: 'כן, למחוק',
    deleted: 'הפוסט נמחק.', no_permission: 'אין לך הרשאה לפעולה הזו.',
    new_post: 'פוסט חדש', edit_post: 'עריכת פוסט', f_lang: 'שפה', f_title: 'כותרת', f_slug: 'כתובת (slug)', f_slug_hint: 'אותיות אנגליות קטנות, ספרות ומקפים. זו הכתובת של הפוסט באתר.',
    f_category: 'קטגוריה', f_excerpt: 'תקציר', f_excerpt_hint: 'משפט-שניים שמופיעים בכרטיס ובתוצאות חיפוש.', f_body: 'תוכן הפוסט',
    f_body_hint: 'Markdown: ## כותרת, **מודגש**, - רשימה, > ציטוט. תמונה בגוף: כפתור "תמונה בגוף". קופסת ציון: :::score ... :::',
    f_cover: 'תמונה ראשית', upload: 'העלאת תמונה', uploading: 'מעלה…', remove_img: 'הסרה', f_alt: 'תיאור התמונה (alt)', f_credit: 'קרדיט לתמונה',
    f_credit_url: 'קישור לקרדיט (לא חובה)', f_pos: 'מיקוד התמונה', pos_center: 'מרכז', pos_top: 'למעלה', pos_bottom: 'למטה',
    f_sources: 'קישורי מקור (אחד בכל שורה, לא חובה)', f_date: 'תאריך פרסום', f_date_hint: 'ריק = עכשיו, כשמפרסמים.', f_placeholder: 'סמן כ"פוסט לדוגמה"',
    tb_h2: 'כותרת', tb_h3: 'תת-כותרת', tb_bold: 'מודגש', tb_list: 'רשימה', tb_quote: 'ציטוט', tb_box: 'קופסה', tb_score: 'קופסת ציון', tb_img: 'תמונה בגוף', tb_link: 'קישור',
    preview: 'תצוגה מקדימה', hide_preview: 'הסתרת תצוגה', show_preview: 'הצגת תצוגה',
    save_draft: 'שמירת טיוטה', publish: 'פרסום', update: 'עדכון הפוסט', unpublish: 'החזרה לטיוטה', saving: 'שומר…',
    saved: 'נשמר.', published_ok: 'פורסם! הפוסט יופיע באתר תוך כחצי שעה.', unpublished_ok: 'הפוסט הוחזר לטיוטה ויירד מהאתר בבנייה הבאה.',
    status_draft: 'טיוטה (לא באתר)', status_published: 'מפורסם באתר', writer_note: 'ככותב/ת אפשר לשמור טיוטות. עורך או מנהל יפרסם.',
    req: 'חסר: {f}', slug_taken: 'כבר יש פוסט עם הכתובת הזו בשפה הזו. בחרו כתובת אחרת.', alt_needed: 'לתמונה צריך תיאור (alt) וקרדיט.',
    unsaved: 'יש שינויים שלא נשמרו. לצאת בכל זאת?', img_type: 'אפשר להעלות רק JPG, PNG או WEBP.', img_size: 'התמונה גדולה מדי (עד 5MB).',
    body_img_title: 'הוספת תמונה לגוף הפוסט', body_img_file: 'קובץ תמונה', body_img_alt: 'תיאור התמונה (חובה)', body_img_caption: 'כיתוב מתחת לתמונה (לא חובה)', insert: 'הוספה',
    link_text: 'טקסט הקישור', link_url: 'כתובת (https://…)',
    users_title: 'משתמשים וצוות', invite_title: 'הזמנת כותב/ת או עורך/ת', invite_btn: 'יצירת קישור הזמנה', role: 'תפקיד', name: 'שם', last_login: 'כניסה אחרונה', never: 'עוד לא',
    invite_done: 'נוצר קישור הזמנה. שלחו אותו לאדם (וואטסאפ/מייל). הקישור חד-פעמי ותקף לזמן מוגבל; בו בוחרים סיסמה.', copy: 'העתקה', copied: 'הועתק!',
    reset_link: 'קישור איפוס סיסמה', reset_done: 'קישור איפוס חד-פעמי (שלחו אותו לבעל החשבון):', remove_user: 'הסרה', confirm_remove: 'להסיר את המשתמש?',
    confirm_remove_body: 'החשבון של {t} יימחק. הפוסטים שלו נשארים.', role_saved: 'התפקיד עודכן.', already_exists: 'כבר יש משתמש עם האימייל הזה.', bot: 'בוט',
    pending: 'ממתין לאישור', roles_help: 'כותב: כותב טיוטות. עורך: עורך ומפרסם כל פוסט. מנהל: הכל + ניהול משתמשים.',
    account_title: 'החשבון שלי', save: 'שמירה', pw_changed: 'הסיסמה עודכנה.', change_pw: 'שינוי סיסמה', profile_saved: 'נשמר.',
    error: 'משהו השתבש: {m}', rebuild_note: 'האתר נבנה מחדש אוטומטית כל חצי שעה, כך ששינויים מופיעים באתר תוך כ-30 דקות.',
  },
  en: {
    cms: 'CMS', brand: 'TechnoBayit', login_title: 'Sign in', login_sub: 'For writers, editors and admins',
    email: 'Email', password: 'Password', sign_in: 'Sign in', signing_in: 'Signing in…', forgot: 'Forgot password',
    forgot_title: 'Reset password', forgot_sub: 'We will email a reset link to the account address.', send_link: 'Send link', back_login: 'Back to sign in',
    forgot_sent: 'If an account exists for that address, a reset link is on its way. You can also ask the admin for a direct reset link.',
    bad_login: 'Wrong email or password.', link_invalid: 'This link is invalid or was already used. Ask the admin for a new one.',
    set_pw_title: 'Choose a password', set_pw_invite: 'Welcome to the team! Pick a display name and a password.', set_pw_reset: 'Choose a new password.',
    display_name: 'Display name', new_password: 'New password', confirm_password: 'Confirm password', save_password: 'Save and continue',
    pw_rule: 'At least 10 characters.', pw_short: 'Password too short (10+ characters).', pw_mismatch: 'Passwords do not match.',
    no_role_title: 'Account not approved yet', no_role: 'You are signed in, but your account has no role yet. Ask the admin to make you a writer or editor.',
    sign_out: 'Sign out', nav_posts: 'Posts', nav_new: 'New post', nav_users: 'Users', nav_account: 'My account', view_site: 'View site',
    role_admin: 'Admin', role_editor: 'Editor', role_writer: 'Writer', role_none: 'No access',
    posts_title: 'All posts', search: 'Search title or slug', all_langs: 'All languages', all_cats: 'All categories', all_status: 'Any status',
    he: 'עברית', en: 'English', published: 'Published', draft: 'Draft', n_posts: 'posts', n_published: 'published', n_drafts: 'drafts',
    edit: 'Edit', view: 'View', del: 'Delete', no_posts: 'No posts match these filters.', updated: 'Updated', by: 'by', loading: 'Loading…',
    confirm_delete: 'Delete this post?', confirm_delete_body: '"{t}" will be deleted for good and removed from the site on the next build. This cannot be undone.', cancel: 'Cancel', yes_delete: 'Yes, delete',
    deleted: 'Post deleted.', no_permission: 'You do not have permission for that.',
    new_post: 'New post', edit_post: 'Edit post', f_lang: 'Language', f_title: 'Title', f_slug: 'URL slug', f_slug_hint: 'Lowercase latin letters, digits and hyphens. This is the post address.',
    f_category: 'Category', f_excerpt: 'Excerpt', f_excerpt_hint: 'One or two sentences for cards and search results.', f_body: 'Post body',
    f_body_hint: 'Markdown: ## heading, **bold**, - list, > quote. In-body image: the "Body image" button. Score box: :::score ... :::',
    f_cover: 'Cover image', upload: 'Upload image', uploading: 'Uploading…', remove_img: 'Remove', f_alt: 'Image description (alt)', f_credit: 'Image credit',
    f_credit_url: 'Credit link (optional)', f_pos: 'Image focus', pos_center: 'Center', pos_top: 'Top', pos_bottom: 'Bottom',
    f_sources: 'Source links (one per line, optional)', f_date: 'Publish date', f_date_hint: 'Empty = now, when published.', f_placeholder: 'Mark as "sample post"',
    tb_h2: 'Heading', tb_h3: 'Subheading', tb_bold: 'Bold', tb_list: 'List', tb_quote: 'Quote', tb_box: 'Box', tb_score: 'Score box', tb_img: 'Body image', tb_link: 'Link',
    preview: 'Preview', hide_preview: 'Hide preview', show_preview: 'Show preview',
    save_draft: 'Save draft', publish: 'Publish', update: 'Update post', unpublish: 'Unpublish', saving: 'Saving…',
    saved: 'Saved.', published_ok: 'Published! It will be on the site within about 30 minutes.', unpublished_ok: 'Back to draft; it leaves the site on the next build.',
    status_draft: 'Draft (not on the site)', status_published: 'Live on the site', writer_note: 'Writers save drafts; an editor or admin publishes.',
    req: 'Missing: {f}', slug_taken: 'A post with this slug already exists in this language. Pick another.', alt_needed: 'The image needs a description (alt) and a credit.',
    unsaved: 'You have unsaved changes. Leave anyway?', img_type: 'Only JPG, PNG or WEBP images.', img_size: 'Image too large (max 5 MB).',
    body_img_title: 'Add an image to the body', body_img_file: 'Image file', body_img_alt: 'Image description (required)', body_img_caption: 'Caption (optional)', insert: 'Insert',
    link_text: 'Link text', link_url: 'URL (https://…)',
    users_title: 'Users and team', invite_title: 'Invite a writer or editor', invite_btn: 'Create invite link', role: 'Role', name: 'Name', last_login: 'Last sign-in', never: 'Never',
    invite_done: 'Invite link created. Send it to the person (WhatsApp/email). It works once, for a limited time, and lets them choose a password.', copy: 'Copy', copied: 'Copied!',
    reset_link: 'Password reset link', reset_done: 'One-time reset link (send it to the account owner):', remove_user: 'Remove', confirm_remove: 'Remove this user?',
    confirm_remove_body: "{t}'s account will be deleted. Their posts stay.", role_saved: 'Role updated.', already_exists: 'A user with this email already exists.', bot: 'bot',
    pending: 'Pending', roles_help: 'Writer: writes drafts. Editor: edits and publishes any post. Admin: everything + user management.',
    account_title: 'My account', save: 'Save', pw_changed: 'Password updated.', change_pw: 'Change password', profile_saved: 'Saved.',
    error: 'Something went wrong: {m}', rebuild_note: 'The site rebuilds automatically every 30 minutes, so changes show up within about half an hour.',
  },
};
let LANG = START_URL.searchParams.get('lang') || localStorage.getItem('cms-lang') || 'he';
if (!T[LANG]) LANG = 'he';
const t = (k, vars) => { let s = T[LANG][k] ?? T.he[k] ?? k; for (const [a, b] of Object.entries(vars || {})) s = s.replace('{' + a + '}', b); return s; };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const catName = (slug, lang = LANG) => (CFG.categories.find((c) => c.slug === slug) || {})[lang] || slug;
const fmtDate = (d) => d ? new Date(d).toLocaleString(LANG === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }) : '';
const postUrl = (p) => CFG.base + (p.lang === 'he' ? '' : p.lang + '/') + 'posts/' + p.slug + '/';
const $ = (sel, root = document) => root.querySelector(sel);

function applyLang() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'he' ? 'rtl' : 'ltr';
  document.title = `${t('brand')} · ${t('cms')}`;
}
applyLang();

// ---------- state ----------
const S = { user: null, profile: null, dirty: false, recovering: RECOVERY_IN_HASH };
const role = () => S.profile?.role || null;
const atLeast = (r) => (RANK[role()] || 0) >= RANK[r];

sb.auth.onAuthStateChange((ev) => {
  if (ev === 'PASSWORD_RECOVERY') { S.recovering = true; setTimeout(() => viewSetPassword(false), 0); }
  if (ev === 'SIGNED_OUT') { S.user = null; S.profile = null; }
});
window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

// ---------- small UI helpers ----------
function toast(msg, ms = 3200) {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.append(el); setTimeout(() => el.remove(), ms);
}
function showMsg(box, msg, kind = 'err') { box.innerHTML = msg ? `<div class="msg ${kind}">${esc(msg)}</div>` : ''; }
function dialog(html) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog'); d.className = 'cms-dialog'; d.innerHTML = html;
    document.body.append(d); d.showModal();
    d.addEventListener('close', () => { resolve(d.returnValue === 'ok' ? d : null); setTimeout(() => d.remove(), 0); });
    d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => d.close(b.dataset.close)));
  });
}
async function confirmBox(title, body, okLabel) {
  const d = await dialog(`<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="dialog-actions">
    <button class="btn" data-close="cancel" type="button">${esc(t('cancel'))}</button>
    <button class="btn danger" data-close="ok" type="button">${esc(okLabel)}</button></div>`);
  return !!d;
}
function errText(e) { return e?.message || String(e); }
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch { const i = btn.parentElement.querySelector('input'); i?.select(); document.execCommand('copy'); }
  const old = btn.textContent; btn.textContent = t('copied'); setTimeout(() => (btn.textContent = old), 1500);
}
const brandHtml = () => `<a class="cms-brand" href="${esc(CFG.base)}"><span class="brand-mark" aria-hidden="true"></span>${esc(t('brand'))}</a>`;
const langBtn = () => `<button class="btn small" type="button" data-lang-toggle>${LANG === 'he' ? 'English' : 'עברית'}</button>`;
function wireLang(root) {
  root.querySelectorAll('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => {
    if (S.dirty && !confirm(t('unsaved'))) return;
    S.dirty = false; LANG = LANG === 'he' ? 'en' : 'he'; localStorage.setItem('cms-lang', LANG);
    const u = new URL(location.href); if (LANG === 'he') u.searchParams.delete('lang'); else u.searchParams.set('lang', LANG);
    history.replaceState(null, '', u); applyLang(); render();
  }));
}

// ---------- auth screens ----------
function centerCard(inner) {
  app.innerHTML = `<div class="cms-center"><div class="cms-card">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem">${brandHtml()}${langBtn()}</div>${inner}</div></div>`;
  wireLang(app);
}

function viewLogin(message, kind = 'err') {
  centerCard(`<h1>${esc(t('login_title'))}</h1><p class="cms-muted" style="margin-top:0">${esc(t('login_sub'))}</p>
    <div id="m"></div>
    <form id="lf" novalidate>
      <label class="f"><span>${esc(t('email'))}</span><input type="email" name="email" autocomplete="username" required dir="ltr"></label>
      <label class="f"><span>${esc(t('password'))}</span><input type="password" name="password" autocomplete="current-password" required dir="ltr"></label>
      <button class="btn primary block" type="submit">${esc(t('sign_in'))}</button>
    </form>
    <p style="margin-bottom:0"><button class="linkbtn" type="button" id="fg">${esc(t('forgot'))}</button></p>`);
  const m = $('#m'); if (message) showMsg(m, message, kind);
  $('#fg').addEventListener('click', viewForgot);
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const b = f.querySelector('button');
    b.disabled = true; b.textContent = t('signing_in'); showMsg(m, '');
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (error) { b.disabled = false; b.textContent = t('sign_in'); return showMsg(m, /invalid/i.test(error.message) ? t('bad_login') : t('error', { m: error.message })); }
    await boot();
  });
  $('#lf').email.focus();
}

function viewForgot() {
  centerCard(`<h1>${esc(t('forgot_title'))}</h1><p class="cms-muted" style="margin-top:0">${esc(t('forgot_sub'))}</p><div id="m"></div>
    <form id="ff"><label class="f"><span>${esc(t('email'))}</span><input type="email" name="email" required dir="ltr" autocomplete="username"></label>
    <button class="btn primary block" type="submit">${esc(t('send_link'))}</button></form>
    <p style="margin-bottom:0"><button class="linkbtn" type="button" id="bk">${esc(t('back_login'))}</button></p>`);
  $('#bk').addEventListener('click', () => viewLogin());
  $('#ff').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true;
    await sb.auth.resetPasswordForEmail(e.target.email.value.trim(), { redirectTo: ADMIN_PAGE });
    showMsg($('#m'), t('forgot_sent'), 'ok'); b.disabled = false;
  });
}

function viewSetPassword(isInvite) {
  centerCard(`<h1>${esc(t('set_pw_title'))}</h1><p class="cms-muted" style="margin-top:0">${esc(t(isInvite ? 'set_pw_invite' : 'set_pw_reset'))}</p><div id="m"></div>
    <form id="pf" novalidate>
      ${isInvite ? `<label class="f"><span>${esc(t('display_name'))}</span><input type="text" name="dn" maxlength="60" autocomplete="name"></label>` : ''}
      <label class="f"><span>${esc(t('new_password'))}</span><input type="password" name="p1" autocomplete="new-password" dir="ltr" required><small>${esc(t('pw_rule'))}</small></label>
      <label class="f"><span>${esc(t('confirm_password'))}</span><input type="password" name="p2" autocomplete="new-password" dir="ltr" required></label>
      <button class="btn primary block" type="submit">${esc(t('save_password'))}</button></form>`);
  const f = $('#pf');
  sb.auth.getUser().then(async ({ data }) => {
    if (isInvite && data.user) {
      const { data: p } = await sb.from('profiles').select('display_name').eq('id', data.user.id).maybeSingle();
      if (p?.display_name && !f.dn.value) f.dn.value = p.display_name;
    }
  });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const m = $('#m');
    if (f.p1.value.length < 10) return showMsg(m, t('pw_short'));
    if (f.p1.value !== f.p2.value) return showMsg(m, t('pw_mismatch'));
    const b = f.querySelector('button'); b.disabled = true;
    const { data, error } = await sb.auth.updateUser({ password: f.p1.value });
    if (error) { b.disabled = false; return showMsg(m, t('error', { m: error.message })); }
    if (isInvite && f.dn.value.trim()) await sb.from('profiles').update({ display_name: f.dn.value.trim() }).eq('id', data.user.id);
    S.recovering = false; toast(t('pw_changed')); history.replaceState(null, '', location.pathname + location.search + '#/posts'); await boot();
  });
}

function viewNoRole() {
  centerCard(`<h1>${esc(t('no_role_title'))}</h1><div class="msg info">${esc(t('no_role'))}</div>
    <p class="cms-muted">${esc(S.user?.email || '')}</p><button class="btn block" type="button" id="so">${esc(t('sign_out'))}</button>`);
  $('#so').addEventListener('click', signOut);
}
async function signOut() { await sb.auth.signOut({ scope: 'local' }); S.dirty = false; history.replaceState(null, '', location.pathname + location.search); viewLogin(); }

// ---------- shell ----------
function shell(active) {
  const nav = [['posts', '#/posts', 'nav_posts'], ['new', '#/new', 'nav_new']];
  if (atLeast('admin')) nav.push(['users', '#/users', 'nav_users']);
  nav.push(['account', '#/account', 'nav_account']);
  app.innerHTML = `<header class="cms-top"><div class="wrap">
      ${brandHtml()}<span class="cms-tag">${esc(t('cms'))}</span>
      <nav class="cms-nav" aria-label="CMS">${nav.map(([k, h, l]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${esc(t(l))}</a>`).join('')}</nav>
      <div class="cms-me"><span>${esc(S.profile?.display_name || S.user?.email || '')}</span>
        <span class="role-chip role-${esc(role())}">${esc(t('role_' + role()))}</span>
        <a class="btn small" href="${esc(CFG.base + (LANG === 'he' ? '' : 'en/'))}" target="_blank" rel="noopener">${esc(t('view_site'))}</a>
        ${langBtn()}<button class="btn small" type="button" id="so">${esc(t('sign_out'))}</button></div>
    </div></header><main class="cms-main wrap" id="main"></main>`;
  wireLang(app); $('#so').addEventListener('click', signOut);
  return $('#main');
}

// ---------- dashboard ----------
const filters = JSON.parse(sessionStorage.getItem('cms-filters') || '{}');
async function viewPosts() {
  const main = shell('posts');
  const cats = CFG.categories.map((c) => `<option value="${esc(c.slug)}">${esc(c[LANG])}</option>`).join('');
  main.innerHTML = `<div class="page-title"><h1>${esc(t('posts_title'))}</h1><a class="btn primary" href="#/new">+ ${esc(t('nav_new'))}</a></div>
    <div class="stats" id="stats"></div>
    <div class="cms-panel"><form class="filters" id="flt" role="search">
      <input type="search" name="q" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}">
      <select name="lang" aria-label="${esc(t('f_lang'))}"><option value="">${esc(t('all_langs'))}</option><option value="he">עברית</option><option value="en">English</option></select>
      <select name="cat" aria-label="${esc(t('f_category'))}"><option value="">${esc(t('all_cats'))}</option>${cats}</select>
      <select name="status" aria-label="status"><option value="">${esc(t('all_status'))}</option><option value="published">${esc(t('published'))}</option><option value="draft">${esc(t('draft'))}</option></select>
    </form></div><p class="hint">${esc(t('rebuild_note'))}</p><ul class="post-list" id="list"><li class="empty-box">${esc(t('loading'))}</li></ul>`;
  const form = $('#flt');
  for (const k of ['q', 'lang', 'cat', 'status']) form[k].value = filters[k] || '';
  let timer;
  const reload = () => { for (const k of ['q', 'lang', 'cat', 'status']) filters[k] = form[k].value; sessionStorage.setItem('cms-filters', JSON.stringify(filters)); load(); };
  form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(reload, 250); });
  form.addEventListener('submit', (e) => { e.preventDefault(); reload(); });
  const { data: people } = await sb.from('profiles').select('id, display_name');
  const names = new Map((people || []).map((p) => [p.id, p.display_name]));
  async function load() {
    let q = sb.from('posts').select('id, lang, slug, title, category, status, image, updated_at, published_at, author_id').order('updated_at', { ascending: false }).limit(1000);
    if (filters.lang) q = q.eq('lang', filters.lang);
    if (filters.cat) q = q.eq('category', filters.cat);
    if (filters.status) q = q.eq('status', filters.status);
    const s = (filters.q || '').replace(/[%,()*"\\]/g, ' ').trim();
    if (s) q = q.or(`title.ilike."*${s}*",slug.ilike."*${s}*"`);
    const { data, error } = await q;
    const list = $('#list'); if (!list) return;
    if (error) { list.innerHTML = `<li class="msg err">${esc(t('error', { m: error.message }))}</li>`; return; }
    const pub = data.filter((p) => p.status === 'published').length;
    $('#stats').innerHTML = `<div class="stat"><b>${data.length}</b>${esc(t('n_posts'))}</div><div class="stat"><b>${pub}</b>${esc(t('n_published'))}</div><div class="stat"><b>${data.length - pub}</b>${esc(t('n_drafts'))}</div>`;
    if (!data.length) { list.innerHTML = `<li class="empty-box">${esc(t('no_posts'))}</li>`; return; }
    list.innerHTML = data.map((p) => {
      const canEdit = atLeast('editor') || (p.author_id === S.user.id && p.status === 'draft');
      const img = p.image ? `<img class="thumb" src="${esc(imageUrl(p.image, CFG.assets))}" alt="" loading="lazy">` : '<span class="thumb"></span>';
      return `<li class="post-row" data-id="${esc(p.id)}">${img}<div>
        <h3>${canEdit ? `<a href="#/edit/${esc(p.id)}">${esc(p.title)}</a>` : esc(p.title)}</h3>
        <div class="meta"><span class="pill ${esc(p.status)}">${esc(t(p.status))}</span><span class="pill">${p.lang === 'he' ? 'עב' : 'EN'}</span>
          <span>${esc(catName(p.category))}</span><span>${esc(t('updated'))}: ${esc(fmtDate(p.updated_at))}</span>
          ${names.get(p.author_id) ? `<span>${esc(t('by'))} ${esc(names.get(p.author_id))}</span>` : ''}</div></div>
        <div class="row-actions">${canEdit ? `<a class="btn small" href="#/edit/${esc(p.id)}">${esc(t('edit'))}</a>` : ''}
          ${p.status === 'published' ? `<a class="btn small" href="${esc(postUrl(p))}" target="_blank" rel="noopener">${esc(t('view'))}</a>` : ''}
          ${canEdit ? `<button class="btn small danger" type="button" data-del="${esc(p.id)}" data-title="${esc(p.title)}">${esc(t('del'))}</button>` : ''}</div></li>`;
    }).join('');
    list.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => deletePost(b.dataset.del, b.dataset.title, load)));
  }
  load();
}

async function deletePost(id, title, after) {
  if (!(await confirmBox(t('confirm_delete'), t('confirm_delete_body', { t: title }), t('yes_delete')))) return false;
  const { data, error } = await sb.from('posts').delete().eq('id', id).select('id');
  if (error) { toast(t('error', { m: error.message })); return false; }
  if (!data.length) { toast(t('no_permission')); return false; }
  toast(t('deleted')); S.dirty = false; if (after) after(); return true;
}

// ---------- images ----------
async function uploadImage(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error(t('img_type'));
  let blob = file;
  try { // shrink to max 1600px wide and convert to WEBP for a fast site
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / bmp.width);
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const b = await new Promise((r) => c.toBlob(r, 'image/webp', 0.85));
    if (b && b.type === 'image/webp' && (b.size < file.size || scale < 1 || file.type !== 'image/webp')) blob = b;
  } catch { /* keep the original */ }
  if (blob.size > 5 * 1024 * 1024) throw new Error(t('img_size'));
  const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type];
  const path = `uploads/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(CFG.bucket).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return sb.storage.from(CFG.bucket).getPublicUrl(path).data.publicUrl;
}

// ---------- editor ----------
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\x00-\x7f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16); };

async function viewEditor(id) {
  const main = shell(id ? 'posts' : 'new');
  let post = { lang: LANG, title: '', slug: '', category: CFG.categories[0].slug, excerpt: '', body: '', image: '', image_alt: '', image_credit: '',
    image_credit_url: '', image_position: '', source_links: [], placeholder: false, status: 'draft', published_at: null };
  if (id) {
    main.innerHTML = `<p class="empty-box">${esc(t('loading'))}</p>`;
    const { data, error } = await sb.from('posts').select('*').eq('id', id).maybeSingle();
    if (error || !data) { main.innerHTML = `<div class="msg err">${esc(error ? error.message : t('no_permission'))}</div>`; return; }
    post = data;
  }
  const canPublish = atLeast('editor');
  const canEdit = canPublish || !id || (post.author_id === S.user.id && post.status === 'draft');
  const cats = CFG.categories.map((c) => `<option value="${esc(c.slug)}"${c.slug === post.category ? ' selected' : ''}>${esc(c[LANG])}</option>`).join('');
  const posSel = (v) => [['', 'pos_center'], ['50% 20%', 'pos_top'], ['50% 80%', 'pos_bottom']].map(([val, k]) => `<option value="${val}"${(v || '') === val ? ' selected' : ''}>${esc(t(k))}</option>`).join('');
  const tb = (k, label) => `<button class="btn" type="button" data-md="${k}">${label}</button>`;
  main.innerHTML = `<div class="page-title"><h1>${esc(t(id ? 'edit_post' : 'new_post'))}</h1>
      <span class="pill ${esc(post.status)}" id="st">${esc(t('status_' + post.status))}</span>
      <button class="btn small" type="button" id="tp">${esc(t('hide_preview'))}</button></div>
    ${canPublish ? '' : `<div class="msg info">${esc(t('writer_note'))}</div>`}
    <div id="m"></div>
    <form id="ed" novalidate><div class="editor-grid" id="grid"><div>
      <div class="cms-panel">
        <div class="grid-2">
          <label class="f"><span>${esc(t('f_lang'))}</span><select name="lang"><option value="he"${post.lang === 'he' ? ' selected' : ''}>עברית</option><option value="en"${post.lang === 'en' ? ' selected' : ''}>English</option></select></label>
          <label class="f"><span>${esc(t('f_category'))}</span><select name="category">${cats}</select></label>
        </div>
        <label class="f"><span>${esc(t('f_title'))}</span><input type="text" name="title" maxlength="300" value="${esc(post.title)}" required></label>
        <label class="f"><span>${esc(t('f_slug'))}</span><input type="text" name="slug" dir="ltr" maxlength="120" value="${esc(post.slug)}" required><small>${esc(t('f_slug_hint'))}</small></label>
        <label class="f"><span>${esc(t('f_excerpt'))}</span><textarea name="excerpt" rows="3" maxlength="1000">${esc(post.excerpt)}</textarea><small>${esc(t('f_excerpt_hint'))}</small></label>
      </div>
      <div class="cms-panel"><h2>${esc(t('f_cover'))}</h2>
        <div class="cover-box"><img class="preview-cover" id="cv" alt="" ${post.image ? `src="${esc(imageUrl(post.image, CFG.assets))}"` : 'hidden'}>
          <div><input type="hidden" name="image" value="${esc(post.image || '')}">
            <div class="toolbar"><label class="btn small primary"><span>${esc(t('upload'))}</span><input type="file" id="cf" accept="image/webp,image/png,image/jpeg" hidden></label>
            <button class="btn small danger" type="button" id="cr"${post.image ? '' : ' hidden'}>${esc(t('remove_img'))}</button></div>
            <label class="f"><span>${esc(t('f_alt'))}</span><input type="text" name="image_alt" value="${esc(post.image_alt || '')}"></label>
            <div class="grid-2"><label class="f"><span>${esc(t('f_credit'))}</span><input type="text" name="image_credit" value="${esc(post.image_credit || '')}"></label>
            <label class="f"><span>${esc(t('f_pos'))}</span><select name="image_position">${posSel(post.image_position)}</select></label></div>
            <label class="f"><span>${esc(t('f_credit_url'))}</span><input type="url" name="image_credit_url" dir="ltr" value="${esc(post.image_credit_url || '')}"></label>
          </div></div></div>
      <div class="cms-panel"><div class="f" style="margin:0"><span>${esc(t('f_body'))}</span>
        <div class="toolbar" id="tb">${tb('h2', esc(t('tb_h2')))}${tb('h3', esc(t('tb_h3')))}${tb('bold', '<b>' + esc(t('tb_bold')) + '</b>')}${tb('list', esc(t('tb_list')))}${tb('quote', esc(t('tb_quote')))}${tb('link', esc(t('tb_link')))}${tb('box', esc(t('tb_box')))}${tb('score', esc(t('tb_score')))}${tb('img', '🖼 ' + esc(t('tb_img')))}</div>
        <textarea class="body-input" name="body" aria-label="${esc(t('f_body'))}" dir="${post.lang === 'he' ? 'rtl' : 'ltr'}">${esc(post.body)}</textarea><small>${esc(t('f_body_hint'))}</small></div></div>
      <div class="cms-panel">
        <label class="f"><span>${esc(t('f_sources'))}</span><textarea name="source_links" rows="3" dir="ltr">${esc((post.source_links || []).join('\n'))}</textarea></label>
        <div class="grid-2"><label class="f"><span>${esc(t('f_date'))}</span><input type="datetime-local" name="published_at" value="${esc(toLocalInput(post.published_at))}"><small>${esc(t('f_date_hint'))}</small></label>
        <label class="check"><input type="checkbox" name="placeholder"${post.placeholder ? ' checked' : ''}> ${esc(t('f_placeholder'))}</label></div>
      </div></div>
      <aside class="preview-col cms-panel" id="pv" aria-label="${esc(t('preview'))}"></aside></div>
    <div class="actionbar">
      ${canEdit && post.status === 'draft' ? `<button class="btn" type="button" data-act="draft">${esc(t('save_draft'))}</button>` : ''}
      ${canPublish ? `<button class="btn primary" type="button" data-act="publish">${esc(t(post.status === 'published' ? 'update' : 'publish'))}</button>` : ''}
      ${canPublish && post.status === 'published' ? `<button class="btn" type="button" data-act="unpublish">${esc(t('unpublish'))}</button>` : ''}
      <span class="spacer"></span><span class="status-line" id="sl">${post.updated_at ? esc(t('updated') + ': ' + fmtDate(post.updated_at)) : ''}</span>
      ${id && canEdit ? `<button class="btn danger" type="button" data-act="delete">${esc(t('del'))}</button>` : ''}
    </div></form>`;
  wireEditor(post, canEdit, canPublish);
}

function wireEditor(post, canEdit, canPublish) {
  const f = $('#ed'); const pv = $('#pv'); const body = f.body;
  let slugTouched = !!post.slug;
  const preview = () => {
    const r = renderMarkdown(body.value, CFG.assets);
    const img = f.image.value ? `<img class="preview-cover" src="${esc(imageUrl(f.image.value, CFG.assets))}" alt="${esc(f.image_alt.value)}"${f.image_position.value ? ` style="object-position:${esc(f.image_position.value)}"` : ''}>` : '';
    pv.innerHTML = `<p class="cms-tag">${esc(t('preview'))} · ${esc(catName(f.category.value, f.lang.value))}</p>
      <div lang="${esc(f.lang.value)}" dir="${f.lang.value === 'he' ? 'rtl' : 'ltr'}"><h1>${esc(f.title.value)}</h1>
      ${f.excerpt.value ? `<p class="cms-muted">${esc(f.excerpt.value)}</p>` : ''}${img}<div class="prose">${r.html}</div></div>`;
  };
  let pt; const schedule = () => { clearTimeout(pt); pt = setTimeout(preview, 150); };
  preview();
  f.addEventListener('input', (e) => {
    S.dirty = true;
    if (e.target.name === 'slug') slugTouched = true;
    if (e.target.name === 'title' && !slugTouched) f.slug.value = slugify(f.title.value) || '';
    if (e.target.name === 'lang') body.dir = f.lang.value === 'he' ? 'rtl' : 'ltr';
    schedule();
  });
  f.addEventListener('change', schedule);
  $('#tp').addEventListener('click', () => { const g = $('#grid'); const off = g.classList.toggle('no-preview'); pv.hidden = off; $('#tp').textContent = t(off ? 'show_preview' : 'hide_preview'); });
  if (!canEdit) f.querySelectorAll('input, select, textarea, #tb button').forEach((x) => (x.disabled = true));

  // cover image
  $('#cf').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return; const lbl = e.target.parentElement.querySelector('span');
    lbl.textContent = t('uploading');
    try {
      const u = await uploadImage(file); f.image.value = u; const cv = $('#cv'); cv.src = u; cv.hidden = false; $('#cr').hidden = false;
      if (!f.image_credit.value) f.image_credit.value = f.lang.value === 'he' ? 'צילום: טכנו-בית' : 'Photo: TechnoBayit';
      S.dirty = true; preview(); f.image_alt.focus();
    } catch (err) { toast(errText(err)); }
    lbl.textContent = t('upload'); e.target.value = '';
  });
  $('#cr').addEventListener('click', () => { f.image.value = ''; $('#cv').hidden = true; $('#cr').hidden = true; S.dirty = true; preview(); });

  // markdown toolbar
  const insert = (before, after = '', placeholder = '') => {
    const { selectionStart: a, selectionEnd: b, value } = body;
    const sel = value.slice(a, b) || placeholder;
    body.setRangeText(before + sel + after, a, b, 'end'); body.focus(); S.dirty = true; schedule();
  };
  const block = (text) => { const a = body.selectionStart; const pre = body.value.slice(0, a); const nl = !pre || pre.endsWith('\n\n') ? '' : pre.endsWith('\n') ? '\n' : '\n\n'; insert(nl + text + '\n\n'); };
  const he = () => f.lang.value === 'he';
  $('#tb').addEventListener('click', async (e) => {
    const k = e.target.closest('[data-md]')?.dataset.md; if (!k) return;
    if (k === 'h2') block('## ' + (he() ? 'כותרת' : 'Heading'));
    if (k === 'h3') block('### ' + (he() ? 'תת-כותרת' : 'Subheading'));
    if (k === 'bold') insert('**', '**', he() ? 'טקסט' : 'text');
    if (k === 'list') block('- \n- \n- ');
    if (k === 'quote') block('> ');
    if (k === 'box') block(':::\n' + (he() ? '**כותרת הקופסה**\n\nטקסט' : '**Box title**\n\nText') + '\n:::');
    if (k === 'score') block(':::score\n## ' + (he() ? 'השורה התחתונה' : 'The bottom line') + '\n\n8/10\n\n' + (he() ? 'סיכום קצר.' : 'Short verdict.') + '\n:::');
    if (k === 'link') {
      const d = await dialog(`<h2>${esc(t('tb_link'))}</h2><label class="f"><span>${esc(t('link_text'))}</span><input type="text" name="lt" value="${esc(body.value.slice(body.selectionStart, body.selectionEnd))}"></label>
        <label class="f"><span>${esc(t('link_url'))}</span><input type="url" name="lu" dir="ltr"></label>
        <div class="dialog-actions"><button class="btn" type="button" data-close="cancel">${esc(t('cancel'))}</button><button class="btn primary" type="button" data-close="ok">${esc(t('insert'))}</button></div>`);
      if (d) { const u = d.querySelector('[name=lu]').value.trim(); const tx = d.querySelector('[name=lt]').value.trim().replace(/[[\]]/g, ''); if (/^https?:\/\/\S+$/.test(u) && tx) insert(`[${tx}](${u})`); }
    }
    if (k === 'img') {
      const d = await dialog(`<h2>${esc(t('body_img_title'))}</h2>
        <label class="f"><span>${esc(t('body_img_file'))}</span><input type="file" name="bf" accept="image/webp,image/png,image/jpeg"></label>
        <label class="f"><span>${esc(t('body_img_alt'))}</span><input type="text" name="ba"></label>
        <label class="f"><span>${esc(t('body_img_caption'))}</span><input type="text" name="bc"></label>
        <div class="dialog-actions"><button class="btn" type="button" data-close="cancel">${esc(t('cancel'))}</button><button class="btn primary" type="button" data-close="ok">${esc(t('insert'))}</button></div>`);
      if (!d) return;
      const file = d.querySelector('[name=bf]').files[0]; const alt = d.querySelector('[name=ba]').value.trim().replace(/[[\]]/g, '');
      const cap = d.querySelector('[name=bc]').value.trim().replace(/"/g, '״');
      if (!file || !alt) { toast(t('alt_needed')); return; }
      toast(t('uploading'));
      try { const u = await uploadImage(file); block(`![${alt}](${u}${cap ? ` "${cap}"` : ''})`); } catch (err) { toast(errText(err)); }
    }
  });

  // save / publish / unpublish / delete
  const collect = (status) => ({
    lang: f.lang.value, title: f.title.value.trim(), slug: f.slug.value.trim(), category: f.category.value,
    excerpt: f.excerpt.value.trim(), body: f.body.value, image: f.image.value || null, image_alt: f.image_alt.value.trim() || null,
    image_credit: f.image_credit.value.trim() || null, image_credit_url: f.image_credit_url.value.trim() || null,
    image_position: f.image_position.value || null, placeholder: f.placeholder.checked,
    source_links: f.source_links.value.split('\n').map((x) => x.trim()).filter((x) => /^https?:\/\/\S+$/.test(x)),
    published_at: f.published_at.value ? new Date(f.published_at.value).toISOString() : null, status,
  });
  const check = (p) => {
    const miss = [];
    if (!p.title) miss.push(t('f_title'));
    if (!/^[a-z0-9-]{1,120}$/.test(p.slug)) miss.push(t('f_slug'));
    if (p.status === 'published' && !p.excerpt) miss.push(t('f_excerpt'));
    if (miss.length) return t('req', { f: miss.join(', ') });
    if (p.image && (!p.image_alt || !p.image_credit)) return t('alt_needed');
    const probs = renderMarkdown(p.body, '').problems;
    if (p.status === 'published' && probs.length) return 'Markdown: ' + probs.join(', ');
    return '';
  };
  f.querySelector('.actionbar').addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
    const m = $('#m');
    if (act === 'delete') { if (await deletePost(post.id, post.title || f.title.value)) location.hash = '#/posts'; return; }
    const status = act === 'publish' ? 'published' : 'draft';
    const p = collect(status);
    const bad = check(p); if (bad) { showMsg(m, bad); m.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const btns = f.querySelectorAll('.actionbar button'); btns.forEach((b) => (b.disabled = true)); $('#sl').textContent = t('saving');
    const q = post.id ? sb.from('posts').update(p).eq('id', post.id) : sb.from('posts').insert(p);
    const { data, error } = await q.select('*');
    btns.forEach((b) => (b.disabled = false));
    if (error || !data?.length) {
      $('#sl').textContent = '';
      const msg = error?.code === '23505' ? t('slug_taken') : error ? t('error', { m: error.message }) : t('no_permission');
      showMsg(m, msg); m.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
    }
    S.dirty = false; showMsg(m, '');
    toast(status === 'published' ? t('published_ok') : act === 'unpublish' ? t('unpublished_ok') : t('saved'), 4500);
    const saved = data[0];
    if (!post.id) { location.hash = '#/edit/' + saved.id; return; }
    if (saved.status !== post.status) { viewEditor(saved.id); return; }
    Object.assign(post, saved); $('#sl').textContent = t('updated') + ': ' + fmtDate(saved.updated_at);
  });
}

// ---------- users (admin) ----------
async function fn(action, body = {}) {
  const { data, error } = await sb.functions.invoke('cms-admin', { body: { action, page: ADMIN_PAGE, ...body } });
  if (error) {
    let detail = null; try { detail = await error.context.json(); } catch { /* ignore */ }
    if (detail?.error === 'already_exists') throw new Error(t('already_exists'));
    throw new Error(detail?.error || error.message);
  }
  return data;
}
const linkBox = (label, link) => `<div class="msg ok">${esc(label)}<div class="linkbox"><input type="text" readonly value="${esc(link)}" aria-label="link"><button class="btn small" type="button" data-copy>${esc(t('copy'))}</button></div></div>`;
function wireCopy(root) { root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.parentElement.querySelector('input').value, b))); }

async function viewUsers() {
  if (!atLeast('admin')) { location.hash = '#/posts'; return; }
  const main = shell('users');
  const roleOpts = (cur, withNone = true) => ['writer', 'editor', 'admin', ...(withNone ? [''] : [])].map((r) => `<option value="${r}"${(cur || '') === r ? ' selected' : ''}>${esc(t(r ? 'role_' + r : 'role_none'))}</option>`).join('');
  main.innerHTML = `<div class="page-title"><h1>${esc(t('users_title'))}</h1></div>
    <div class="cms-panel"><h2>${esc(t('invite_title'))}</h2><p class="hint">${esc(t('roles_help'))}</p>
      <form id="inv" class="grid-3" novalidate>
        <label class="f"><span>${esc(t('email'))}</span><input type="email" name="email" dir="ltr" required></label>
        <label class="f"><span>${esc(t('name'))}</span><input type="text" name="name" maxlength="60"></label>
        <label class="f"><span>${esc(t('role'))}</span><select name="role">${roleOpts('writer', false)}</select></label>
        <div style="grid-column:1/-1"><button class="btn primary" type="submit">${esc(t('invite_btn'))}</button></div>
      </form><div id="im" style="margin-top:1rem"></div></div>
    <div class="cms-panel"><div id="um"></div><table class="users-table"><thead><tr><th>${esc(t('name'))}</th><th>${esc(t('email'))}</th><th>${esc(t('role'))}</th><th>${esc(t('last_login'))}</th><th></th></tr></thead><tbody id="ub"><tr><td colspan="5">${esc(t('loading'))}</td></tr></tbody></table></div>`;
  const load = () => loadUsers(roleOpts, load);
  $('#inv').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const im = $('#im'); const b = f.querySelector('button'); b.disabled = true; showMsg(im, '');
    try {
      const r = await fn('invite', { email: f.email.value.trim(), name: f.name.value.trim(), role: f.role.value });
      im.innerHTML = linkBox(t('invite_done'), r.link); wireCopy(im); f.reset(); load();
    } catch (err) { showMsg(im, errText(err)); }
    b.disabled = false;
  });
  load();
}

async function loadUsers(roleOpts, load) {
  let users;
  try { users = (await fn('list')).users; } catch (e) { showMsg($('#um'), t('error', { m: errText(e) })); return; }
  users.sort((a, b) => (RANK[b.role] || 0) - (RANK[a.role] || 0) || (a.email || '').localeCompare(b.email || ''));
  $('#ub').innerHTML = users.map((u) => `<tr data-id="${esc(u.id)}">
    <td><b>${esc(u.display_name || '—')}</b>${u.is_bot ? ` <span class="pill">${esc(t('bot'))}</span>` : ''}${!u.confirmed ? ` <span class="pill draft">${esc(t('pending'))}</span>` : ''}</td>
    <td dir="ltr" style="text-align:start">${esc(u.email)}</td>
    <td><select data-role aria-label="${esc(t('role'))}"${u.id === S.user.id ? ' disabled' : ''}>${roleOpts(u.role)}</select></td>
    <td>${esc(u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : t('never'))}</td>
    <td><div class="row-actions">${u.is_bot ? '' : `<button class="btn small" type="button" data-reset>${esc(t('reset_link'))}</button>`}
      ${u.id === S.user.id ? '' : `<button class="btn small danger" type="button" data-remove data-email="${esc(u.email)}">${esc(t('remove_user'))}</button>`}</div></td></tr>`).join('');
  $('#ub').querySelectorAll('[data-role]').forEach((s) => s.addEventListener('change', async () => {
    const id = s.closest('tr').dataset.id;
    const { data, error } = await sb.from('profiles').update({ role: s.value || null }).eq('id', id).select('id');
    if (error || !data?.length) { toast(error ? t('error', { m: error.message }) : t('no_permission')); load(); } else toast(t('role_saved'));
  }));
  $('#ub').querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try { const r = await fn('reset_link', { user_id: b.closest('tr').dataset.id }); $('#um').innerHTML = linkBox(t('reset_done'), r.link); wireCopy($('#um')); $('#um').scrollIntoView({ block: 'center' }); }
    catch (e) { toast(t('error', { m: errText(e) })); }
    b.disabled = false;
  }));
  $('#ub').querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmBox(t('confirm_remove'), t('confirm_remove_body', { t: b.dataset.email }), t('remove_user')))) return;
    try { await fn('remove', { user_id: b.closest('tr').dataset.id }); load(); } catch (e) { toast(t('error', { m: errText(e) })); }
  }));
}

// ---------- my account ----------
function viewAccount() {
  const main = shell('account');
  main.innerHTML = `<div class="page-title"><h1>${esc(t('account_title'))}</h1></div>
    <div class="cms-panel" style="max-width:640px"><div id="m1"></div><form id="pf">
      <label class="f"><span>${esc(t('email'))}</span><input type="email" value="${esc(S.user.email)}" disabled dir="ltr"></label>
      <label class="f"><span>${esc(t('display_name'))}</span><input type="text" name="dn" maxlength="60" value="${esc(S.profile.display_name || '')}"></label>
      <button class="btn primary" type="submit">${esc(t('save'))}</button></form></div>
    <div class="cms-panel" style="max-width:640px"><h2>${esc(t('change_pw'))}</h2><div id="m2"></div><form id="cp" novalidate>
      <label class="f"><span>${esc(t('new_password'))}</span><input type="password" name="p1" autocomplete="new-password" dir="ltr"><small>${esc(t('pw_rule'))}</small></label>
      <label class="f"><span>${esc(t('confirm_password'))}</span><input type="password" name="p2" autocomplete="new-password" dir="ltr"></label>
      <button class="btn primary" type="submit">${esc(t('save'))}</button></form></div>`;
  $('#pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await sb.from('profiles').update({ display_name: e.target.dn.value.trim() || null }).eq('id', S.user.id);
    if (error) return showMsg($('#m1'), t('error', { m: error.message }));
    S.profile.display_name = e.target.dn.value.trim(); showMsg($('#m1'), t('profile_saved'), 'ok');
  });
  $('#cp').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const m = $('#m2');
    if (f.p1.value.length < 10) return showMsg(m, t('pw_short'));
    if (f.p1.value !== f.p2.value) return showMsg(m, t('pw_mismatch'));
    const { error } = await sb.auth.updateUser({ password: f.p1.value });
    if (error) return showMsg(m, t('error', { m: error.message }));
    f.reset(); showMsg(m, t('pw_changed'), 'ok');
  });
}

// ---------- routing ----------
let lastHash = location.hash;
window.addEventListener('hashchange', () => {
  if (/access_token|error_description/.test(location.hash)) return;
  if (S.dirty && !confirm(t('unsaved'))) { history.replaceState(null, '', lastHash || '#/posts'); return; }
  S.dirty = false; lastHash = location.hash; render();
});
function render() {
  if (S.recovering) return viewSetPassword(false);
  if (!S.user) return viewLogin();
  if (!role()) return viewNoRole();
  const [page, arg] = location.hash.replace(/^#\/?/, '').split('/');
  lastHash = location.hash;
  if (page === 'new') return viewEditor(null);
  if (page === 'edit' && arg) return viewEditor(arg);
  if (page === 'users') return viewUsers();
  if (page === 'account') return viewAccount();
  if (location.hash !== '#/posts') history.replaceState(null, '', location.pathname + location.search + '#/posts');
  lastHash = '#/posts';
  return viewPosts();
}

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  S.user = session?.user || null;
  if (S.user) {
    const { data } = await sb.from('profiles').select('id, display_name, role').eq('id', S.user.id).maybeSingle();
    S.profile = data || { role: null };
  }
  render();
}

async function start() {
  const th = START_URL.searchParams.get('token_hash');
  const type = START_URL.searchParams.get('type');
  if (th && ['invite', 'recovery', 'magiclink', 'email'].includes(type)) {
    const clean = new URL(location.href); clean.searchParams.delete('token_hash'); clean.searchParams.delete('type'); clean.hash = '';
    history.replaceState(null, '', clean);
    await sb.auth.signOut({ scope: 'local' });
    const { error } = await sb.auth.verifyOtp({ token_hash: th, type });
    if (error) return viewLogin(t('link_invalid'));
    const { data: { session } } = await sb.auth.getSession(); S.user = session?.user || null;
    if (type === 'invite' || type === 'recovery') return viewSetPassword(type === 'invite');
  }
  const errDesc = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (errDesc) { history.replaceState(null, '', location.pathname + location.search); return viewLogin(t('link_invalid')); }
  await boot();
}
start();
