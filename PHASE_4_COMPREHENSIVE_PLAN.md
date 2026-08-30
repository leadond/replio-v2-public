# Replio v2 - Phase 4: Complete Virtual Assistant Enhancement

**Objective:** Transform Replio v2 into the best-in-class multi-channel virtual assistant platform

**Status:** Planning Phase 4 (4A, 4B, 4C + Multi-Channel)  
**Target:** Enterprise-grade omnichannel AI assistant  
**Estimated Effort:** 4-5 days  

---

## 🎯 Phase 4 Overview

### **Core Enhancements:**
1. **Multi-Channel Support** - Calls, Emails, SMS, Web Chat
2. **Call Recording Management** - Storage, playback, analytics
3. **Escalation System** - Intelligent routing to humans
4. **Appointment Management** - Calendar integration, scheduling
5. **Knowledge Base** - Company information, context-aware responses
6. **Advanced Reporting** - Detailed analytics and reports
7. **AI Guidance** - Scripts, prompts, training
8. **Assistant Chat** - In-app AI support

---

## 📊 Phase 4A: Recording & Escalation (Critical)

### **Call Recording System**

**Database Model: CallRecording**
```sql
CREATE TABLE call_recordings (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    recording_url VARCHAR(500),
    duration_seconds INT,
    file_size_mb INT,
    storage_provider VARCHAR(50),  -- s3, local, gcs
    transcription TEXT,
    transcription_status VARCHAR(20),  -- pending, completed, failed
    storage_path VARCHAR(500),
    bitrate VARCHAR(50),
    format VARCHAR(20),  -- mp3, wav, m4a
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;
```

**RecordingService Methods:**
- `start_recording(conversation_id)` → recording_id
- `stop_recording(conversation_id)` → recording
- `get_recording(recording_id)` → metadata + stream URL
- `list_recordings(company_id, filters)` → paginated list
- `delete_recording(recording_id)` → success
- `generate_transcript(recording_id)` → transcript text
- `export_recording(recording_id, format)` → file

**API Endpoints:**
```
POST /recordings/start - Start recording
POST /recordings/{id}/stop - Stop recording
GET /recordings/{id} - Get recording info
GET /recordings/{id}/stream - Download recording
GET /recordings - List all recordings
POST /recordings/{id}/transcript - Generate transcript
DELETE /recordings/{id} - Delete recording
GET /recordings/{id}/analytics - Recording analytics
```

### **Escalation System**

**Database Model: Escalation**
```sql
CREATE TABLE escalations (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    caller_id VARCHAR(36),
    escalation_reason VARCHAR(255),
    escalation_type VARCHAR(50),  -- supervisor, transfer, callback
    assigned_to_user_id VARCHAR(36),
    status VARCHAR(20),  -- pending, in_progress, resolved, failed
    priority VARCHAR(20),  -- low, medium, high, critical
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (caller_id) REFERENCES callers(id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB;
```

**EscalationService Methods:**
- `create_escalation(conversation_id, reason, type)` → escalation
- `get_escalation(escalation_id)` → escalation details
- `list_pending_escalations(user_id)` → escalations assigned to user
- `assign_escalation(escalation_id, user_id)` → assigned escalation
- `resolve_escalation(escalation_id, resolution)` → resolved
- `get_escalation_metrics()` → stats

**API Endpoints:**
```
POST /escalations - Create escalation
GET /escalations/{id} - Get escalation
GET /escalations - List escalations (with filters)
PUT /escalations/{id}/assign - Assign to user
PUT /escalations/{id}/resolve - Resolve escalation
GET /escalations/metrics - Escalation statistics
```

---

## 📅 Phase 4B: Advanced Features

### **1. Appointment Management**

**Database Model: Appointment**
```sql
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    caller_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    scheduled_time TIMESTAMP,
    duration_minutes INT,
    location VARCHAR(255),
    status VARCHAR(50),  -- scheduled, confirmed, completed, cancelled
    appointment_type VARCHAR(50),  -- callback, consultation, service
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
) ENGINE=InnoDB;
```

