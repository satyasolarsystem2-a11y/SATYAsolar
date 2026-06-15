CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    message_id TEXT,
    error_message TEXT,
    reference_id TEXT
);

-- Policy to allow inserts from edge functions (service role usually bypasses RLS, but if RLS is enabled, we add basic rules)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all" ON email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON email_logs FOR SELECT USING (auth.role() = 'authenticated');
