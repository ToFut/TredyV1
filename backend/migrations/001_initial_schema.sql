-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    usage_quota_monthly INTEGER DEFAULT 1000,
    usage_current_month INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Threads table with LTREE support
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    parent_thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500),
    selected_text TEXT,
    context_summary TEXT,
    thread_path LTREE NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table with full-text search
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'user',
    ai_model VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Thread collaborators table
CREATE TABLE thread_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB DEFAULT '{"read": true, "write": false, "invite": false}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_conversations_user_active ON conversations(user_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_threads_conversation ON threads(conversation_id, last_activity_at DESC);
CREATE INDEX idx_threads_path ON threads USING GIST (thread_path);
CREATE INDEX idx_threads_parent ON threads(parent_thread_id);
CREATE INDEX idx_messages_thread_time ON messages(thread_id, created_at);
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_search ON messages USING GIN (search_vector);
CREATE INDEX idx_collaborators_user ON thread_collaborators(user_id, last_active_at);
CREATE INDEX idx_collaborators_thread ON thread_collaborators(thread_id);

-- Update search vector automatically
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_search_trigger
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO users (id, email, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'demo@flowchat.com', 'Demo User');

INSERT INTO conversations (id, user_id, title) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Machine Learning Discussion');

INSERT INTO threads (id, conversation_id, creator_id, title, thread_path, depth) VALUES 
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Introduction to ML', '001', 0); 