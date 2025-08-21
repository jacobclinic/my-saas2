import { Database } from '~/database.types';

export type InsertEnrollmentData = Database['public']['Tables']['student_class_enrollments']['Insert'];
export type DbEnrollmentType = Database['public']['Tables']['student_class_enrollments']['Row'];

export type EnrollmentWithClass = DbEnrollmentType & {
    class: Pick<Database['public']['Tables']['classes']['Row'], 'id' | 'name' | 'fee' | 'tutor_id'>;
}