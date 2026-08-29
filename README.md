# Replio v2

AI Auto-Attendant Platform - migrated from Base44 to self-hosted FastAPI + React.

## Backend
FastAPI + SQLModel + PostgreSQL + JWT auth + SignalWire + ElevenLabs webhooks

## Frontend
React 18 + Vite + Dark Mode admin dashboard

## Quick Start (thebeast)

```bash
# 1. Clone
git clone https://github.com/leadond/replio-v2-public.git
cd replio-v2-public

# 2. Backend
cd replio-backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your credentials
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd ../replio-frontend
npm install
npm run dev
```

Open http://localhost:5173
