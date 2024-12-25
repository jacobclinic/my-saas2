// types.ts

export interface ClassDetail {
  name: string;
  schedule: string;
  sessions: number;
  amount: number;
}

export interface Payment {
  id: string;
  period: string;
  generatedDate: string;
  dueDate: string;
  paidDate?: string;
  totalClasses: number;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'paid';
  transactionId?: string;
  classes: ClassDetail[];
}

export interface PaymentCardProps {
  payment: Payment;
  onViewInvoice: (payment: Payment) => void;
}

export interface InvoiceDialogProps {
  selectedInvoice: Payment | null;
  onClose: () => void;
}