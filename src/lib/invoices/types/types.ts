interface Invoice {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string | null;
  class_subject?: string | null;
  month: string;
  payment_status: 'completed' | 'pending' | 'not_paid';
  payment_proof_url: string | null;
  invoice_no: string | null;
  amount: number | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
}

interface UpdatePaymentInput {
  invoice_id: string;
  student_id: string;
  class_id: string;
  status: 'verified' | 'pending' | 'rejected';
  notes?: string;
}

interface ClassData {
  fee: number | null;
  name: string;
}

interface Enrollment {
  student_id: string;
  class_id: string;
  class: ClassData;
}

interface TutorInvoice {
  id: string;
  tutor_id: string;
  tutor_name: string;
  tutor_email: string;
  class_id: string;
  class_name: string;
  class_subject: string | null;
  class_fee: number;
  invoice_no: string | null;
  payment_period: string;
  amount: number;
  status: string | null;
  created_at: string;
  student_count?: number; // Total enrolled students
  paid_student_count?: number; // Students who have actually paid
  payment_url?: string | null; // Payment proof URL from database
}

interface TutorInvoiceSummary {
  totalAmount: number;
  issuedAmount: number;
  paidAmount: number;
  totalInvoices: number;
  issuedCount: number;
  paidCount: number;
}

export type {
  Invoice,
  UpdatePaymentInput,
  ClassData,
  Enrollment,
  TutorInvoice,
  TutorInvoiceSummary,
};
