# Replio v2 - Complete System Overhaul Plan

**Current Status:** Basic infrastructure working, core features incomplete  
**Priority:** Complete overhaul of all 8 features + integrations  
**Token Allocation:** Use fresh session for full implementation

---

## 🎯 Overview

The system has basic scaffolding but is missing:
- Complete SignalWire integration
- Complete ElevenLabs integration  
- Dashboard/Analytics endpoints
- Settings management
- Proper service classes
- Full API implementation

---

## 📋 Complete Overhaul Checklist

### 1️⃣ SIGNALWIRE INTEGRATION
**File:** `app/routers/signalwire.py`  
**Status:** ❌ Incomplete - webhook handlers exist but no full service

**What needs to be done:**
- [ ] Create `app/services/signalwire_service.py` class
  - Initialize outbound calls
  - Handle incoming call routing
  - Stream voice to ElevenLabs
  - Manage call recordings
  - Track call metadata
- [ ] Implement endpoints:
  - `POST /signalwire/calls/initiate` - Start outbound call
  - `GET /signalwire/calls/{call_id}` - Get call details
  - `POST /signalwire/calls/{call_id}/hangup` - End call
  - `GET /signalwire/calls` - List all calls
  - `POST /signalwire/webhooks/voice` - Incoming call handler
  - `POST /signalwire/webhooks/stream` - Stream handler
  - `POST /signalwire/webhooks/recording` - Recording handler
- [ ] Handle authentication with SignalWire API (already have token)
- [ ] Test webhook receiving and call initiation

---

### 2️⃣ ELEVENLABS INTEGRATION
**File:** `app/routers/elevenlabs.py`  
**Status:** ❌ Incomplete - missing service class

**What needs to be done:**
- [ ] Create `app/services/elevenlabs_service.py` class
  - Initialize agent conversations
  - Handle voice streams
  - Manage conversation history
  - Track agent responses
- [ ] Implement endpoints:
  - `POST /elevenlabs/agents/{agent_id}/connect` - Start agent
  - `POST /elevenlabs/conversations/{conv_id}/message` - Send message
  - `GET /elevenlabs/conversations/{conv_id}` - Get conversation
  - `GET /elevenlabs/conversations/{conv_id}/transcript` - Get transcript
  - `POST /elevenlabs/webhooks/events` - Event handler
- [ ] Integration with SignalWire stream
- [ ] Voice-to-text and text-to-speech handling
- [ ] Test agent responses

---

### 3️⃣ CONVERSATION MANAGEMENT
**File:** `app/routers/conversations.py`  
**Status:** ⚠️ Partially complete - basic CRUD exists

**What needs to be done:**
- [ ] Add missing endpoints:
  - `PUT /conversations/{id}` - Full update
  - `DELETE /conversations/{id}` - Delete conversation
  - `GET /conversations/{id}/transcript` - Get full transcript
  - `GET /conversations/{id}/summary` - Get AI summary
  - `POST /conversations/{id}/notes` - Add notes
  - `GET /conversations/analytics` - Analytics
- [ ] Add filtering:
  - By date range
  - By sentiment score
  - By duration
  - By outcome
- [ ] Add sorting and pagination
- [ ] Create `app/services/conversation_service.py`

---

### 4️⃣ CALLER MANAGEMENT
**File:** `app/routers/callers.py`  
**Status:** ⚠️ Partially complete - basic CRUD exists

**What needs to be done:**
- [ ] Add missing endpoints:
  - `DELETE /callers/{id}` - Delete caller
  - `GET /callers/{id}/history` - Call history
  - `GET /callers/{id}/statistics` - Caller stats
  - `POST /callers/{id}/block` - Block caller
  - `POST /callers/{id}/tags` - Manage tags
- [ ] Add filtering and search
- [ ] Add statistics calculation
- [ ] Create `app/services/caller_service.py`
- [ ] Link with conversation history

---

### 5️⃣ SETTINGS MANAGEMENT
**File:** Missing - Need to create  
**Status:** ❌ Not implemented

**What needs to be done:**
- [ ] Create `app/models/settings.py`
- [ ] Create `app/schemas/settings.py`
- [ ] Create `app/routers/settings.py`
- [ ] Create `app/services/settings_service.py`
- [ ] Implement endpoints:
  - `GET /settings` - Get all settings
  - `PUT /settings/{key}` - Update setting
  - `GET /settings/{key}` - Get specific setting
  - Settings categories:
    - Company settings
    - Phone/NumberSettings
    - AI/LLM settings
    - Notification settings
    - Integration settings

---

### 6️⃣ DASHBOARD/ANALYTICS
**File:** Missing - Need to create  
**Status:** ❌ Not implemented

**What needs to be done:**
- [ ] Create `app/routers/dashboard.py`
- [ ] Create `app/services/analytics_service.py`
- [ ] Implement endpoints:
  - `GET /dashboard/stats` - Overall statistics
  - `GET /dashboard/calls/today` - Today's calls
  - `GET /dashboard/calls/weekly` - Weekly data
  - `GET /dashboard/top-callers` - Most frequent callers
  - `GET /dashboard/sentiment-trends` - Sentiment analysis
  - `GET /dashboard/agent-performance` - Agent metrics
  - `GET /dashboard/call-metrics` - Call analytics
