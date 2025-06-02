'use client';

import React from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Badge } from '../base-v2/ui/Badge';
import {
  Calendar,
  User,
  Book,
  DollarSign,
  FileText,
  Building,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import BaseDialog from '../base-v2/BaseDialog';

interface StudentInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: {
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
  };
}

const StudentInvoiceDialog: React.FC<StudentInvoiceDialogProps> = ({
  open,
  onClose,
  invoice,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case 'not_paid':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Unpaid
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy');
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Invoice Details - ${invoice.invoice_no || `#${invoice.id.slice(0, 8)}`}`}
      maxWidth="2xl"
      showCloseButton={true}
      closeButtonText="Close"
    >
      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold">Comma Education</h3>
            </div>
            <p className="text-sm text-gray-600">123 Education Street</p>
            <p className="text-sm text-gray-600">Colombo, Sri Lanka</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">
              {invoice.invoice_no || `Invoice #${invoice.id.slice(0, 8)}`}
            </p>
            <p className="text-sm text-gray-600">
              Period: {formatPeriod(invoice.month)}
            </p>
            <div className="mt-2">{getStatusBadge(invoice.payment_status)}</div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student & Class Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium text-gray-900">
                Student & Class Details
              </h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">{invoice.student_name}</p>
                    <p className="text-sm text-gray-600">
                      Student ID: {invoice.student_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Book className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">
                      {invoice.class_name || 'Unknown Class'}
                    </p>
                    {invoice.class_subject && (
                      <p className="text-sm text-gray-600">
                        {invoice.class_subject}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Class ID: {invoice.class_id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Invoice Details</h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <DollarSign className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">
                      Rs.{' '}
                      {invoice.amount ? invoice.amount.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-600">Monthly Fee</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">{invoice.invoice_no || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Invoice Number</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">
                      {formatDate(invoice.invoice_date)}
                    </p>
                    <p className="text-sm text-gray-600">Invoice Date</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-orange-600 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">
                      {formatDate(invoice.due_date)}
                    </p>
                    <p className="text-sm text-gray-600">Due Date</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Proof Section */}
        {invoice.payment_proof_url && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Payment Proof</h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Payment Receipt</span>
                </div>
                <a
                  href={invoice.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Receipt
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Amount</span>
            <span className="text-xl font-bold text-green-600">
              Rs. {invoice.amount ? invoice.amount.toLocaleString() : '0'}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Status: {getStatusBadge(invoice.payment_status)}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default StudentInvoiceDialog;
