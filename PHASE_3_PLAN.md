# Replio v2 - Phase 3 Implementation Plan

**Status:** Planning stage  
**Priority:** Enhancement & Optimization  
**Estimated Effort:** 3-4 days  

---

## 🎯 Phase 3 Objectives

### 1️⃣ OLLAMA Integration (Critical)

**Purpose:** Local LLM processing for:
- Conversation summarization
- Sentiment analysis
- Intent detection
- Fallback AI when OpenAI unavailable

**Components to Create:**
- `app/services/ollama_service.py` (300+ lines)
  - `summarize_conversation(text, max_length)`
  - `analyze_sentiment(text)` → score: 0-1
  - `detect_intent(text)` → intent string
  - `generate_response(prompt, context)` → response text

- `app/routers/ollama.py` (4 endpoints)
  - `POST /ollama/chat` - Send prompt
  - `POST /ollama/summarize` - Summarize text
  - `POST /ollama/analyze-sentiment` - Sentiment analysis
  - `GET /ollama/status` - Health check

**Integration Points:**
- Call after ElevenLabs conversation ends
- Use for conversation summary generation
- Augment sentiment scores
- Detect customer intent for routing

**OLLAMA Configuration:**
```
Base URL: http://localhost:11434
Model: llama3.2:3b
Max tokens: 512
Temperature: 0.3
```

---

### 2️⃣ Enhanced Analytics (Important)

**Real-time Metrics:**
- [ ] Call success rate calculation
  - Completed vs. abandoned calls
  - Resolution indicators
  
- [ ] Agent performance metrics
  - Average handling time
  - Customer satisfaction proxy
  - Issue resolution rate
  
- [ ] Caller insights
  - Most common call reasons
  - Repeat caller analysis
  - Customer lifetime value
  
- [ ] Peak usage patterns
  - Busiest hours/days
  - Seasonal trends
  - Capacity planning data

**New Endpoints:**
```
GET /analytics/calls/success-rate?company_id=X&period=daily|weekly|monthly
GET /analytics/agent/performance?company_id=X
GET /analytics/callers/insights?company_id=X
GET /analytics/usage/patterns?company_id=X
```

**Database Queries:**
- Aggregate call counts
- Calculate success rates
- Time-based grouping
- Trend calculation

---

### 3️⃣ Audit Logging (Important)

**Purpose:** Compliance, security, debugging

**Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    company_id VARCHAR(36),
    action VARCHAR(50),           -- create, read, update, delete, login, etc
    resource_type VARCHAR(50),    -- conversation, caller, setting, etc
    resource_id VARCHAR(36),
    changes TEXT,                 -- JSON diff of changes
    status VARCHAR(20),           -- success, failure
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_timestamp (company_id, timestamp),
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**AuditService Methods:**
```python
log_action(session, user_id, company_id, action, resource_type, resource_id, changes, status)
get_audit_trail(session, company_id, start_date, end_date, resource_type)
get_user_activities(session, user_id, limit=100)
export_audit_report(session, company_id, date_range)
```

**Audit Events to Log:**
- User login/logout
- Conversation creation/deletion
- Caller blocking
- Settings changes
- API key access
- Data exports

**Audit Endpoints:**
```
GET /audit/trail?company_id=X&start_date=X&end_date=X
GET /audit/user-activities?user_id=X
GET /audit/export?company_id=X&format=json|csv
```

---

### 4️⃣ Advanced Database Schema

**New Tables:**

**call_recordings**
```sql
CREATE TABLE call_recordings (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL UNIQUE,
    recording_url VARCHAR(500),
    duration_seconds INT,
    file_size_mb INT,
    storage_provider VARCHAR(50),  -- s3, gcs, etc
    transcription TEXT,
    transcription_status VARCHAR(20),  -- pending, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
) ENGINE=InnoDB;
```

**agent_events**
```sql
CREATE TABLE agent_events (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    agent_id VARCHAR(36),
    event_type VARCHAR(50),    -- message, tool_call, transfer, error
    event_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_conversation_timestamp (conversation_id, timestamp)
) ENGINE=InnoDB;
```

**analytics_snapshots**
```sql
CREATE TABLE analytics_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36),
    snapshot_date DATE,
    metric_type VARCHAR(50),   -- daily_stats, weekly_trends, etc
    metrics JSON,              -- {total_calls, avg_duration, success_rate, ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_date_type (company_id, snapshot_date, metric_type),
    INDEX idx_company_date (company_id, snapshot_date)
) ENGINE=InnoDB;
```

---

### 5️⃣ Performance Optimization

