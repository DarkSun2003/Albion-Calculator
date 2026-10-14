# 🚀 Production Deployment Guide: Vercel + Railway

This guide walks you step-by-step through deploying your full-stack Albion Online Calculator:
- **Frontend (Vite + React)** &rarr; **Vercel** (100% Free Forever Tier)
- **Backend (Django REST API)** &rarr; **Railway** (Free $5 Trial Credit) or **Render.com** (100% Free Web Service Tier)

---

## 📦 Step 1: Push Project to GitHub

Before deploying, initialize your Git repository (we have already created `.gitignore` so your 24MB data dumps and `.venv` won't bloat your push):

```bash
# In the project root (c:\Users\...\Albion calculator)
git init
git add .
git commit -m "feat: production ready albion calculator with full onboarding"
```

Create a new repository on [GitHub](https://github.com/new), and push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/albion-calculator.git
git branch -M main
git push -u origin main
```

---

## 🚂 Step 2: Deploy Backend (Django) on Railway with PostgreSQL

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **"+ New Project"** &rarr; **"Deploy from GitHub repo"**.
3. Select your `albion-calculator` repository.
4. **Add PostgreSQL Database**:
   - In the same project canvas, click **"+ New"** &rarr; **"Database"** &rarr; **"Add PostgreSQL"**.
   - Railway will provision a managed PostgreSQL database and automatically link the `DATABASE_URL` environment variable directly to your Django backend service!
5. Click on your Django service box &rarr; go to **Settings**:
   - **Root Directory**: Set to `/backend` (or leave default `/` as we created both root and backend Procfiles).
   - Under **Networking** &rarr; click **"Generate Domain"** (e.g., `albion-backend-production.up.railway.app`).
6. Go to the **Variables** tab of your Django service and add:
   - `DJANGO_DEBUG` = `False`
   - `SECRET_KEY` = *(generate any random 50-character string)*
7. Railway will automatically build using our `requirements.txt` (including `psycopg2-binary` and `dj-database-url`), run `python manage.py migrate` against PostgreSQL, and start Gunicorn!
8. **Copy your Railway Public Domain URL** (e.g. `https://albion-backend-production.up.railway.app`).

> 💡 *Dual Database Architecture:*
> - **In Local Development:** `DATABASE_URL` is empty, so Django automatically uses local `SQLite3` (`db.sqlite3`).
> - **In Production:** When Railway injects `DATABASE_URL`, Django seamlessly switches to managed `PostgreSQL`!

> 💡 *Note on Railway vs Render:* Railway gives a free $5 credit. If you want a **100% free forever** alternative for the Django backend, you can use **[Render.com](https://render.com/)**:
> - Create a **Free Web Service** pointing to your repo.
> - Root Directory: `backend`
> - Build Command: `pip install -r requirements.txt`
> - Start Command: `gunicorn albion_backend.wsgi:application --bind 0.0.0.0:$PORT`

---

## ⚡ Step 3: Deploy Frontend (React + Vite) on Vercel

1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import your `albion-calculator` repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Vite (detected automatically).
   - **Root Directory**: Click **Edit** and select **`frontend`**! *(Crucial!)*
5. Expand **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://your-railway-app.up.railway.app` *(paste your Railway or Render backend URL from Step 2, without a trailing slash)*
6. Click **"Deploy"**!
7. Vercel will build the frontend in ~45 seconds and give you a free production domain (e.g. `https://albion-artisan.vercel.app`) with free SSL certificates!

---

## ✅ Step 4: Verification Checklist

Once deployed:
1. Open your Vercel URL in your browser.
2. Look at the top right of the calculator cards: you should see **🟢 Django Engine** instead of Client Math.
3. Switch between **Europe**, **Americas**, and **Asia** to ensure live AODP price sync responds.
4. Test the **Guide** button and the **Pre-Craft Planner vs. Post-Craft Ledger** tabs.
