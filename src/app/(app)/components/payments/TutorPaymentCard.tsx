'use client'

import React from 'react';
import { InvoiceDialogProps, Payment, PaymentCardProps } from '~/lib/payments/types/tutor-payments';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { 
  Search, 
  Calendar,
  Download,
  FileText,
  DollarSign,
  Info,
  Building,
  Check,
  AlertTriangle
} from 'lucide-react';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

const TutorPaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onViewInvoice,
}) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-medium">Payment for {payment.period}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <div>
              <p>Generated: {payment.generatedDate}</p>
              <p>Due Date: {payment.dueDate}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2" />
            {payment.totalClasses} classes conducted
          </div>
          <div className="space-y-1">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>
                Total Amount: Rs. {payment.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Info className="h-4 w-4 mr-2" />
              <span>
                Platform Fee (20%): Rs. {payment.platformFee.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center font-medium text-green-600">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Net Amount: Rs. {payment.netAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {payment.status === PaymentStatus.PENDING ? (
            <div className="text-sm text-amber-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Payment Pending
            </div>
          ) : (
            <div className="text-sm text-green-600 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Paid on {payment.paidDate}
            </div>
          )}
          <Button variant="outline" onClick={() => onViewInvoice(payment)}>
            <FileText className="h-4 w-4 mr-2" />
            View Invoice
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default TutorPaymentCard;