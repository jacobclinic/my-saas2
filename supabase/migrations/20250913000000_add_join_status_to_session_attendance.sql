-- Migration: Add join_status column to student_session_attendance table
-- Description: Adds tracking for student session join status to support
--              automated waiting room management and one-session policy

-- Add join_status column to track session participation status
ALTER TABLE student_session_attendance
ADD COLUMN join_status TEXT DEFAULT 'Not Joined' CHECK (join_status IN ('Not Joined', 'In Waiting Room', 'In Meeting', 'Left Meeting'));

-- Add index for efficient queries on join_status
CREATE INDEX idx_student_session_attendance_join_status ON student_session_attendance(join_status);

-- Add composite index for efficient queries by student and join status
CREATE INDEX idx_student_session_attendance_student_join_status ON student_session_attendance(student_id, join_status);

-- Add composite index for session-based queries
CREATE INDEX idx_student_session_attendance_session_join_status ON student_session_attendance(session_id, join_status);

-- Create PostgreSQL function for webhook processing
-- This function updates session attendance based on email and meeting ID
CREATE OR REPLACE FUNCTION update_student_session_status(
    p_email TEXT,
    p_meeting_id TEXT,
    p_status TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_session_id UUID;
    attendance_record_id UUID;
    rows_affected INTEGER;
BEGIN
    -- Validate status parameter
    IF p_status NOT IN ('Not Joined', 'In Waiting Room', 'In Meeting', 'Left Meeting') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Find user by email
    SELECT id INTO v_user_id
    FROM users
    WHERE email = p_email AND user_role = 'student'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Student not found with email: %', p_email;
        RETURN FALSE;
    END IF;

    -- Find session by meeting ID
    SELECT zs.session_id INTO v_session_id
    FROM zoom_sessions zs
    WHERE zs.meeting_id = p_meeting_id
    LIMIT 1;

    IF v_session_id IS NULL THEN
        RAISE NOTICE 'Session not found for meeting ID: %', p_meeting_id;
        RETURN FALSE;
    END IF;

    -- Check if attendance record exists
    SELECT id INTO attendance_record_id
    FROM student_session_attendance
    WHERE student_id = v_user_id AND session_id = v_session_id;

    IF attendance_record_id IS NULL THEN
        -- Create new attendance record
        INSERT INTO student_session_attendance (
            student_id,
            session_id,
            join_status,
            join_time,
            created_at
        ) VALUES (
            v_user_id,
            v_session_id,
            p_status,
            CASE
                WHEN p_status IN ('In Meeting', 'In Waiting Room') THEN NOW()
                ELSE NULL
            END,
            NOW()
        );

        RAISE NOTICE 'Created new attendance record with status % for student % in session %', p_status, v_user_id, v_session_id;
        RETURN TRUE;
    ELSE
        -- Update existing attendance record
        UPDATE student_session_attendance
        SET
            join_status = p_status,
            join_time = CASE
                WHEN p_status = 'In Meeting' AND join_time IS NULL THEN NOW()
                ELSE join_time
            END,
            leave_time = CASE
                WHEN p_status = 'Left Meeting' THEN NOW()
                ELSE NULL
            END
        WHERE id = attendance_record_id;

        GET DIAGNOSTICS rows_affected = ROW_COUNT;

        RAISE NOTICE 'Updated attendance record status to % for student % in session %', p_status, v_user_id, v_session_id;
        RETURN TRUE;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating session status: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION update_student_session_status(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_session_status(TEXT, TEXT, TEXT) TO service_role;

-- Create view for active session participants
CREATE OR REPLACE VIEW active_session_participants AS
SELECT
    ssa.student_id,
    u.email,
    u.first_name,
    u.last_name,
    ssa.session_id,
    s.title as session_title,
    c.name as class_name,
    ssa.join_status,
    ssa.join_time,
    ssa.created_at
FROM student_session_attendance ssa
JOIN users u ON u.id = ssa.student_id
JOIN sessions s ON s.id = ssa.session_id
JOIN classes c ON c.id = s.class_id
WHERE ssa.join_status IN ('In Waiting Room', 'In Meeting')
ORDER BY ssa.join_time DESC;

-- Grant access to the view
GRANT SELECT ON active_session_participants TO authenticated;
GRANT SELECT ON active_session_participants TO service_role;

-- Add comments for documentation
COMMENT ON COLUMN student_session_attendance.join_status IS 'Tracks student session participation status for waiting room and one-session policy';
COMMENT ON FUNCTION update_student_session_status(TEXT, TEXT, TEXT) IS 'Updates student session status based on email and meeting ID for webhook processing';
COMMENT ON VIEW active_session_participants IS 'View of all students currently in sessions for monitoring purposes';