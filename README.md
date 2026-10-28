# TechnoBayit / טכנו-בית

Bilingual (Hebrew + English) static site about tech, gadgets and home appliances. Free hosting, no paid services, no build dependencies beyond Python 3.

[עברית](#עברית) · [English](#english)

---

<div dir="rtl">

## עברית

### מבנה

```
techsite/
├── build.py                 # מחולל האתר (Python 3, ספרייה סטנדרטית בלבד)
├── site.json                # שם האתר, כתובת, קטגוריות, טקסטים לממשק, עמוד אודות
├── content/
│   ├── he/*.md              # פוסטים בעברית
│   └── en/*.md              # פוסטים באנגלית
├── static/                  # מועתק ל-dist/assets/
│   ├── style.css            # עיצוב (RTL/LTR עם logical properties, מצב בהיר/כהה)
│   ├── main.js              # מתג מצב תצוגה, תפריט מובייל
│   ├── config.js            # מפתחות Supabase ציבוריים (ריק = חשבונות כבויים)
│   ├── auth.js              # התחברות, מועדפים, תגובות
│   ├── img/posts/           # תמונות הפוסטים (WebP, נשמרות במאגר)
│   ├── img/categories/      # תמונות הקטגוריות (WebP 600px, קרדיט ב-site.json ובעמוד אודות)
│   └── favicon.svg
├── supabase/schema.sql      # טבלאות + Row Level Security
├── scripts/check_links.py   # בדיקת קישורים פנימיים
├── .github/workflows/pages.yml
└── dist/                    # פלט הבנייה (לא נשמר ב-git)
```

עברית היא שפת ברירת המחדל בכתובת `/`, אנגלית ב-`/en/`. בכל עמוד יש קישור לעמוד המקביל בשפה השנייה.

עמודים בכל שפה: דף בית, אינדקס קטגוריות (`categories/`), 5 קטגוריות (`category/<slug>/`), ארכיון, אודות, התחברות, חשבון, ניהול (`admin/`), כתיבה ועריכה (`dashboard/`), ופוסט לכל קובץ תוכן (`posts/<slug>/`). בנוסף: `404.html`, `sitemap.xml`, `robots.txt`, `feed.xml`, `en/feed.xml`.

### ניהול תוכן (CMS)

עריכה, הוספה ומחיקה של כתבות, והזמנת כותבים, דרך Pages CMS (חינם): https://app.pagescms.org. ההגדרות ב-`.pages.yml`, המדריך המלא ב-[docs/CMS-GUIDE.md](docs/CMS-GUIDE.md). כתבות שנכתבות ידנית: להריץ `python3 scripts/normalize_frontmatter.py` לפני commit כדי שה-CMS יוכל לפתוח אותן.

### הוספת פוסט

צרו קובץ `content/he/<slug>.md` (ובאותו slug גם `content/en/<slug>.md` אם יש תרגום. ה-slug המשותף הוא מה שמחבר בין השפות):

```
---
title: כותרת הפוסט
date: 2026-10-19
slug: example-post
category: smartphones-gadgets
excerpt: משפט או שניים שמסכמים את הפוסט.
source_links:
  - https://example.com/source-1
  - https://example.com/source-2
---
גוף הפוסט ב-Markdown פשוט: פסקאות, ## כותרות, רשימות, **מודגש**, *נטוי*, [קישור](https://...), > ציטוט.
```

קטגוריות: `smartphones-gadgets`, `home-appliances`, `tech-news`, `reviews`, `tips`.
שדות אופציונליים: `draft: true` (לא יפורסם), `placeholder: true` (תווית "פוסט לדוגמה").
ה-slug באותיות לטיניות קטנות, ספרות ומקפים בלבד.

### תמונות לפוסטים

שדות אופציונליים, זהים בגרסה העברית ובאנגלית של אותו פוסט (רק הטקסטים מתורגמים):

```
image: img/posts/xbox-series-x.webp      # קובץ מקומי תחת static/
image_alt: "קונסולת Xbox Series X שחורה עומדת על מדף עץ"
image_credit: "צילום: Ian Hughes, רישיון CC BY 2.0, דרך Wikimedia Commons (חתוך)"
image_credit_url: https://commons.wikimedia.org/wiki/File:Xbox_series_X_(50648118708).jpg
```

כשיש תמונה היא מופיעה בסיפור המרכזי, בכרטיסים (בית, קטגוריה), בראש הפוסט עם שורת קרדיט, וב-`og:image` / `twitter:image`. בלי תמונה נשאר הרקע הצבעוני של הקטגוריה. `image_alt` ו-`image_credit` חובה כש-`image` מוגדר, והבנייה נכשלת אם הקובץ חסר או אם `image` הוא כתובת URL.

כללי מקור (לפי סדר עדיפות):
1. תמונה רשמית של היצרן: חדר עיתונות, הודעה לעיתונות, דף המוצר הרשמי, או ה-og:image של דף היצרן עצמו. קרדיט: "תמונה: <יצרן>" עם קישור לדף.
2. תמונה ברישיון חופשי מ-Wikimedia Commons / Unsplash / Pexels שבאמת מראה את הנושא. קרדיט: צלם, רישיון, מקור, ו-"(חתוך)" אם נחתכה.
3. אחרת, בלי תמונה. לא משתמשים בתמונות מאתרי חדשות (The Verge, Gizmochina וכו'), לא מקשרים לתמונות חיצוניות, ולא ממציאים קרדיט.

עיבוד: רוחב עד כ-1200 פיקסלים, WebP, פחות מ-200KB, יחס 16:9 בערך (התמונה נחתכת עם `object-fit: cover`). שם הקובץ באותיות לטיניות קטנות ומקפים.

### תמונות הקטגוריות

כל קטגוריה ב-`site.json` מקבלת `image` (קובץ תחת `static/`), `image_credit`, `image_credit_url`, `desc` ו-`alt` בשתי השפות. התמונות מופיעות בפס הקטגוריות בדף הבית, בתפריט "קטגוריות", בפס הקטגוריות שמתחת לכותרת, בעמוד `categories/` ובראש עמוד כל קטגוריה. הקרדיטים מופיעים בעמוד אודות ובמאפיין title של התמונה. אותו כלל מקור כמו לתמונות פוסטים: רישיון חופשי או איור מקורי, WebP בגודל 600 פיקסלים בערך, בלי קישור חיצוני לתמונה.

### בנייה מקומית

```
python3 build.py
python3 scripts/check_links.py
python3 -m http.server 8000 -d dist     # http://localhost:8000
```

### פריסה חינמית ב-GitHub Pages (username.github.io/repo)

1. צרו מאגר ציבורי ב-GitHub ודחפו אליו את הקוד לענף `main`.
2. Settings ← Pages ← Source: **GitHub Actions**.
3. ה-workflow `pages.yml` בונה ומפרסם בכל push, וגם פעם ביום. הוא מגדיר לבד את `SITE_URL` ו-`BASE_PATH` (למשל `/repo/`).
4. עדכנו את `site_url` ב-`site.json` לכתובת האמיתית (משמש לבנייה מקומית).

### חלופה: Cloudflare Pages (*.pages.dev)

חברו את המאגר ב-Cloudflare Pages והגדירו:

| הגדרה | ערך |
|---|---|
| Framework preset | None |
| Build command | `python3 build.py` |
| Build output directory | `dist` |
| Environment variable | `SITE_URL=https://<project>.pages.dev` |
| Environment variable | `BASE_PATH=/` |

### חשבונות משתמש (חינם, Supabase)

בלי מפתחות ב-`static/config.js` האתר עובד כרגיל: עמודי ההתחברות והחשבון מציגים "בקרוב", כפתור המועדפים מוסתר, ובאזור התגובות מופיעה הודעה קצרה.

הפעלה:
1. פתחו פרויקט בחינם ב-[supabase.com](https://supabase.com) (Free plan).
2. SQL Editor ← הדביקו והריצו את `supabase/schema.sql`.
3. Authentication ← Providers ← Email: השאירו פעיל (קישור קסם וסיסמה).
4. Authentication ← URL Configuration:
   - Site URL: `https://username.github.io/repo/`
   - Redirect URLs: `https://username.github.io/repo/account/`, `https://username.github.io/repo/en/account/` (ואם צריך גם `http://localhost:8000/**` לבדיקות).
5. Project Settings ← API: העתיקו את Project URL ואת מפתח ה-`anon` (public) ל-`static/config.js`, או הגדירו אותם כ-Variables במאגר (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) וה-workflow יכתוב אותם בזמן הבנייה.
6. **לעולם אל תשימו את מפתח ה-`service_role` באתר או במאגר.** מפתח ה-anon ציבורי מטבעו; ההגנה על הנתונים היא ה-RLS.

הרשאות (RLS): תגובות גלויות לכולם, וכל משתמש יכול להוסיף ולמחוק רק את התגובות שלו (עורכים ואדמינים יכולים למחוק כל תגובה). מועדפים גלויים רק לבעלים. בפרופיל נשמרים שם תצוגה ותפקיד, בלי אימייל.

### תפקידים, ניהול משתמשים ותור כתיבה

תפקידים: `reader` (קורא/ת, ברירת מחדל) < `writer` (כתב/ת) < `editor` (עורך/ת) < `admin` (אדמין).

- `/admin/` (אדמין בלבד): רשימת משתמשים עם חיפוש לפי אימייל או שם, ותפריט לשינוי תפקיד. האימיילים נשארים ב-`auth.users` ומגיעים רק דרך הפונקציה `admin_list_users`, שבודקת שהקורא הוא אדמין.
- `/dashboard/` (כתב/ת ומעלה): כתיבת טיוטות בעברית ובאנגלית, שמירה כטיוטה או שליחה לאישור, ועריכה של טיוטות שעוד לא אושרו. עורכים ואדמינים רואים גם תור לבדיקה עם אישור ודחייה והערה לכתב/ת.
- טיוטות שאושרו (`status = 'approved'`) הן תור לפרסום: העדכון היומי הופך אותן לקובצי markdown ב-`content/he` וב-`content/en`. הן לא מתפרסמות באתר אוטומטית.
- קישורי "ניהול" ו"כתיבה" בכותרת מופיעים רק למי שיש לו את התפקיד. ההגנה האמיתית היא במסד הנתונים: RLS, טריגר שחוסם שינוי תפקיד על ידי מי שאינו אדמין (וגם אדמין לא יכול לשנות את התפקיד של עצמו), וטריגר שמונע מכתבים לאשר טיוטות של עצמם.
- עד שמחברים את Supabase, שני הדפים מציגים "יופעל ברגע שמסד נתוני המשתמשים יחובר". הם לא נכנסים ל-sitemap ומסומנים noindex.

הפעלה (בנוסף לשלבים למעלה):
1. הריצו שוב את `supabase/schema.sql` כולו ב-SQL Editor. הקובץ בטוח להרצה חוזרת ומוסיף את עמודת התפקיד, הפונקציות `has_role` / `is_admin`, הטבלה `submissions` והמדיניות.
2. הירשמו באתר עם האימייל שלכם, ואז הריצו ב-SQL Editor (עם האימייל שלכם):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. במאגר ב-GitHub: Settings ← Secrets and variables ← Actions ← לשונית Variables ← New repository variable. הוסיפו `SUPABASE_URL` (ה-Project URL) ו-`SUPABASE_ANON_KEY` (מפתח ה-anon הציבורי). אחר כך Actions ← Deploy to GitHub Pages ← Run workflow. משתנים ולא Secrets, כי המפתחות האלה ציבוריים ממילא ונכנסים לקובץ `config.js` באתר.
4. מעכשיו האדמין נותן תפקידים מ-`/admin/`.

שימו לב: שליחת המיילים המובנית של Supabase בתוכנית החינמית מוגבלת בכמות לשעה. לשימוש רחב יותר אפשר לחבר SMTP חינמי (למשל Brevo או Resend בתוכנית החינמית).

חלופה: **Firebase** בתוכנית Spark החינמית (Authentication עם קישור באימייל + Firestore עם Security Rules). זה ידרוש לכתוב מחדש את `auth.js` ואת הכללים במקום `schema.sql`.

### כללי כתיבה

משפטים קצרים וקונקרטיים. בלי מילים כמו "מכונן" או "פורץ דרך", בלי "לא רק X אלא גם Y", בלי רשימות "נקודות עיקריות". כל פוסט מציין מקורות. שמועה מסומנת כשמועה.

</div>

---

## English

### Structure

See the tree above. Hebrew is the default language at `/`, English lives at `/en/`. Every page links to its counterpart in the other language and declares `hreflang` alternates.

Per language: home, a categories index (`categories/`), 5 category pages (`category/<slug>/`), archive, about (with image credits), login, account, admin (`admin/`), write & review (`dashboard/`), and one page per post (`posts/<slug>/`). Plus `404.html`, `sitemap.xml`, `robots.txt`, `feed.xml`, `en/feed.xml`.

**Output directory: `dist/`** (git-ignored, built in CI).

### Add a post

Create `content/en/<slug>.md` (and `content/he/<slug>.md` with the same slug for the Hebrew version; the shared slug links the two):

```
---
title: Post title
date: 2026-10-19
slug: example-post
category: home-appliances
excerpt: One or two sentences that sum up the post.
source_links:
  - https://example.com/source-1
---
Body in simple Markdown: paragraphs, ## headings, lists, **bold**, *italic*, [links](https://...), > quotes.
```

Categories: `smartphones-gadgets`, `home-appliances`, `tech-news`, `reviews`, `tips`.
Optional fields: `draft: true` (skipped), `placeholder: true` (shows a "Sample post" badge).
The build fails with a clear error on missing fields, unknown categories or duplicate slugs.

### Post images

Optional fields. The he and en versions of a post use the same file; only the text is translated.

```
image: img/posts/xbox-series-x.webp      # local file under static/
image_alt: "A black Xbox Series X console standing on a wooden shelf"
image_credit: "Photo: Ian Hughes, CC BY 2.0, via Wikimedia Commons (cropped)"
image_credit_url: https://commons.wikimedia.org/wiki/File:Xbox_series_X_(50648118708).jpg
```

When set, the image appears on the top story, on cards (home, category), at the top of the post with a credit line, and as `og:image` / `twitter:image`. Without it the category gradient placeholder stays. `image_alt` and `image_credit` are required when `image` is set; the build fails if the file is missing or if `image` is a URL.

Sourcing rule, in order:
1. The manufacturer's official image: newsroom, press release, official product page, or the og:image of the manufacturer's own page. Credit: "Image: <maker>" linking to that page.
2. A freely licensed image from Wikimedia Commons / Unsplash / Pexels that really shows the subject. Credit: author, license, source, plus "(cropped)" if cropped.
3. Otherwise no image. Never use pictures from news sites (The Verge, Gizmochina, etc.), never hotlink, never invent a credit.

Processing: up to ~1200px wide, WebP, under 200KB, roughly 16:9 (displayed with `object-fit: cover`). Lowercase latin file names with hyphens.

### Category images

Each category in `site.json` has `image` (a file under `static/`), `image_credit`, `image_credit_url`, plus `desc` and `alt` in both languages. They show in the homepage category strip, the "Categories" mega-menu, the one-tap category bar under the header, the `categories/` index and the top of each category page. Credits are listed on the about page and in each image's title attribute. Same sourcing rule as post images: freely licensed or original artwork, ~600px WebP, never hotlinked.

### Build locally

```
python3 build.py                         # writes dist/
python3 scripts/check_links.py           # internal link + hreflang check
python3 -m http.server 8000 -d dist      # http://localhost:8000
```

`SITE_URL` and `BASE_PATH` env vars override `site.json` (for example `BASE_PATH=/repo/` to test a GitHub project-pages build; then run `python3 scripts/check_links.py dist /repo/`).

### Deploy free on GitHub Pages (username.github.io/repo)

1. Create a public GitHub repo and push to `main`.
2. Settings -> Pages -> Source: **GitHub Actions**.
3. `.github/workflows/pages.yml` builds, link-checks and deploys on every push and once a day. It sets `SITE_URL` and `BASE_PATH` automatically.
4. Update `site_url` in `site.json` for local builds.

### Alternative: Cloudflare Pages (*.pages.dev)

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `python3 build.py` |
| Build output directory | `dist` |
| Env var | `SITE_URL=https://<project>.pages.dev` |
| Env var | `BASE_PATH=/` |

### User accounts (free, Supabase)

With empty keys in `static/config.js`, the site works as a plain static site: login/account pages say "coming soon", the favorites button is hidden and the comments area shows a short notice. supabase-js is only loaded from the jsDelivr CDN when keys are set.

To turn accounts on:
1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor: paste and run `supabase/schema.sql`.
3. Authentication -> Providers -> Email: keep enabled (magic link + password).
4. Authentication -> URL Configuration:
   - Site URL: `https://username.github.io/repo/`
   - Redirect URLs: `https://username.github.io/repo/account/` and `https://username.github.io/repo/en/account/` (add `http://localhost:8000/**` for local testing, or your `*.pages.dev` URLs on Cloudflare).
5. Project Settings -> API: copy the Project URL and the `anon` public key into `static/config.js`, or set repo Actions Variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` and the workflow writes `config.js` at build time.
6. **Never commit or ship the `service_role` key.** The anon key is meant to be public; Row Level Security protects the data.

RLS summary: comments are readable by everyone, users can insert and delete only their own (editors and admins can delete any comment). Favorites are visible only to their owner. Profiles store a display name and a role, no email.

### Roles, user management and the writing queue

Roles: `reader` (default) < `writer` < `editor` < `admin`.

- `/admin/` (admins only): user list with search by email or name and a role dropdown per user. Emails stay in `auth.users` and are only returned by the `admin_list_users` function, which checks that the caller is an admin.
- `/dashboard/` (writers and up): write Hebrew and English drafts, save as draft or submit for review, and edit drafts that aren't approved yet. Editors and admins also get a review queue with approve, reject and a note to the writer.
- Approved submissions (`status = 'approved'`) are a publishing queue: the daily update turns them into markdown files in `content/he` and `content/en`. Nothing is published to the site automatically.
- The header shortcuts to these pages only show for the matching roles. The real protection is in the database: RLS, a trigger that blocks role changes by non-admins (and stops admins from changing their own role), and a trigger that stops writers from approving their own drafts.
- Until Supabase is connected, both pages say "This will be activated once the user database is connected". They are noindex and left out of the sitemap.

Setup (on top of the steps above):
1. Run the whole `supabase/schema.sql` again in the SQL Editor. It is safe to re-run and adds the role column, the `has_role` / `is_admin` helpers, the `submissions` table and the policies.
2. Sign up on the site with your email, then run in the SQL Editor (with your email):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. On GitHub: repo Settings -> Secrets and variables -> Actions -> Variables tab -> New repository variable. Add `SUPABASE_URL` (Project URL) and `SUPABASE_ANON_KEY` (the public anon key), then Actions -> Deploy to GitHub Pages -> Run workflow. Use Variables, not Secrets: these values are public anyway and end up in the site's `config.js`.
4. From then on, the admin assigns roles at `/admin/`.

Note: Supabase's built-in email sending on the free plan is rate-limited. For more volume, plug in a free SMTP tier (for example Brevo or Resend).

Alternative: **Firebase** on the free Spark plan (Email link auth + Firestore with Security Rules). That means rewriting `auth.js` and replacing `schema.sql` with Firestore rules.

### Writing rules

Short, concrete sentences. No filler words ("pivotal", "delve", "testament", "landscape"), no "not only X but also Y", no em-dash chains, no "Key Takeaways" lists. Every post lists sources. Rumors are labeled as rumors.
