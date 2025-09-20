-- Create student_zoom_registrations table for caching Zoom registration data
-- This table stores student registrations to enable fast join URL lookups

CREATE TABLE IF NOT EXISTS student_zoom_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  meeting_id text NOT NULL,
  registrant_id text NOT NULL,
  join_url text NOT NULL,
  registrant_status text DEFAULT 'approved' CHECK (registrant_status IN ('approved', 'pending', 'denied')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Ensure one registration per student per session
  UNIQUE(student_id, session_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_zoom_reg_student_session
ON student_zoom_registrations(student_id, session_id);

CREATE INDEX IF NOT EXISTS idx_student_zoom_reg_meeting_registrant
ON student_zoom_registrations(meeting_id, registrant_id);

CREATE INDEX IF NOT EXISTS idx_student_zoom_reg_session_id
ON student_zoom_registrations(session_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_zoom_registrations_updated_at
    BEFORE UPDATE ON student_zoom_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE student_zoom_registrations ENABLE ROW LEVEL SECURITY;

-- Students can only see their own registrations
CREATE POLICY "Students can view own registrations" ON student_zoom_registrations
    FOR SELECT USING (auth.uid() = student_id);

-- Service role can manage all registrations
CREATE POLICY "Service role can manage all registrations" ON student_zoom_registrations
    FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE student_zoom_registrations IS 'Caches Zoom meeting registrations for students to enable fast join URL lookups and reduce API calls';
COMMENT ON COLUMN student_zoom_registrations.meeting_id IS 'Zoom meeting ID from the Zoom API';
COMMENT ON COLUMN student_zoom_registrations.registrant_id IS 'Zoom registrant ID returned from registration API';
COMMENT ON COLUMN student_zoom_registrations.join_url IS 'Direct join URL for the student to join the meeting';
COMMENT ON COLUMN student_zoom_registrations.registrant_status IS 'Current status of the registration in Zoom (approved, pending, denied)';