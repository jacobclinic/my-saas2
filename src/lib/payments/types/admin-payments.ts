// Define payment status types
export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

// Payment interface for admin views
export interface Payment {
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
  paymentProofUrl?: string;
  notes?: string;
  verifiedDate?: string;
  rejectedDate?: string;
}

// Payment details for dialog view
export interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, reason: string) => void;
}

// Props for the payment card component
export interface PaymentCardProps {
  payment: Payment;
  onView: (payment: Payment) => void;
  onApprove?: (paymentId: string) => void;
  onReject?: (paymentId: string) => void;
}

// Response type for payment actions
export interface PaymentActionResponse {
  success: boolean;
  error?: string;
  payment?: Payment;
  payments?: Payment[];
}