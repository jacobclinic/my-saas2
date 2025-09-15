// DEPRECATED: This service has been replaced
//
// All Zoom-related functionality for student session joining has been moved to:
// ~/lib/sessions/services/student-session.service.ts - StudentSessionService
//
// The previous approach was focused on class enrollment, but the correct approach
// is to focus on individual session attendance using the student_session_attendance table.
//
// Key changes:
// - generateSecureJoinUrl() -> generateSecureSessionJoinUrl()
// - processWebhookEvent() -> processSessionWebhookEvent()
// - Uses student_session_attendance instead of student_class_enrollments
// - Tracks join_status per session instead of enrollment status per class
//
// This file is kept as a placeholder to prevent import errors during transition.

export class StudentEnrollmentService {
  constructor() {
    throw new Error(
      'StudentEnrollmentService has been deprecated. Use StudentSessionService from ~/lib/sessions/services/student-session.service.ts instead.'
    );
  }
}