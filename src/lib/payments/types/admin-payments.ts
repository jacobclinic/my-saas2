// Define payment status types
export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  NOT_PAID = 'not_paid', // New status for invoices without payments
}

export interface PaymentWithDetails {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  tutorId: string;
  tutorName: string;
  amount: number;
  period: string;
  submittedDate: string;
  status: PaymentStatus;
  paymentProofUrl: string;
  invoiceNo?: string; // Added for invoice number
  invoiceDate?: string; // Added for invoice date
}
// Payment details for dialog view
export interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentWithDetails;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, reason: string) => void;
}

// Props for the payment card component
export interface PaymentCardProps {
  payment: PaymentWithDetails;
  onView: (payment: PaymentWithDetails) => void;
  onApprove?: (paymentId: string) => void;
  onReject?: (paymentId: string) => void;
}

// Response type for payment actions
export interface PaymentActionResponse {
  success: boolean;
  error?: string;
  payment?: PaymentWithDetails;
  payments?: PaymentWithDetails[];
}

export interface PaymentSummary {
  totalAmount: number;
  verifiedAmount: number;
  pendingAmount: number;
  notPaidAmount: number;
  rejectedAmount: number;
  totalInvoices: number;
  verifiedCount: number;
  pendingCount: number;
  notPaidCount: number;
  rejectedCount: number;
}
