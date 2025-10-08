-- Create table for storing connected accounts
CREATE TABLE user_connected_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'apple')),
  provider_user_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE user_connected_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own connected accounts" ON user_connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts" ON user_connected_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts" ON user_connected_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts" ON user_connected_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_connected_accounts_user_id ON user_connected_accounts(user_id);
CREATE INDEX idx_user_connected_accounts_provider ON user_connected_accounts(user_id, provider);
