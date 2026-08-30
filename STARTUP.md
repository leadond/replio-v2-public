# Replio v2 - Startup Guide

## Quick Start

### Option 1: Start Both Backend and Frontend (Recommended)
**Windows CMD:**
```batch
start-all.bat
```

**PowerShell:**
```powershell
.\start-all.ps1
```

This will open two separate terminal windows:
- Backend on http://localhost:8000
- Frontend on http://localhost:3003 (or next available port)

---

## Individual Startup

### Start Backend Only

**Windows CMD:**
```batch
start-backend.bat
```

**PowerShell:**
```powershell
.\start-backend.ps1
```

**Manual (any terminal):**
```bash
cd replio-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend URL:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

### Start Frontend Only

**Windows CMD:**
```batch
start-frontend.bat
```

**PowerShell:**
```powershell
.\start-frontend.ps1
```

**Manual (any terminal):**
```bash
cd replio-frontend
npm run dev
```

**Frontend URL:** http://localhost:3003 (or next available port)

---

## Prerequisites

### Backend Requirements
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/windows/)
- **Database Setup:**
  ```sql
  CREATE USER replio WITH PASSWORD 'replio';
  CREATE DATABASE replio OWNER replio;
  ```

### Frontend Requirements
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** (included with Node.js)

### Environment Configuration

#### Backend (.env)
Create `replio-backend/.env` with:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://replio:replio@localhost:5432/replio
MOCK_SIGNALWIRE=True
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3003
```

#### SignalWire Setup (Optional for Real Calls)
To use real SignalWire calling, add to `.env`:
```env
MOCK_SIGNALWIRE=False
SIGNALWIRE_PROJECT_ID=your-project-id
SIGNALWIRE_API_TOKEN=your-api-token
SIGNALWIRE_SPACE=your-space.signalwire.com
SIGNALWIRE_PHONE_NUMBER=+1234567890
```

---

## Troubleshooting

### Backend Won't Start
**Error:** "Port 8000 already in use"
- Solution: Change port in the startup script (e.g., `--port 8001`)
- Or: Kill existing process: `netstat -ano | findstr :8000`

**Error:** "PostgreSQL connection refused"
- Solution: Ensure PostgreSQL is running
- Windows: Start PostgreSQL service in Services
- Verify connection: `psql -U replio -d replio -h localhost`

**Error:** "ModuleNotFoundError: No module named 'fastapi'"
- Solution: Install dependencies:
  ```bash
  cd replio-backend
  pip install -r requirements.txt
  ```

### Frontend Won't Start
**Error:** "Port 3003 already in use"
- Solution: Kill existing process or use next port
- Vite will automatically try: 3001, 3002, 3003, 3004, ...

**Error:** "npm: command not found"
- Solution: Install Node.js from https://nodejs.org/

**Error:** "node_modules not found"
- Solution: Install dependencies:
  ```bash
  cd replio-frontend
  npm install
  ```

### Can't Connect Frontend to Backend
**Error:** "Failed to fetch from http://localhost:8000"
- Solution: Ensure backend is running first
- Check CORS settings in `app/main.py`
- Verify backend URL in `frontend/src/api/client.ts`

---

## Demo Login

**Email:** `demo@example.com`
**Password:** `Demo123456`

To create additional test accounts:
```bash
# Frontend: Click "Create an Account" or use API:
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=Test123456"
```

---

## Development Tips

### Hot Reload
- **Backend:** Enabled by default (auto-reload on file changes)
- **Frontend:** Enabled by default (Vite HMR)

### View API Documentation
Navigate to: http://localhost:8000/docs

### Database Reset
```bash
# Reset database (deletes all data)
cd replio-backend
python -c "from app.core.database import engine; from sqlmodel import SQLModel; SQLModel.metadata.drop_all(engine); SQLModel.metadata.create_all(engine)"
```

### View Database
```bash
psql -U replio -d replio -h localhost
```

---

## Stopping the Servers

**Windows CMD:** Close the terminal windows
**PowerShell:** Press `Ctrl+C` or close the windows
**Manual:** Press `Ctrl+C` in each terminal

---

## Production Deployment

For production, use:
```bash
# Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
npm run build
npm run preview
```

See deployment documentation for Docker, Kubernetes, or cloud platform setup.