**AppointmentService Methods:**
- `create_appointment(caller_id, time, details)` → appointment
- `get_appointment(appointment_id)` → appointment
- `list_appointments(filters)` → list
- `reschedule_appointment(appointment_id, new_time)` → updated
- `confirm_appointment(appointment_id)` → confirmed
- `cancel_appointment(appointment_id, reason)` → cancelled
- `send_reminders()` → reminder count
- `get_availability(date, duration)` → available slots

**API Endpoints:**
```
POST /appointments - Create appointment
GET /appointments/{id} - Get appointment
GET /appointments - List appointments
PUT /appointments/{id} - Update appointment
PUT /appointments/{id}/confirm - Confirm
PUT /appointments/{id}/cancel - Cancel
PUT /appointments/{id}/reschedule - Reschedule
GET /appointments/availability - Get free slots
POST /appointments/reminders/send - Send reminders
```

### **2. Knowledge Base**

**Database Models:**
```sql
CREATE TABLE knowledge_base (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    category VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    keywords VARCHAR(500),  -- comma-separated for search
    approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id VARCHAR(36),
    approved_at TIMESTAMP,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_category (company_id, category),
    INDEX idx_keywords (keywords),
    FULLTEXT idx_content_search (content)
) ENGINE=InnoDB;

CREATE TABLE knowledge_versions (
    id VARCHAR(36) PRIMARY KEY,
    knowledge_id VARCHAR(36) NOT NULL,
    version INT,
    content TEXT,
    changes_summary TEXT,
    created_at TIMESTAMP,
    created_by_user_id VARCHAR(36),
    FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id)
) ENGINE=InnoDB;
```

**KnowledgeBaseService Methods:**
- `create_article(company_id, title, content)` → article
- `update_article(article_id, content)` → updated
- `approve_article(article_id, user_id)` → approved
- `search_knowledge(company_id, query)` → results
- `get_article_by_category(category)` → articles
- `get_relevant_articles(conversation_context)` → suggested articles
- `get_article_version(article_id, version)` → version content
- `track_usage(article_id)` → usage stats

**API Endpoints:**
```
POST /knowledge-base - Create article
GET /knowledge-base/{id} - Get article
PUT /knowledge-base/{id} - Update article
POST /knowledge-base/{id}/approve - Approve for use
DELETE /knowledge-base/{id} - Delete article
GET /knowledge-base/search - Search articles
GET /knowledge-base/category/{category} - Get by category
GET /knowledge-base/{id}/versions - Version history
POST /knowledge-base/sync - Sync with AI agents
```

### **3. Advanced Reporting**

**Database Model: Report**
```sql
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    report_type VARCHAR(50),  -- performance, sentiment, escalation, etc
    title VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_from TIMESTAMP,
    date_to TIMESTAMP,
    data JSON,  -- report content
    status VARCHAR(20),  -- pending, completed, failed
    created_by_user_id VARCHAR(36),
    INDEX idx_company_type (company_id, report_type)
) ENGINE=InnoDB;
```

**ReportingService Methods:**
- `generate_performance_report(date_range)` → report
- `generate_sentiment_report(date_range)` → report
- `generate_escalation_report(date_range)` → report
- `generate_custom_report(filters)` → report
- `export_report(report_id, format)` → file (PDF/CSV/Excel)
- `schedule_report(frequency, recipients)` → scheduled
- `get_report(report_id)` → report data

**API Endpoints:**
```
POST /reports/generate - Generate report
GET /reports/{id} - Get report
GET /reports - List reports
POST /reports/{id}/export - Export report
POST /reports/schedule - Schedule recurring report
GET /reports/templates - Available report templates
```

---

## 🌐 Multi-Channel Support

### **Email Integration**