**Database Indexing Strategy:**
```sql
-- Conversations table
ALTER TABLE conversations ADD INDEX idx_company_created (company_id, created_at DESC);
ALTER TABLE conversations ADD INDEX idx_caller_date (caller_id, created_at DESC);
ALTER TABLE conversations ADD INDEX idx_status_company (status, company_id);

-- Callers table
ALTER TABLE callers ADD INDEX idx_company_phone (company_id, phone_number);
ALTER TABLE callers ADD INDEX idx_company_name (company_id, name);

-- Messages table
ALTER TABLE messages ADD INDEX idx_conversation_order (conversation_id, created_at);

-- Settings table
ALTER TABLE settings ADD INDEX idx_company_key (company_id, key);

-- Audit logs
ALTER TABLE audit_logs ADD INDEX idx_company_action (company_id, action);
ALTER TABLE audit_logs ADD INDEX idx_user_date (user_id, timestamp DESC);
```

**Query Optimization:**
- Add result caching for dashboard queries
- Implement pagination for large result sets
- Use database query profiling
- Monitor slow query log

**Caching Strategy:**
- Cache dashboard stats (5-minute TTL)
- Cache caller history (1-hour TTL)
- Cache settings per company (session TTL)
- Cache analytics snapshots (24-hour TTL)

---

## 📋 Implementation Checklist

### OLLAMA Integration
- [ ] Create `app/services/ollama_service.py`
  - [ ] `summarize_conversation()` method
  - [ ] `analyze_sentiment()` method
  - [ ] `detect_intent()` method
  - [ ] Error handling and fallbacks
- [ ] Create `app/routers/ollama.py`
  - [ ] POST /ollama/chat
  - [ ] POST /ollama/summarize
  - [ ] POST /ollama/analyze-sentiment
  - [ ] GET /ollama/status
- [ ] Integration tests
- [ ] Performance benchmarks

### Audit Logging
- [ ] Create `app/models/audit_log.py`
- [ ] Create `app/services/audit_service.py`
- [ ] Create `app/routers/audit.py`
- [ ] Add audit middleware
- [ ] Audit all critical operations
- [ ] Test audit trail retrieval

### Enhanced Analytics
- [ ] Create advanced analytics queries
- [ ] Add new analytics endpoints
- [ ] Implement metrics calculation
- [ ] Create analytics snapshots
- [ ] Build trend analysis

### Database Schema
- [ ] Create migration scripts for all new tables
- [ ] Add proper indexes
- [ ] Set up foreign key relationships
- [ ] Test referential integrity

### Performance
- [ ] Add database indexes
- [ ] Implement query caching
- [ ] Profile slow queries
- [ ] Optimize N+1 queries

---

## 🧪 Testing Strategy

**Unit Tests:**
- [ ] OLLAMA service methods
- [ ] Audit service operations
- [ ] Analytics calculations
- [ ] Settings service edge cases

**Integration Tests:**
- [ ] End-to-end call flow with OLLAMA
- [ ] Audit trail logging
- [ ] Analytics aggregation
- [ ] Database migrations

**Performance Tests:**
- [ ] Dashboard query performance
- [ ] Analytics snapshot generation
- [ ] Audit log retrieval performance
- [ ] OLLAMA response time

**Security Tests:**
- [ ] Audit log access control
- [ ] Sensitive data in logs
- [ ] SQL injection in analytics queries
- [ ] XSS in audit displays

---

## 📊 Success Criteria

| Component | Target | Acceptance |
|-----------|--------|-----------|
| OLLAMA | <500ms latency | Response in reasonable time |
| Audit Logs | 100% coverage | All critical actions logged |
| Analytics | <1s query time | Dashboard loads quickly |
| Database | Optimized | <100ms for most queries |
| Testing | 80%+ coverage | Critical paths tested |

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied
- [ ] OLLAMA service running
- [ ] All new services deployed
- [ ] Audit logging enabled
- [ ] Analytics snapshots generated
- [ ] Performance baselines set
- [ ] Monitoring configured
- [ ] Documentation updated

---

## 📚 Documentation to Update

- [ ] API documentation with new endpoints
- [ ] Architecture diagram with OLLAMA
- [ ] Database schema documentation
- [ ] Audit logging policy
- [ ] Analytics reference guide
- [ ] Performance tuning guide

---

## 💡 Future Enhancements (Post-Phase 3)

- Machine learning for call quality prediction
- Caller sentiment trend analysis
- Automatic escalation based on intent
- Multi-language support with OLLAMA
- Advanced search with semantic indexing
- Custom report generation
- Real-time alerting for critical events
- Integration with CRM systems

---

**Phase 3 readiness check:**
- ✅ Phase 1 complete (13 endpoints)
- ✅ Phase 2 complete (15 endpoints)
- ⏳ Phase 3 ready for implementation

**Estimated completion:** 3-4 working days  
**Team size:** 1 senior engineer sufficient  
**Blockers:** None identified
