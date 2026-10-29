# מדריך ה-CMS של טכנו-בית / TechnoBayit CMS guide

כתובת המערכת: **https://knigstone-max.github.io/techsite/admin/**

## עברית

### כניסה
- נכנסים עם אימייל וסיסמה. שכחת סיסמה? "שכחתי סיסמה" שולח קישור לאיפוס.
- משתמש חדש מקבל הזמנה (באימייל או כקישור שהאדמין מעתיק ושולח), פותח אותה ובוחר סיסמה בעצמו.
- כפתור ה-EN / עב בפינה מחליף את שפת הממשק.

### כתבות
- **כתבות:** רשימה עם חיפוש וסינון לפי שפה, סטטוס וקטגוריה.
- **כתבה חדשה:** שפה, קטגוריה, כותרת, כתובת (slug, נוצרת אוטומטית מהכותרת באנגלית; בעברית כותבים אותה ידנית באותיות לטיניות), תקציר, תמונה ראשית (העלאה, טקסט חלופי וקרדיט חובה), גוף הכתבה ותאריך.
- **סרגל העיצוב:** כותרות, הדגשה, רשימה, ציטוט, קישור, קופסת מידע, קופסת ציון (`:::score`) ותמונה בתוך הכתבה (עם טקסט חלופי וכיתוב).
- **תצוגה מקדימה** מתעדכנת בזמן הקלדה, באותו עיצוב כמו באתר.
- **שמירה כטיוטה / פרסום / עדכון / הסרת פרסום / מחיקה** (עם אישור).
- האתר נבנה מחדש אוטומטית כל 30 דקות, כך ששינוי מופיע באתר תוך חצי שעה לכל היותר. לפרסום מיידי: GitHub → Actions → Deploy → Run workflow.

### תפקידים
| תפקיד | מה מותר |
|---|---|
| כותב/ת | ליצור טיוטות ולערוך את הטיוטות של עצמו/ה |
| עורך/ת | לערוך, לפרסם, להסיר ולמחוק כל כתבה |
| אדמין | כל מה שעורך/ת + הזמנת משתמשים, שינוי תפקידים, הסרת משתמשים |

### משתמשים (אדמין)
- **הזמנה:** אימייל, שם ותפקיד → מתקבל קישור הזמנה להעתקה ושליחה (שליחת אימיילים של Supabase בחינם מוגבלת, לכן הקישור מוצג גם במסך).
- **קישור איפוס סיסמה** למשתמש שנתקע, **שינוי תפקיד** מהרשימה, **הסרת משתמש** (אי אפשר להסיר את עצמך או את האדמין האחרון).

### הערות
- כתבה שנמצאת ב-CMS נלקחת רק מה-CMS. עריכת קובץ ה-md שלה ב-`content/` (או ב-Pages CMS) לא תשפיע עליה.
- כתבות מוכנות ב-Markdown נכנסות למערכת עם `python3 scripts/upsert_post.py content/he/<slug>.md content/en/<slug>.md`.
- הכול על תוכניות חינמיות: Supabase Free, GitHub Pages, GitHub Actions.

## English

- **Login:** email and password, "forgot password" sends a reset link. New users get an invite link and choose their own password.
- **Posts:** list with search and filters; editor with all fields, a formatting toolbar (headings, bold, lists, quote, link, info box, `:::score` box, inline image with alt and caption), live preview in the site's style, cover upload with required alt and credit, and draft / publish / update / unpublish / delete with confirmation.
- **Roles:** writer (own drafts) < editor (edit, publish, delete anything) < admin (also invites, role changes, removing users).
- **Users (admin):** invite by email + role (copyable invite link), password-reset links, role changes, removal (not yourself or the last admin).
- **Going live:** the site rebuilds every 30 minutes (or run Actions → Deploy manually). Unpublished or deleted posts disappear on the next build.
- **Markdown import:** `python3 scripts/upsert_post.py content/he/<slug>.md content/en/<slug>.md` (credentials in `~/.techsite-supabase-env`, never in the repo). Posts registered in the CMS ignore later edits to their .md files.
- **Security:** Row Level Security on every table; the browser only has the publishable key; the service key exists only inside the `cms-admin` Edge Function.
