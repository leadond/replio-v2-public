# Replio v2 - Production Deployment Guide

**Version:** 2.0.0 - Complete  
**Status:** Ready for Production  
**Last Updated:** August 29, 2026  

---

## 🚀 Pre-Deployment Checklist

### Environment Validation
- [ ] Python 3.14.4 installed
- [ ] PostgreSQL 18 running
- [ ] OLLAMA running (http://localhost:11434)
- [ ] Virtual environment created and activated
- [ ] All dependencies installed

### Configuration
- [ ] `.env` file created with all variables
- [ ] Database connection string verified
- [ ] SignalWire credentials configured
- [ ] ElevenLabs API key configured
- [ ] OLLAMA base URL configured
- [ ] Frontend URL configured

### Security
- [ ] JWT secret key generated
- [ ] Database backups configured
- [ ] SSL certificates prepared
- [ ] CORS origins configured
- [ ] Rate limiting configured

---

## 📋 Step-by-Step Deployment

### Step 1: Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Database Setup

```bash
# Create .env file with:
DATABASE_URL=postgresql://user:password@localhost:5432/replio_v2
```

```sql
-- Execute migration scripts in order:
-- 001_initial_schema.sql
-- 002_add_settings_table.sql
-- 003_add_audit_logs_table.sql
-- 004_add_phase4_tables.sql
```

**Migration SQL Files Required:**

**004_add_phase4_tables.sql:**
```sql
-- Phase 4 tables

CREATE TABLE IF NOT EXISTS call_recordings (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    recording_url VARCHAR(500),
    duration_seconds INT,
    file_size_mb FLOAT,
    storage_provider VARCHAR(50),
    transcription TEXT,
    transcription_status VARCHAR(20),
    storage_path VARCHAR(500),
    bitrate VARCHAR(50),
    format VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS escalations (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    caller_id VARCHAR(36),
    escalation_reason VARCHAR(255),
    escalation_type VARCHAR(50),
    assigned_to_user_id VARCHAR(36),
    status VARCHAR(20),
    priority VARCHAR(20),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (caller_id) REFERENCES callers(id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    category VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    keywords VARCHAR(500),
    approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id VARCHAR(36),
    approved_at TIMESTAMP,
    usage_count INT DEFAULT 0,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_category (company_id, category),
    INDEX idx_keywords (keywords),
    FULLTEXT idx_content_search (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    ai_response TEXT,
    status VARCHAR(20),
    response_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_from_email (from_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sms_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    message_text TEXT,
    ai_response TEXT,
    status VARCHAR(20),
    response_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_from_number (from_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    session_id VARCHAR(36),
    user_id VARCHAR(36),
    message_text TEXT,
    message_type VARCHAR(20),
    ai_response TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    caller_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    scheduled_time TIMESTAMP,
    duration_minutes INT,
    location VARCHAR(255),
    status VARCHAR(50),
    appointment_type VARCHAR(50),
    assigned_agent_id VARCHAR(36),
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES callers(id),
    INDEX idx_company_time (company_id, scheduled_time),
    INDEX idx_caller (caller_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indexes for optimization
CREATE INDEX idx_recordings_created ON call_recordings(created_at DESC);
CREATE INDEX idx_escalations_user ON escalations(assigned_to_user_id);
CREATE INDEX idx_kb_approved ON knowledge_base(approved);
CREATE INDEX idx_emails_status ON email_messages(status);
CREATE INDEX idx_sms_status ON sms_messages(status);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_appointments_company ON appointments(company_id);
```

### Step 3: Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/replio_v2

# SignalWire
SIGNALWIRE_PROJECT_ID=your_project_id
SIGNALWIRE_API_TOKEN=your_api_token
SIGNALWIRE_SPACE=your_space.signalwire.com
SIGNALWIRE_PHONE_NUMBER=+1234567890

# ElevenLabs
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_AGENT_ID=your_agent_id

# OLLAMA
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# JWT
JWT_SECRET=generate_random_secret_key_here
JWT_ALGORITHM=HS256

# API
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=production
DEBUG=false
```

### Step 4: Start Services

```bash
# Terminal 1: Start Backend
cd replio-v2/replio-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd replio-v2/replio-frontend
npm run dev

# Verify OLLAMA is running
curl http://localhost:11434/api/tags

# Verify Backend is running
curl http://localhost:8000/api/
```

### Step 5: Verify All Services

```bash
# Check backend health
curl http://localhost:8000/health

# Check LLM status
curl http://localhost:8000/health/llm

# Check API documentation
# Navigate to http://localhost:8000/docs

# Verify database connection
# Check logs in backend terminal
```

---

## 🔧 Production Configuration

### Nginx Reverse Proxy Setup

```nginx
upstream replio_backend {
    server localhost:8000;
}

upstream replio_frontend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name replio.yourdomain.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private_key.pem;

    # Backend API
    location /api/ {
        proxy_pass http://replio_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for chat
    location /ws {
        proxy_pass http://replio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://replio_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name replio.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Docker Deployment

**Dockerfile (Backend):**
```dockerfile
FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: replio
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: replio_v2
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    build: ./replio-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://replio:secure_password@postgres:5432/replio_v2
      OLLAMA_BASE_URL: http://ollama:11434
    depends_on:
      - postgres
      - ollama

  frontend:
    build: ./replio-frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8000/api

volumes:
  postgres_data:
  ollama_data:
```

---

## 📊 Monitoring & Logging

### Application Logs

```bash
# View backend logs in real-time
docker logs -f replio-backend

# Save logs to file
docker logs replio-backend > logs/backend.log 2>&1
```

### Health Checks

```bash
# Monitor health endpoint
watch -n 5 'curl -s http://localhost:8000/health | jq'

# Check LLM status
curl http://localhost:8000/health/llm | jq
```

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U replio -h localhost replio_v2 | gzip > backups/replio_v2_$DATE.sql.gz

# Restore from backup
gunzip < backups/replio_v2_YYYYMMDD_HHMMSS.sql.gz | psql -U replio -h localhost replio_v2
```

---

## 🔐 Security Hardening

### Production Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable database encryption
- [ ] Set up API rate limiting
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Configure log rotation
- [ ] Review security headers
- [ ] Set up DDoS protection
- [ ] Enable API key rotation

### Security Headers

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## 🧪 Post-Deployment Testing

### API Testing

```bash
# Test authentication
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@replio.io","password":"TestPass123!","full_name":"Test User"}'

# Test dashboard
curl http://localhost:8000/dashboard/stats?company_id=test-company

# Test knowledge base
curl http://localhost:8000/knowledge-base/search?company_id=test&query=help

# Test multi-channel
curl -X POST http://localhost:8000/emails/receive \
  -H "Content-Type: application/json" \
  -d '{"from_email":"customer@example.com","to_email":"support@replio.io","subject":"Help","body":"I need help"}'
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/

# Using Locust
locust -f locustfile.py --host=http://localhost:8000
```

---

## 📈 Performance Optimization

### Database Tuning

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM conversations WHERE company_id = 'test';

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Caching Strategy

- Cache dashboard stats (5-minute TTL)
- Cache knowledge base articles (1-hour TTL)
- Cache caller history (30-minute TTL)
- Implement Redis for distributed caching

---

## 🚨 Troubleshooting

### Common Issues

**Issue: Database connection refused**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U replio -h localhost -d replio_v2
```

**Issue: OLLAMA not responding**
```bash
# Check OLLAMA is running
curl http://localhost:11434/api/tags

# Restart OLLAMA
docker restart ollama
```

**Issue: SignalWire webhook not working**
- Verify webhook URL is publicly accessible
- Check firewall allows incoming connections
- Verify SignalWire credentials in .env

**Issue: High API latency**
- Check database query performance
- Review logs for slow queries
- Consider adding indexes
- Scale horizontally with load balancer

---

## 📞 Support & Operations

### Monitoring Checklist

- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring (New Relic, DataDog)
- [ ] Set up uptime monitoring
- [ ] Configure alert thresholds
- [ ] Set up log aggregation (ELK, Splunk)
- [ ] Create runbooks for common issues
- [ ] Schedule regular backups
- [ ] Plan disaster recovery

### Maintenance Schedule

- **Daily:** Database backups, log rotation
- **Weekly:** Database optimization, performance review
- **Monthly:** Security audit, dependency updates
- **Quarterly:** Capacity planning, disaster recovery testing

---

## ✅ Deployment Complete

Once all steps are complete and verified:

1. ✅ Database migrated
2. ✅ Environment configured
3. ✅ Services running
4. ✅ Health checks passing
5. ✅ API responding
6. ✅ Frontend loading
7. ✅ Monitoring active
8. ✅ Backups scheduled

**Replio v2 is live and ready for production use!** 🚀

---

**Questions or Issues?**
- Check logs: `docker logs replio-backend`
- Review API docs: http://localhost:8000/docs
- Verify database: `psql -U replio -d replio_v2`
- Test endpoints: Use provided curl commands above
