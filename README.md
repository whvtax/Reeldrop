# SnapLoad

הורד סרטונים מ-Instagram ו-TikTok.
בנוי עם Next.js · מוכן לפריסה על Vercel.

---

## פריסה — 3 שלבים בלבד

### 1. קבל RapidAPI Key (חינמי)

1. הירשם ב-https://rapidapi.com
2. חפש: **Social Media Video Downloader**
   - או היכנס ישירות: https://rapidapi.com/social-media-video-downloader-social-media-video-downloader-default/api/social-media-video-downloader
3. לחץ **Subscribe to Test** על ה-Free plan
4. העתק את ה-`X-RapidAPI-Key` שמופיע ב-Code Snippets

---

### 2. העלה ל-GitHub

```bash
cd mediasnap
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/snapload.git
git push -u origin main
```

---

### 3. פרוס על Vercel

1. כנס ל-https://vercel.com → **Add New Project**
2. בחר את ה-repository שהעלית
3. פתח **Environment Variables** והוסף:

```
RAPIDAPI_KEY = [המפתח שהעתקת]
```

4. לחץ **Deploy** ✅

האתר יהיה חי בכמה דקות.

---

## פיתוח מקומי

```bash
# צור קובץ .env.local:
echo "RAPIDAPI_KEY=your_key_here" > .env.local

npm install
npm run dev
# → http://localhost:3000
```

---

## מבנה

```
pages/
  index.js        ← UI
  api/download.js ← Server route → RapidAPI
styles/globals.css
```

---

## הערות

- עובד רק על פרופילים **ציבוריים**
- Free plan של RapidAPI: ~100 בקשות/חודש
- אין שמירת מידע, אין צורך בהתחברות
