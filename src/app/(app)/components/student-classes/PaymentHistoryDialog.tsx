import { StudentPayment } from '~/lib/classes/types/class-v2';
import BaseDialog from '../base-v2/BaseDialog';
import { Badge } from '../base-v2/ui/Badge';

// components/classes/PaymentHistoryDialog.tsx
const PaymentHistoryDialog = ({
  open,
  onClose,
  payments,
}: {
  open: boolean;
  onClose: () => void;
  payments: StudentPayment[];
}) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Payment History"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{payment.period}</p>
              <p className="text-sm text-gray-600">Paid on {payment.date}</p>
            </div>
            <Badge
              variant={payment.status === 'paid' ? 'secondary' : 'destructive'}
            >
              {payment.status}
            </Badge>
          </div>
        ))}
      </div>
    </BaseDialog>
  );
};

export default PaymentHistoryDialog;