- [ ] Statistics to track:
  - Total calls
  - Average duration
  - Call success rate
  - Sentiment distribution
  - Peak call times
  - Agent performance

---

### 7️⃣ OLLAMA INTEGRATION
**File:** Missing - Need to create  
**Status:** ⚠️ Configured but not integrated

**What needs to be done:**
- [ ] Create `app/services/ollama_service.py`
- [ ] Implement endpoints:
  - `POST /ollama/chat` - Send prompt
  - `GET /ollama/status` - Check if running
  - `POST /ollama/summarize` - Summarize conversation
  - `POST /ollama/analyze` - Analyze sentiment/intent
- [ ] Integration points:
  - Use for conversation summaries
  - Use for intent detection
  - Use for sentiment analysis
  - Fallback when OpenAI unavailable
- [ ] Test local LLM responses

---

### 8️⃣ DATABASE SCHEMA & VALIDATION
**File:** Multiple  
**Status:** ⚠️ Tables exist but missing relationships

**What needs to be done:**
- [ ] Add missing fields to models:
  - Conversation: `summary`, `sentiment`, `intent`, `notes`
  - Caller: `tags`, `metadata`, `last_interaction`
  - Company: `settings`, `usage_metrics`
  - User: `preferences`, `role`, `permissions`
- [ ] Create new tables:
  - `settings` - Application settings
  - `analytics` - Metrics and analytics
  - `call_recordings` - Recording metadata
  - `agent_events` - Agent interaction logs
  - `audit_log` - System audit trail
- [ ] Add proper relationships and foreign keys
- [ ] Add database constraints and validations
- [ ] Create migration for new fields

---

## 🔗 Integration Points

These features must work together:

```
SignalWire (Incoming Call)
    ↓
Caller Lookup
    ↓
Create Conversation Record
    ↓
Stream to ElevenLabs Agent
    ↓
ElevenLabs Processes & Responds
    ↓
Record Conversation
    ↓
OLLAMA Summarizes (optional)
    ↓
Store in Database
    ↓
Update Dashboard/Analytics
```

---

## 📝 Files to Create/Modify

### New Files to Create:
- `app/services/signalwire_service.py`
- `app/services/elevenlabs_service.py`
- `app/services/conversation_service.py`
- `app/services/caller_service.py`
- `app/services/settings_service.py`
- `app/services/analytics_service.py`
- `app/services/ollama_service.py`
- `app/routers/settings.py`
- `app/routers/dashboard.py`
- `app/models/settings.py`
- `app/models/analytics.py`
- `app/schemas/settings.py`
- `app/schemas/analytics.py`
- Database migration file

### Files to Modify:
- `app/main.py` - Add new routers
- `app/models/caller.py` - Add missing fields
- `app/models/conversation.py` - Add missing fields
- `app/models/user.py` - Add missing fields
- `app/routers/signalwire.py` - Complete implementation
- `app/routers/elevenlabs.py` - Complete implementation
- `app/routers/conversations.py` - Add missing endpoints
- `app/routers/callers.py` - Add missing endpoints

---

## 🧪 Testing Strategy

After each feature:
1. Test API endpoint returns 200 OK
2. Test data is stored in database
3. Test integration with dependent services
4. Test error handling
5. Test with real SignalWire/ElevenLabs if available

---

## 🚀 Implementation Order

**Phase 1 (Critical):**
1. Create service classes structure
2. Complete SignalWire integration
3. Complete ElevenLabs integration
4. Conversation management completion

**Phase 2 (Important):**
5. Caller management completion
6. Dashboard/Analytics
7. Settings management

**Phase 3 (Enhancement):**
8. OLLAMA integration
9. Database schema enhancements
10. Audit logging

---

## 📊 Current System Status

✅ **Working:**
- User authentication
- Database structure
- Basic API routing
- Frontend loading
- OLLAMA running

❌ **Not Working:**
- SignalWire integration
- ElevenLabs integration
- Dashboard features
- Settings management
- Analytics endpoints

⚠️ **Partially Working:**
- Conversation CRUD (missing endpoints)
- Caller management (missing endpoints)
- Database schema (missing fields)

---

## 💾 Current Configuration

```env
SIGNALWIRE_PROJECT_ID=your-signalwire-project-id
SIGNALWIRE_API_TOKEN=your-signalwire-api-token
SIGNALWIRE_SPACE=your-space.signalwire.com
SIGNALWIRE_PHONE_NUMBER=+15550001111
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

---

## 🎯 Success Criteria

When complete:
- ✅ All 8 features fully implemented
- ✅ All endpoints tested and working
- ✅ SignalWire to ElevenLabs call flow complete
- ✅ Dashboard showing real-time data
- ✅ Settings configurable through API
- ✅ Analytics and metrics tracked
- ✅ OLLAMA integration optional but available
- ✅ Full API documentation working
- ✅ All integrations communicating properly

---

**Next Session:** Start with Phase 1 implementation, focusing on service classes and SignalWire/ElevenLabs integration first.