**Database Model: EmailMessage**
```sql
CREATE TABLE email_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    html_body TEXT,
    status VARCHAR(20),  -- received, processed, replied, failed
    ai_response TEXT,
    response_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_from_email (from_email)
) ENGINE=InnoDB;
```

**EmailService Methods:**
- `receive_email(from, to, subject, body)` → email message
- `process_email(email_id)` → AI-generated response
- `send_email_response(email_id, response)` → sent
- `get_email_thread(from_email)` → conversation
- `forward_to_agent(email_id, agent_id)` → escalated

**API Endpoints:**
```
POST /emails/receive - Receive email webhook
GET /emails/{id} - Get email
GET /emails/thread/{email} - Get conversation thread
POST /emails/{id}/reply - Send reply
POST /emails/{id}/forward - Forward to agent
```

### **SMS Integration**

**Database Model: SMSMessage**
```sql
CREATE TABLE sms_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    message_text TEXT,
    status VARCHAR(20),  -- received, processed, sent, failed
    ai_response TEXT,
    response_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_from_number (from_number)
) ENGINE=InnoDB;
```

**SMSService Methods:**
- `receive_sms(from_number, to_number, text)` → sms message
- `process_sms(sms_id)` → AI-generated response
- `send_sms_response(sms_id, response)` → sent
- `get_sms_thread(from_number)` → conversation

**API Endpoints:**
```
POST /sms/receive - Receive SMS webhook
GET /sms/{id} - Get SMS
GET /sms/thread/{number} - Get conversation
POST /sms/{id}/reply - Send SMS reply
```

### **Web Chat Integration**

**Database Model: ChatMessage**
```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    session_id VARCHAR(36),
    user_id VARCHAR(36),
    message_text TEXT,
    message_type VARCHAR(20),  -- user, agent, bot
    status VARCHAR(20),  -- sent, delivered, read
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB;
```

**ChatService Methods:**
- `create_chat_session(user_info)` → session
- `receive_message(session_id, message)` → message
- `process_message(message_id)` → AI response
- `send_response(session_id, response)` → sent
- `transfer_to_agent(session_id, agent_id)` → transferred
- `end_chat(session_id)` → closed

**API Endpoints:**
```
POST /chat/sessions - Create chat session
POST /chat/messages - Send message
GET /chat/sessions/{id} - Get chat history
POST /chat/{id}/transfer - Transfer to agent
POST /chat/{id}/end - End chat
```

---

## 🎯 Phase 4C: Polish & Enhancement

### **1. AI Guidance System**

**Database Model: Guidance**
```sql
CREATE TABLE guidance (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    guidance_type VARCHAR(50),  -- script, prompt, training
    title VARCHAR(255),
    content TEXT,
    context VARCHAR(100),  -- agent_training, call_script, etc
    approved BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_type (company_id, guidance_type)
) ENGINE=InnoDB;
```

**GuidanceService Methods:**
- `get_guidance_for_context(context)` → guidance
- `get_call_script(call_type)` → script
- `get_training_material(topic)` → training
- `suggest_guidance(conversation_context)` → suggestions

### **2. Assistant Chat**

**InAppAssistantService:**
- `answer_question(question, context)` → answer
- `get_help_topics()` → topics
- `search_help(query)` → results
- `get_user_guide(topic)` → guide

**API Endpoints:**
```
POST /assistant/chat - Chat with assistant
GET /assistant/help-topics - Available help
POST /assistant/search - Search help
GET /assistant/guide/{topic} - Get guide
```

---

## 🧠 Knowledge-Based AI Context

### **Context Injection Flow**

```
Customer Message
    ↓
Identify Topic/Intent
    ↓
Search Knowledge Base (relevant articles)
    ↓
Get Company-Approved Information
    ↓
Build Context (system prompt + knowledge)
    ↓
Send to ElevenLabs/OLLAMA with Context
    ↓
AI Generates Response (using approved knowledge)
    ↓
Validate Response (matches company policy)
    ↓
Send to Customer
    ↓
Log Usage (for analytics)
```

---

## 📱 Channel Routing

