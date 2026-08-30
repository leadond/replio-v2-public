-- Create companies table
CREATE TABLE IF NOT EXISTS company (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    signalwire_phone_number VARCHAR,
    elevenlabs_agent_id VARCHAR,
    google_calendar_email VARCHAR,
    google_calendar_connected BOOLEAN DEFAULT false,
    webhook_url VARCHAR,
    prompt_template TEXT,
    is_active BOOLEAN DEFAULT true,
    plan VARCHAR DEFAULT 'starter',
    subscription_status VARCHAR DEFAULT 'trialing',
    monthly_minutes_used FLOAT DEFAULT 0.0,
    monthly_minutes_limit FLOAT DEFAULT 500.0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create callers table
CREATE TABLE IF NOT EXISTS caller (
    id VARCHAR PRIMARY KEY,
    phone_number VARCHAR NOT NULL,
    name VARCHAR,
    email VARCHAR,
    company_id VARCHAR REFERENCES company(id),
    last_call_at VARCHAR,
    total_calls INT DEFAULT 0,
    total_duration_seconds FLOAT DEFAULT 0.0,
    sentiment_score FLOAT,
    notes TEXT,
    is_blocked BOOLEAN DEFAULT false,
    tags VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversation (
    id VARCHAR PRIMARY KEY,
    caller_id VARCHAR REFERENCES caller(id),
    company_id VARCHAR REFERENCES company(id),
    call_sid VARCHAR,
    elevenlabs_conversation_id VARCHAR,
    status VARCHAR DEFAULT 'in_progress',
    started_at VARCHAR,
    ended_at VARCHAR,
    duration_seconds FLOAT DEFAULT 0.0,
    outcome VARCHAR,
    transcript TEXT,
    summary TEXT,
    sentiment_score FLOAT,
    recording_url VARCHAR,
    escalation_reason VARCHAR,
    handled_by VARCHAR DEFAULT 'ai',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS message (
    id VARCHAR PRIMARY KEY,
    conversation_id VARCHAR REFERENCES conversation(id),
    role VARCHAR DEFAULT 'caller',
    content TEXT NOT NULL,
    source VARCHAR DEFAULT 'voice',
    latency_ms INT,
    confidence FLOAT,
    timestamp VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_caller_company_id ON caller(company_id);
CREATE INDEX IF NOT EXISTS idx_caller_phone_number ON caller(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_caller_id ON conversation(caller_id);
CREATE INDEX IF NOT EXISTS idx_conversation_company_id ON conversation(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_status ON conversation(status);
CREATE INDEX IF NOT EXISTS idx_message_conversation_id ON message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_company_slug ON company(slug);
