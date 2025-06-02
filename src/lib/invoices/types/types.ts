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