```
Incoming Message (Any Channel)
    ↓
Identify Channel (Call, Email, SMS, Chat)
    ↓
Create/Find Conversation
    ↓
Get Company Knowledge Base
    ↓
Identify Intent & Topic
    ↓
Get Relevant Knowledge Articles
    ↓
Route to Appropriate Channel Handler
    ↓
    ├─ Call → ElevenLabs (with context)
    ├─ Email → OLLAMA (text response)
    ├─ SMS → OLLAMA (text response)
    └─ Chat → OLLAMA (text response)
    ↓
AI Agent Responds (using approved knowledge)
    ↓
Store Response & Escalate if Needed
```

---

## 📊 Comprehensive Menu Structure

**After Phase 4 Implementation:**

```
WORKSPACE
├─ Dashboard
│  ├─ Overview Stats
│  ├─ Channel Metrics (Calls, Email, SMS, Chat)
│  ├─ Sentiment Trends
│  └─ Performance KPIs
├─ Inbox
│  ├─ Messages (all channels)
│  ├─ Pending Responses
│  └─ Follow-ups
├─ Callers/Contacts
│  ├─ Directory
│  ├─ Call History
│  ├─ Email History
│  ├─ SMS History
│  └─ Chat History
├─ Call Recordings
│  ├─ Recent Recordings
│  ├─ Search & Filter
│  ├─ Playback
│  └─ Transcripts
├─ Appointments
│  ├─ Calendar
│  ├─ Scheduling
│  └─ Reminders
├─ Escalations
│  ├─ Pending Escalations
│  ├─ In Progress
│  └─ Resolved
├─ Knowledge Base
│  ├─ Articles (by category)
│  ├─ Manage Articles
│  ├─ Approve Content
│  └─ Search Articles
├─ Reports
│  ├─ Performance Reports
│  ├─ Sentiment Analysis
│  ├─ Channel Analytics
│  └─ Custom Reports
├─ Audit Log
├─ Guidance
│  ├─ Scripts
│  ├─ Training
│  └─ Prompts
├─ Assistant Chat
└─ Settings
   ├─ Company Settings
   ├─ Channel Configuration
   ├─ Knowledge Base Settings
   └─ Integration Settings
```

---

## 🚀 Implementation Roadmap

### **Phase 4A (2 days):**
- [x] Call Recording System (endpoints + service)
- [x] Escalation System (endpoints + service)
- [x] API integration

### **Phase 4B (2 days):**
- [x] Appointment Management
- [x] Knowledge Base (with versioning)
- [x] Advanced Reporting

### **Phase 4C (1 day):**
- [x] Email Integration
- [x] SMS Integration
- [x] Web Chat Integration

### **Phase 4D (1 day):**
- [x] AI Guidance System
- [x] Assistant Chat
- [x] Context-aware knowledge injection

---

## 📋 Files to Create

**Models (8 new):**
- CallRecording, Escalation, Appointment
- KnowledgeBase, KnowledgeVersion
- EmailMessage, SMSMessage, ChatMessage
- Report, Guidance

**Services (9 new):**
- RecordingService, EscalationService
- AppointmentService, KnowledgeBaseService
- ReportingService, EmailService
- SMSService, ChatService, GuidanceService

**Routers (9 new):**
- recordings, escalations, appointments
- knowledge-base, reports, emails
- sms, chat, guidance

**Database:**
- 10 new tables with proper indexing
- Migration scripts

---

## 🎯 Success Criteria

- ✅ All 8 missing menu items implemented
- ✅ Multi-channel support (Calls, Email, SMS, Chat)
- ✅ Knowledge base integration
- ✅ Context-aware AI responses
- ✅ 60+ new API endpoints
- ✅ Production-ready code
- ✅ Full documentation
- ✅ Enterprise-grade features

---

**Phase 4 will transform Replio v2 into a comprehensive, multi-channel AI assistant platform with enterprise features comparable to or exceeding current market leaders.**
